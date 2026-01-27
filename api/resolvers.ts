// /api/resolvers.ts
import * as meals from "./adapters/themealdb";
import { generatePrepPlan as buildPrepPlan } from "./adapters/llm";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";

const EMAIL_IN_USE = "Email already in use";
const BAD_CREDENTIALS = "Invalid email or password";
const MANUAL_RECIPE_ID = "manual";
const MANUAL_LIST_TITLE = "Manual items";
const CUSTOM_PREFIX = "custom:";

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
    if (!ctx.user) throw new Error("Not authenticated");
    const custom = await ctx.repos.customRecipes.get(ctx.user.id, id);
    if (!custom) return null;
    await ctx.repos.recipesCache.upsert(custom);
    return custom;
  }

  const cached = await ctx.repos.recipesCache.get(id);
  if (cached) return cached;

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
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.planner.list(ctx.user.id);
    },

    favorites: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const ids: string[] = await ctx.repos.favorites.listIds(ctx.user.id);
      const recipes = await Promise.all(
        ids.map(async (id) => {
          return fetchRecipeById(ctx, id);
        })
      );
      return recipes.filter(Boolean);
    },

    shoppingLists: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.shoppingLists.list(ctx.user.id);
    },

    prepPlans: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.prepPlans.list(ctx.user.id);
    },

    customRecipes: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const recipes = await ctx.repos.customRecipes.list(ctx.user.id);
      // keep cache in sync for recipe lookups elsewhere
      await Promise.all(
        recipes.map((recipe: any) => ctx.repos.recipesCache.upsert(recipe))
      );
      return recipes;
    },

    searchRecipes: async (_: any, { ingredients, page }: any) => {
      const currentPage = page ?? 1;
      const { results, totalResults } = await meals.searchRecipes(
        ingredients,
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
      return fetchRecipeById(ctx, id);
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
      if (!email || !password) {
        throw new GraphQLError("Email and password are required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existing = await ctx.repos.users.findByEmail(email);
      if (existing) {
        throw new GraphQLError("Email already in use", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await ctx.repos.users.create(email, passwordHash);

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
      if (!email || !password) {
        throw new GraphQLError("Email and password are required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.repos.users.findByEmail(email);
      const ok = user && (await bcrypt.compare(password, user.passwordHash));
      if (!ok) {
        throw new GraphQLError("Invalid email or password", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (!process.env.JWT_SECRET) {
        throw new GraphQLError("Server misconfigured", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
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
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.planner.addMany(ctx.user.id, items);
    },

    removeFromPlanner: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.planner.remove(ctx.user.id, recipeId);
    },

    clearPlanner: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.planner.clear(ctx.user.id);
    },

    toggleFavorite: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.favorites.toggle(ctx.user.id, recipeId);
    },

    createCustomRecipe: async (_: any, { input }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const recipe = await ctx.repos.customRecipes.create(ctx.user.id, input);
      await ctx.repos.recipesCache.upsert(recipe);
      return recipe;
    },

    deleteCustomRecipe: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.customRecipes.delete(ctx.user.id, recipeId);
    },

    createShoppingList: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const existing = await ctx.repos.shoppingLists.findByRecipeId(
        ctx.user.id,
        recipeId
      );
      if (existing) return existing;

      if (recipeId === MANUAL_RECIPE_ID) {
        return ctx.repos.shoppingLists.create(ctx.user.id, {
          recipeId,
          title: MANUAL_LIST_TITLE,
          items: [],
        });
      }

      const recipe = await fetchRecipeById(ctx, recipeId);
      if (!recipe) throw new Error("Recipe not found");
      return ctx.repos.shoppingLists.create(ctx.user.id, {
        recipeId,
        title: recipe.title,
        items: recipe.ingredients.map((line: string) => parseIngredientLine(line)),
      });
    },

    updateShoppingList: async (_: any, { listId, items }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.shoppingLists.updateItems(ctx.user.id, listId, items);
    },

    deleteShoppingList: async (_: any, { listId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.shoppingLists.delete(ctx.user.id, listId);
    },

    clearShoppingLists: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.shoppingLists.clear(ctx.user.id);
    },

    generatePrepPlan: async (_: any, { recipeIds }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        throw new GraphQLError("At least one recipe is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      try {
        const recipesRaw = await Promise.all(
          recipeIds.map((id: string) => fetchRecipeById(ctx, id))
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
              : recipeIds,
        }));
      } catch (err: any) {
        console.error("generatePrepPlan failed", err);
        throw new GraphQLError(err?.message || "Failed to generate prep plan", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    savePrepPlan: async (_: any, { plan }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const recipeIds = Array.isArray(plan?.recipeIds) ? plan.recipeIds : [];
      const steps = Array.isArray(plan?.steps) ? plan.steps : [];
      if (recipeIds.length === 0 || steps.length === 0) {
        throw new GraphQLError("Recipe IDs and steps are required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      return ctx.repos.prepPlans.create(ctx.user.id, {
        title: String(plan?.title ?? "Prep plan"),
        recipeIds,
        steps,
      });
    },

    deletePrepPlan: async (_: any, { planId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.prepPlans.delete(ctx.user.id, planId);
    },
  },
};
