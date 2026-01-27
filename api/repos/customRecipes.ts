import type { Collection, Db } from "mongodb";
import { randomUUID } from "crypto";

export type CustomRecipe = {
  id: string;
  userId: string;
  title: string;
  image?: string | null;
  ingredients: string[];
  steps: string[];
  source: "custom";
  createdAt: string;
  updatedAt: string;
};

function normalizeList(values: string[]): string[] {
  return (values ?? []).map((value) => String(value ?? "").trim()).filter(Boolean);
}

export function createCustomRecipesRepo(db: Db) {
  const col: Collection<CustomRecipe> = db.collection("customRecipes");

  col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {});
  col.createIndex({ userId: 1, id: 1 }, { unique: true }).catch(() => {});

  return {
    async list(userId: string): Promise<CustomRecipe[]> {
      return col.find({ userId }).sort({ createdAt: -1 }).toArray();
    },

    async get(userId: string, id: string): Promise<CustomRecipe | null> {
      return col.findOne({ userId, id });
    },

    async create(
      userId: string,
      data: { title: string; image?: string | null; ingredients: string[]; steps: string[] }
    ): Promise<CustomRecipe> {
      const now = new Date().toISOString();
      const recipe: CustomRecipe = {
        id: `custom:${randomUUID()}`,
        userId,
        title: data.title?.trim() || "Custom recipe",
        image: data.image ?? null,
        ingredients: normalizeList(data.ingredients),
        steps: normalizeList(data.steps),
        source: "custom",
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(recipe);
      return recipe;
    },

    async delete(userId: string, id: string): Promise<boolean> {
      await col.deleteOne({ userId, id });
      return true;
    },
  };
}

