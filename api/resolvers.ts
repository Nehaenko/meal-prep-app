// /api/resolvers.ts
import * as meals from "./adapters/themealdb";
import { generatePrepPlan as buildPrepPlan } from "./adapters/llm";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { z } from "zod";
import {
  customRecipeSchema,
  emailSchema,
  idSchema,
  plannerItemSchema,
  prepPlanSchema,
  sanitizeStringArray,
  sanitizeText,
  searchRecipesSchema,
  shoppingItemSchema,
  passwordSchema,
} from "./validation";

const BAD_CREDENTIALS = "Invalid email or password";
const PASSWORD_REQUIREMENTS =
  "Password must be at least 8 characters and include 1 number and 1 special character.";
const MANUAL_RECIPE_ID = "manual";
const MANUAL_LIST_TITLE = "Manual items";
const CUSTOM_PREFIX = "custom:";

const badInput = (message: string) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

const requireUser = (ctx: any) => {
  if (!ctx.user) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.user;
};

const parseOrThrow = <S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
  message: string
): z.infer<S> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badInput(message);
  }
  return result.data;
};

const parseAuth = (email: unknown, password: unknown, forSignup: boolean) => {
  if (!email || !password) {
    throw badInput("Email and password are required");
  }
  const emailParsed = emailSchema.safeParse(email);
  if (!emailParsed.success) {
    throw badInput(BAD_CREDENTIALS);
  }
  const passwordParsed = passwordSchema.safeParse(password);
  if (!passwordParsed.success) {
    throw badInput(forSignup ? PASSWORD_REQUIREMENTS : BAD_CREDENTIALS);
  }
  return { email: emailParsed.data as string, password: String(password) };
};

type CustomRecipeInput = {
  title: string;
  image?: string | null;
  ingredients: string[];
  steps: string[];
};

const parseCustomRecipe = (input: unknown): CustomRecipeInput =>
  parseOrThrow(customRecipeSchema, input, "Invalid recipe") as CustomRecipeInput;

type ParsedShoppingItem = {
  name: string;
  quantity?: number;
  unit?: string;
};

const UNIT_CANDIDATES = [
  "tablespoons",
  "tablespoon",
  "teaspoons",
  "teaspoon",
  "tbsp",
  "tsp",
  "ounces",
  "ounce",
  "oz",
  "pounds",
  "pound",
  "lbs",
  "lb",
  "kilograms",
  "kilogram",
  "kg",
  "grams",
  "gram",
  "g",
  "milliliters",
  "milliliter",
  "ml",
  "liters",
  "liter",
  "l",
  "cups",
  "cup",
  "cloves",
  "clove",
  "slices",
  "slice",
  "pieces",
  "piece",
  "pinches",
  "pinch",
  "dashes",
  "dash",
  "cans",
  "can",
  "packages",
  "package",
  "packets",
  "packet",
  "sticks",
  "stick",
  "bunches",
  "bunch",
  "sprigs",
  "sprig",
  "heads",
  "head",
  "fillets",
  "fillet",
  "to taste",
  "as needed",
].sort((a, b) => b.length - a.length);

function parseQuantity(input: string): { quantity?: number; rest: string } {
  const str = input.trim();
  if (!str) return { rest: "" };

  const mixed = str.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den) && den) {
      return {
        quantity: whole + num / den,
        rest: str.slice(mixed[0].length).trim(),
      };
    }
  }

  const fraction = str.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fraction) {
    const num = Number(fraction[1]);
    const den = Number(fraction[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den) {
      return { quantity: num / den, rest: str.slice(fraction[0].length).trim() };
    }
  }

  const decimal = str.match(/^(\d+(?:\.\d+)?)/);
  if (decimal) {
    const value = Number(decimal[1]);
    if (Number.isFinite(value)) {
      return { quantity: value, rest: str.slice(decimal[0].length).trim() };
    }
  }

  return { rest: str };
}

function parseIngredientLine(line: string): ParsedShoppingItem {
  const raw = (line ?? "").trim();
  if (!raw) return { name: "" };

  const { quantity, rest } = parseQuantity(raw);
  const restLower = rest.toLowerCase();

  let unit: string | undefined;
  let name = rest;

  for (const candidate of UNIT_CANDIDATES) {
    if (
      restLower === candidate ||
      restLower.startsWith(`${candidate} `)
    ) {
      unit = candidate;
      name = rest.slice(candidate.length).trim();
      break;
    }
  }

  const fallbackName = name?.trim() || raw;
  return {
    name: fallbackName,
    quantity: quantity ?? undefined,
    unit: unit || undefined,
  };
}

async function fetchRecipeById(ctx: any, id: string) {
  if (id?.startsWith(CUSTOM_PREFIX)) {
    requireUser(ctx);
    const custom = await ctx.repos.customRecipes.get(ctx.user.id, id);
    if (!custom) return null;
    await ctx.repos.recipesCache.upsert(custom);
    return custom;
  }

  const cached = await ctx.repos.recipesCache.get(id);
  if (cached) {
    const hasStepLabelPlaceholder = (cached.steps ?? []).some((step: string) =>
      /^step\s*\d+\s*$/i.test(String(step).trim())
    );
    if (cached.source === "themealdb" && hasStepLabelPlaceholder) {
      try {
        const refreshed = await meals.getRecipeById(id);
        await ctx.repos.recipesCache.upsert(refreshed);
        return refreshed;
      } catch {
        // Keep serving cached recipe if upstream fetch fails.
      }
    }
    return cached;
  }

  const fetched = await meals.getRecipeById(id);
  await ctx.repos.recipesCache.upsert(fetched);
  return fetched;
}

export const resolvers = {
  // ---------- QUERIES ----------
  Query: {
    me: (_: any, __: any, ctx: any) => {
      // ctx.user is set by auth middleware (from JWT cookie) or null
      return ctx.user || null;
    },

    plannerItems: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      return ctx.repos.planner.list(ctx.user.id);
    },

    favorites: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      const ids: string[] = await ctx.repos.favorites.listIds(ctx.user.id);
      const recipes = await Promise.all(
        ids.map(async (id) => {
          return fetchRecipeById(ctx, id);
        })
      );
      return recipes.filter(Boolean);
    },

    shoppingLists: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      return ctx.repos.shoppingLists.list(ctx.user.id);
    },

    prepPlans: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      return ctx.repos.prepPlans.list(ctx.user.id);
    },

    customRecipes: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      const recipes = await ctx.repos.customRecipes.list(ctx.user.id);
      // keep cache in sync for recipe lookups elsewhere
      await Promise.all(
        recipes.map((recipe: any) => ctx.repos.recipesCache.upsert(recipe))
      );
      return recipes;
    },

    searchRecipes: async (_: any, { ingredients, page }: any) => {
      const parsed = parseOrThrow(
        searchRecipesSchema,
        { ingredients, page: page ?? undefined },
        "Invalid search parameters"
      );
      const currentPage = parsed.page ?? 1;
      const { results, totalResults } = await meals.searchRecipes(
        parsed.ingredients,
        currentPage
      );
      // minimal card shape for results grid
      return {
        items: results.map((r) => ({
          id: `mealdb:${r.id}`,
          title: r.title,
          image: r.image,
          summary: r.summary ?? null,
          steps: [],
          ingredients: [],
          source: "themealdb",
          timeMinutes: r.readyInMinutes ?? null,
          calories: r.calories ?? null,
        })),
        page: currentPage,
        totalResults,
        totalPages: Math.max(1, Math.ceil(totalResults / meals.PAGE_SIZE)),
      };
    },

    recipe: async (_: any, { id }: any, ctx: any) => {
      const recipeId = parseOrThrow(idSchema, id, "Invalid recipe id");
      return fetchRecipeById(ctx, recipeId);
    },
  },

  // ---------- MUTATIONS ----------
  Mutation: {
    // --- AUTH ---
    signup: async (
      _: any,
      { email, password }: any,
      ctx: any
    ): Promise<boolean> => {
      const auth = parseAuth(email, password, true);

      const existing = await ctx.repos.users.findByEmail(auth.email);
      if (existing) {
        console.warn("Signup attempt for existing email");
        throw badInput("Unable to create account");
      }

      const passwordHash = await bcrypt.hash(auth.password, 12);
      const user = await ctx.repos.users.create(auth.email, passwordHash);

      if (!process.env.JWT_SECRET) {
        throw new GraphQLError("Server misconfigured", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      ctx.setAuthCookie({ id: user.id, email: user.email });
      return true;
    },

    login: async (
      _: any,
      { email, password }: any,
      ctx: any
    ): Promise<boolean> => {
      const auth = parseAuth(email, password, false);

      const user = await ctx.repos.users.findByEmail(auth.email);
      const ok = user && (await bcrypt.compare(auth.password, user.passwordHash));
      if (!ok) {
        throw badInput(BAD_CREDENTIALS);
      }

      if (!process.env.JWT_SECRET) {
        throw new GraphQLError("Server misconfigured", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      ctx.setAuthCookie({ id: user.id, email: user.email });
      return true;
    },

    demoLogin: async (_: any, __: any, ctx: any): Promise<boolean> => {
      const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
      if (!demoEmail) {
        throw new GraphQLError("Demo access is not configured", {
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }

      const user = await ctx.repos.users.findByEmail(demoEmail);
      if (!user) {
        throw new GraphQLError("Demo access is temporarily unavailable", {
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }

      ctx.setAuthCookie({ id: user.id, email: user.email });
      return true;
    },

    logout: async (_: any, __: any, ctx: any): Promise<boolean> => {
      ctx.clearAuthCookie();
      return true;
    },

    // --- APP DOMAIN ---
    addToPlanner: async (_: any, { items }: any, ctx: any) => {
      requireUser(ctx);
      const parsedItems = parseOrThrow(
        plannerItemSchema.array().min(1).max(50),
        items,
        "Invalid planner items"
      );
      return ctx.repos.planner.addMany(ctx.user.id, parsedItems);
    },

    removeFromPlanner: async (_: any, { recipeId }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, recipeId, "Invalid recipe id");
      return ctx.repos.planner.remove(ctx.user.id, parsedId);
    },

    clearPlanner: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      return ctx.repos.planner.clear(ctx.user.id);
    },

    toggleFavorite: async (_: any, { recipeId }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, recipeId, "Invalid recipe id");
      return ctx.repos.favorites.toggle(ctx.user.id, parsedId);
    },

    createCustomRecipe: async (_: any, { input }: any, ctx: any) => {
      requireUser(ctx);
      const parsed = parseCustomRecipe(input);
      const sanitized = {
        ...parsed,
        title: sanitizeText(parsed.title),
        ingredients: sanitizeStringArray(parsed.ingredients),
        steps: sanitizeStringArray(parsed.steps),
      };
      if (!sanitized.title || sanitized.ingredients.length === 0 || sanitized.steps.length === 0) {
        throw badInput("Invalid recipe");
      }
      const recipe = await ctx.repos.customRecipes.create(ctx.user.id, sanitized);
      await ctx.repos.recipesCache.upsert(recipe);
      return recipe;
    },

    updateCustomRecipe: async (_: any, { recipeId, input }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, recipeId, "Invalid recipe id");
      const parsed = parseCustomRecipe(input);
      const sanitized = {
        ...parsed,
        title: sanitizeText(parsed.title),
        ingredients: sanitizeStringArray(parsed.ingredients),
        steps: sanitizeStringArray(parsed.steps),
      };
      if (!sanitized.title || sanitized.ingredients.length === 0 || sanitized.steps.length === 0) {
        throw badInput("Invalid recipe");
      }
      const recipe = await ctx.repos.customRecipes.update(
        ctx.user.id,
        parsedId,
        sanitized
      );
      await ctx.repos.recipesCache.upsert(recipe);
      return recipe;
    },

    deleteCustomRecipe: async (_: any, { recipeId }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, recipeId, "Invalid recipe id");
      return ctx.repos.customRecipes.delete(ctx.user.id, parsedId);
    },

    createShoppingList: async (_: any, { recipeId }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, recipeId, "Invalid recipe id");
      const existing = await ctx.repos.shoppingLists.findByRecipeId(
        ctx.user.id,
        parsedId
      );
      if (existing) return existing;

      if (parsedId === MANUAL_RECIPE_ID) {
        return ctx.repos.shoppingLists.create(ctx.user.id, {
          recipeId: parsedId,
          title: MANUAL_LIST_TITLE,
          items: [],
        });
      }

      const recipe = await fetchRecipeById(ctx, parsedId);
      if (!recipe) throw new Error("Recipe not found");
      return ctx.repos.shoppingLists.create(ctx.user.id, {
        recipeId: parsedId,
        title: recipe.title,
        items: recipe.ingredients.map((line: string) => parseIngredientLine(line)),
      });
    },

    updateShoppingList: async (_: any, { listId, items }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, listId, "Invalid list id");
      const parsedItems = parseOrThrow(
        shoppingItemSchema.array().max(500),
        items,
        "Invalid shopping list items"
      );
      return ctx.repos.shoppingLists.updateItems(ctx.user.id, parsedId, parsedItems);
    },

    deleteShoppingList: async (_: any, { listId }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, listId, "Invalid list id");
      return ctx.repos.shoppingLists.delete(ctx.user.id, parsedId);
    },

    clearShoppingLists: async (_: any, __: any, ctx: any) => {
      requireUser(ctx);
      return ctx.repos.shoppingLists.clear(ctx.user.id);
    },

    generatePrepPlan: async (_: any, { recipeIds }: any, ctx: any) => {
      requireUser(ctx);
      const parsedIds = parseOrThrow(
        idSchema.array().min(1).max(50),
        recipeIds,
        "At least one recipe is required"
      );

      try {
        const recipesRaw = await Promise.all(
          parsedIds.map((id: string) => fetchRecipeById(ctx, id))
        );
        const recipes = recipesRaw.filter(Boolean);
        if (!recipes.length) {
          throw new Error("No recipes were found for this prep plan");
        }

        const steps = await buildPrepPlan(recipes);
        return steps.map((step: any, idx: number) => ({
          order: step?.order ?? idx + 1,
          description: step?.description ?? "",
          appliesToRecipeIds:
            Array.isArray(step?.appliesToRecipeIds) && step.appliesToRecipeIds.length
              ? step.appliesToRecipeIds
              : parsedIds,
        }));
      } catch (err: any) {
        console.error("generatePrepPlan failed", err);
        throw new GraphQLError(err?.message || "Failed to generate prep plan", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    savePrepPlan: async (_: any, { plan }: any, ctx: any) => {
      requireUser(ctx);
      const parsed = parseOrThrow(prepPlanSchema, plan, "Invalid prep plan");
      return ctx.repos.prepPlans.create(ctx.user.id, {
        title: parsed.title,
        recipeIds: parsed.recipeIds,
        steps: parsed.steps,
      });
    },

    deletePrepPlan: async (_: any, { planId }: any, ctx: any) => {
      requireUser(ctx);
      const parsedId = parseOrThrow(idSchema, planId, "Invalid plan id");
      return ctx.repos.prepPlans.delete(ctx.user.id, parsedId);
    },
  },
};
