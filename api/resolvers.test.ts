import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "./resolvers";

describe("API resolvers", () => {
  afterEach(() => {
    delete process.env.DEMO_EMAIL;
    vi.restoreAllMocks();
  });

  it("rejects protected queries without an authenticated user", async () => {
    await expect(
      resolvers.Query.plannerItems(null, null, { user: null })
    ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
  });

  it("logs into the configured seeded demo account without its password", async () => {
    process.env.DEMO_EMAIL = "demo@pantryplan.app";
    const demoUser = { id: "demo-user", email: "demo@pantryplan.app" };
    const setAuthCookie = vi.fn();
    const context = {
      repos: { users: { findByEmail: vi.fn().mockResolvedValue(demoUser) } },
      setAuthCookie,
    };

    await expect(
      resolvers.Mutation.demoLogin(null, null, context)
    ).resolves.toBe(true);
    expect(context.repos.users.findByEmail).toHaveBeenCalledWith(
      "demo@pantryplan.app"
    );
    expect(setAuthCookie).toHaveBeenCalledWith(demoUser);
  });

  it("enforces the daily prep-plan generation limit before calling OpenAI", async () => {
    const context = {
      user: { id: "user-1", email: "user@example.com" },
      repos: {
        usageLimits: {
          consume: vi.fn().mockResolvedValue({
            allowed: false,
            remaining: 0,
            resetAt: new Date(),
          }),
        },
      },
    };

    await expect(
      resolvers.Mutation.generatePrepPlan(null, { recipeIds: ["mealdb:1"] }, context)
    ).rejects.toMatchObject({ extensions: { code: "RATE_LIMITED" } });
  });
});
