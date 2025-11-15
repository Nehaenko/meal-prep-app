// /api/resolvers.ts
import * as spoon from './adapters/spoonacular';
import bcrypt from 'bcryptjs';

const EMAIL_IN_USE = 'Email already in use';
const BAD_CREDENTIALS = 'Invalid email or password';

export const resolvers = {
  // ---------- QUERIES ----------
  Query: {
    me: (_: any, __: any, ctx: any) => {
      // ctx.user is set by auth middleware (from JWT cookie) or null
      return ctx.user || null;
    },

    plannerItems: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.planner.list(ctx.user.id);
    },

    shoppingLists: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.shoppingLists.list(ctx.user.id);
    },

    searchRecipes: async (_: any, { ingredients, page }: any) => {
      const res = await spoon.searchRecipes(ingredients, page ?? 1);
      // minimal card shape for results grid
      return res.map((r) => ({
        id: `spoon:${r.id}`,
        title: r.title,
        image: r.image,
        steps: [],
        ingredients: [],
        source: 'spoonacular',
        timeMinutes: r.readyInMinutes ?? null,
        calories: null,
      }));
    },

    recipe: async (_: any, { id }: any, ctx: any) => {
      const cached = await ctx.repos.recipesCache.get(id);
      if (cached) return cached;
      const full = await spoon.getRecipeById(id);
      await ctx.repos.recipesCache.upsert(full);
      return full;
    },
  },

  // ---------- MUTATIONS ----------
  Mutation: {
    // --- AUTH ---
    signup: async (_: any, { email, password }: any, ctx: any): Promise<boolean> => {
      if (!email || !password) throw new Error('Email and password are required');
      const existing = await ctx.repos.users.findByEmail(email);
      if (existing) throw new Error(EMAIL_IN_USE);

      // hash password (bcryptjs is pure JS; saltRounds = 10 is fine for dev)
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await ctx.repos.users.create(email, passwordHash);

      if (!process.env.JWT_SECRET) throw new Error('Server misconfigured (JWT_SECRET missing)');
      ctx.setAuthCookie({ id: user.id, email: user.email });
      return true;
    },

    login: async (_: any, { email, password }: any, ctx: any): Promise<boolean> => {
      if (!email || !password) throw new Error('Email and password are required');
      const user = await ctx.repos.users.findByEmail(email);
      if (!user) throw new Error(BAD_CREDENTIALS);

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error(BAD_CREDENTIALS);

      if (!process.env.JWT_SECRET) throw new Error('Server misconfigured (JWT_SECRET missing)');
      ctx.setAuthCookie({ id: user.id, email: user.email });
      return true;
    },

    logout: async (_: any, __: any, ctx: any): Promise<boolean> => {
      ctx.clearAuthCookie();
      return true;
    },

    // --- APP DOMAIN ---
    addToPlanner: async (_: any, { items }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.planner.addMany(ctx.user.id, items);
    },

    removeFromPlanner: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.planner.remove(ctx.user.id, recipeId);
    },

    clearPlanner: async (_: any, __: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.planner.clear(ctx.user.id);
    },

    toggleFavorite: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.favorites.toggle(ctx.user.id, recipeId);
    },

    createShoppingList: async (_: any, { recipeId }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      const recipe =
        (await ctx.repos.recipesCache.get(recipeId)) ||
        (await spoon.getRecipeById(recipeId));
      await ctx.repos.recipesCache.upsert(recipe);
      return ctx.repos.shoppingLists.create(ctx.user.id, {
        recipeId,
        title: recipe.title,
        items: recipe.ingredients.map((n: string) => ({ name: n })),
      });
    },

    updateShoppingList: async (_: any, { listId, items }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.shoppingLists.updateItems(ctx.user.id, listId, items);
    },

    deleteShoppingList: async (_: any, { listId }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.shoppingLists.delete(ctx.user.id, listId);
    },
  },
};
