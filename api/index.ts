import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MongoClient } from "mongodb";
import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { authMiddleware, getUserFromReq } from "./auth";

// import repo factories
import { createUsersRepo } from "./repos/users";
import { createPlannerRepo } from "./repos/planner";
import { createFavoritesRepo } from "./repos/favorites";
import { createRecipesCacheRepo } from "./repos/recipesCache";
import { createShoppingListsRepo } from "./repos/shoppingLists";
import { createPrepPlansRepo } from "./repos/prepPlans";
import { createCustomRecipesRepo } from "./repos/customRecipes";

async function main() {
  const client = await new MongoClient(
    process.env.MONGO_URI as string
  ).connect();
  const db = client.db(); // default DB from URI

  // build repos (Mongo-backed)
  const repos = {
    users: createUsersRepo(db),
    planner: createPlannerRepo(db),
    favorites: createFavoritesRepo(db),
    recipesCache: createRecipesCacheRepo(db),
    shoppingLists: createShoppingListsRepo(db),
    prepPlans: createPrepPlansRepo(db),
    customRecipes: createCustomRecipesRepo(db),
  };

  const app = express();
  app.use(cookieParser());
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(authMiddleware);

  const yoga = createYoga({
    schema: createSchema({ typeDefs, resolvers }),
    context: (ctx: any) => ({
      user: (ctx.req as any).user,
      setAuthCookie: (ctx.req as any).setAuthCookie,
      clearAuthCookie: (ctx.req as any).clearAuthCookie,
      repos,
    }),
    cors: false,
  });

  app.use("/graphql", yoga);

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () =>
    console.log(`API on http://localhost:${port}/graphql`)
  );
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
