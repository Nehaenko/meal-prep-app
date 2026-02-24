// /api/repos/shoppingLists.ts
import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'crypto';

export type ShoppingItem = {
  name: string;
  quantity?: number;
  unit?: string;
  substitutes?: string[];
  note?: string;
};

export type ShoppingList = {
  id: string;
  userId: string;
  recipeId: string;
  title: string;
  items: ShoppingItem[];
  createdAt: string;
};

function normalizeItems(items: ShoppingItem[]): ShoppingItem[] {
  return (items ?? [])
    .filter((i) => i?.name?.trim())
    .map((i) => ({
      ...i,
      name: i.name.trim().toLowerCase(),
      note: i.note?.trim() || undefined,
    }));
}

export function createShoppingListsRepo(db: Db) {
  const col: Collection<ShoppingList> = db.collection('shoppingLists');

  // helpful indexes
  col.createIndex({ userId: 1, recipeId: 1 }).catch(() => {});
  col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {});

  return {
    async findByRecipeId(
      userId: string,
      recipeId: string
    ): Promise<ShoppingList | null> {
      return col.findOne({ userId, recipeId });
    },

    async create(
      userId: string,
      data: { recipeId: string; title: string; items?: ShoppingItem[] }
    ): Promise<ShoppingList> {
      const now = new Date().toISOString();
      const list: ShoppingList = {
        id: randomUUID(),
        userId,
        recipeId: data.recipeId,
        title: data.title,
        items: normalizeItems(data.items ?? []),
        createdAt: now,
      };
      await col.insertOne(list);
      return list;
    },

    // Use updateOne + findOne to avoid driver overload/type differences
    async updateItems(
      userId: string,
      listId: string,
      items: ShoppingItem[]
    ): Promise<ShoppingList> {
      await col.updateOne(
        { userId, id: listId },
        { $set: { items: normalizeItems(items) } }
      );

      const updated = await col.findOne({ userId, id: listId });
      if (!updated) {
        throw new Error('List not found');
      }
      return updated;
    },

    async delete(userId: string, listId: string): Promise<boolean> {
      await col.deleteOne({ userId, id: listId });
      return true;
    },

    async clear(userId: string): Promise<boolean> {
      await col.deleteMany({ userId });
      return true;
    },

    async list(userId: string): Promise<ShoppingList[]> {
      return col.find({ userId }).sort({ createdAt: -1 }).toArray();
    },
  };
}
