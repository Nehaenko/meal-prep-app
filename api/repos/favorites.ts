import type { Db, Collection } from 'mongodb';

type FavoriteDoc = { userId: string; recipeId: string; createdAt: string };

export function createFavoritesRepo(db: Db) {
  const col: Collection<FavoriteDoc> = db.collection('favorites');
  col.createIndex({ userId: 1, recipeId: 1 }, { unique: true }).catch(()=>{});

  return {
    async toggle(userId: string, recipeId: string): Promise<boolean> {
      const now = new Date().toISOString();
      try {
        await col.insertOne({ userId, recipeId, createdAt: now });
      } catch {
        await col.deleteOne({ userId, recipeId });
      }
      return true;
    },
    async listIds(userId: string): Promise<string[]> {
      const docs = await col.find({ userId }).project<{ recipeId: string }>({ recipeId: 1, _id: 0 }).toArray();
      return docs.map(d => d.recipeId);
    }
  };
}
