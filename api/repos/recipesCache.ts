import type { Db, Collection } from 'mongodb';

export type Recipe = {
  id: string;
  title: string;
  image?: string | null;
  steps: string[];
  ingredients: string[];
  source?: string | null;
  timeMinutes?: number | null;
  calories?: number | null;
  cachedAt?: string;
};

export function createRecipesCacheRepo(db: Db) {
  const col: Collection<Recipe> = db.collection('recipesCache');
  col.createIndex({ id: 1 }, { unique: true }).catch(()=>{});

  return {
    async upsert(recipe: Recipe): Promise<void> {
      await col.updateOne(
        { id: recipe.id },
        { $set: { ...recipe, cachedAt: new Date().toISOString() } },
        { upsert: true }
      );
    },
    async get(id: string): Promise<Recipe | null> {
      return await col.findOne({ id });
    }
  };
}
