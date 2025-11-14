import * as spoon from './adapters/spoonacular';

export const resolvers = {
  Query: {
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
      return res.map(r => ({
        id: `spoon:${r.id}`,
        title: r.title,
        image: r.image,
        steps: [],
        ingredients: [],
        source: 'spoonacular',
        timeMinutes: r.readyInMinutes ?? null,
        calories: null
      }));
    },
    recipe: async (_: any, { id }: any, ctx: any) => {
      const cached = await ctx.repos.recipesCache.get(id);
      if (cached) return cached;
      const full = await spoon.getRecipeById(id);
      await ctx.repos.recipesCache.upsert(full);
      return full;
    }
  },
  Mutation: {
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
      const recipe = await ctx.repos.recipesCache.get(recipeId) || await spoon.getRecipeById(recipeId);
      await ctx.repos.recipesCache.upsert(recipe);
      return ctx.repos.shoppingLists.create(ctx.user.id, {
        recipeId,
        title: recipe.title,
        items: recipe.ingredients.map((n: string) => ({ name: n }))
      });
    },
    updateShoppingList: async (_: any, { listId, items }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.shoppingLists.updateItems(ctx.user.id, listId, items);
    },
    deleteShoppingList: async (_: any, { listId }: any, ctx: any) => {
      if (!ctx.user) throw new Error('Not authenticated');
      return ctx.repos.shoppingLists.delete(ctx.user.id, listId);
    }
  }
};
