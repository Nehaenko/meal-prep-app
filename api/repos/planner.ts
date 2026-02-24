import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'crypto';

export type PlannerItem = { id: string; userId: string; recipeId: string; servings: number; createdAt: string };

export function createPlannerRepo(db: Db) {
  const col: Collection<PlannerItem> = db.collection('plannerItems');
  col.createIndex({ userId: 1, createdAt: -1 }).catch(()=>{});

  return {
    async addMany(userId: string, items: Array<{ recipeId: string; servings: number }>): Promise<PlannerItem[]> {
      const now = new Date().toISOString();
      const docs = items.map(i => ({
        id: randomUUID(),
        userId,
        recipeId: i.recipeId,
        servings: Math.max(1, i.servings),
        createdAt: now
      }));
      if (docs.length) await col.insertMany(docs);
      return docs;
    },
    async remove(userId: string, recipeId: string): Promise<boolean> {
      await col.deleteMany({ userId, recipeId });
      return true;
    },
    async clear(userId: string): Promise<boolean> {
      await col.deleteMany({ userId });
      return true;
    },
    async list(userId: string): Promise<PlannerItem[]> {
      return await col.find({ userId }).sort({ createdAt: -1 }).toArray();
    }
  };
}
