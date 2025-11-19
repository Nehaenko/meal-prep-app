// /api/resolvers.ts
import * as meals from "./adapters/themealdb";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";

const EMAIL_IN_USE = "Email already in use";
const BAD_CREDENTIALS = "Invalid email or password";

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

    shoppingLists: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return ctx.repos.shoppingLists.list(ctx.user.id);
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
      const cached = await ctx.repos.recipesCache.get(id);
      if (cached) return cached;
      const full = await meals.getRecipeById(id);
      await ctx.repos.recipesCache.upsert(full);
      return full;
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

    createShoppingList: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const recipe =
        (await ctx.repos.recipesCache.get(recipeId)) ||
        (await meals.getRecipeById(recipeId));
      await ctx.repos.recipesCache.upsert(recipe);
      return ctx.repos.shoppingLists.create(ctx.user.id, {
        recipeId,
        title: recipe.title,
        items: recipe.ingredients.map((n: string) => ({ name: n })),
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
  },
};
