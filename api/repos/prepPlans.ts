import type { Collection, Db } from "mongodb";
import { randomUUID } from "crypto";

export type PrepStep = {
  order: number;
  description: string;
  appliesToRecipeIds: string[];
};

export type PrepPlan = {
  id: string;
  userId: string;
  title: string;
  recipeIds: string[];
  steps: PrepStep[];
  createdAt: string;
  updatedAt: string;
};

function normalizeSteps(steps: PrepStep[]): PrepStep[] {
  return (steps ?? [])
    .filter((step) => step?.description?.trim())
    .map((step, index) => ({
      order: Number.isFinite(step?.order) ? Number(step.order) : index + 1,
      description: String(step.description).trim(),
      appliesToRecipeIds: Array.isArray(step?.appliesToRecipeIds)
        ? step.appliesToRecipeIds.filter(Boolean)
        : [],
    }));
}

export function createPrepPlansRepo(db: Db) {
  const col: Collection<PrepPlan> = db.collection("prepPlans");

  col.createIndex({ userId: 1, createdAt: -1 }).catch(() => {});

  return {
    async list(userId: string): Promise<PrepPlan[]> {
      return col.find({ userId }).sort({ createdAt: -1 }).toArray();
    },

    async create(
      userId: string,
      data: { title: string; recipeIds: string[]; steps: PrepStep[] }
    ): Promise<PrepPlan> {
      const now = new Date().toISOString();
      const plan: PrepPlan = {
        id: randomUUID(),
        userId,
        title: data.title?.trim() || "Prep plan",
        recipeIds: Array.isArray(data.recipeIds) ? data.recipeIds : [],
        steps: normalizeSteps(data.steps),
        createdAt: now,
        updatedAt: now,
      };
      await col.insertOne(plan);
      return plan;
    },

    async delete(userId: string, planId: string): Promise<boolean> {
      await col.deleteOne({ userId, id: planId });
      return true;
    },
  };
}

