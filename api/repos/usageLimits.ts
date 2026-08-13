import type { Collection, Db } from "mongodb";

type UsageCounter = {
  key: string;
  count: number;
  expiresAt: Date;
};

export function createUsageLimitsRepo(db: Db) {
  const col: Collection<UsageCounter> = db.collection("usageLimits");
  col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});

  return {
    async consume(
      namespace: string,
      subject: string,
      limit: number,
      windowMs: number
    ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const resetAt = new Date(windowStart + windowMs);
      const key = `${namespace}:${subject}:${windowStart}`;
      const counter = await col.findOneAndUpdate(
        { key },
        {
          $inc: { count: 1 },
          $setOnInsert: { key, expiresAt: resetAt },
        },
        { upsert: true, returnDocument: "after" }
      );
      const count = counter?.count ?? limit + 1;
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
      };
    },
  };
}
