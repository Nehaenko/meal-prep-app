import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { MongoClient } from "mongodb";
import { createYoga, createSchema } from "graphql-yoga";
import { NoSchemaIntrospectionCustomRule } from "graphql";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { authMiddleware } from "./auth";

// import repo factories
import { createUsersRepo } from "./repos/users";
import { createPlannerRepo } from "./repos/planner";
import { createFavoritesRepo } from "./repos/favorites";
import { createRecipesCacheRepo } from "./repos/recipesCache";
import { createShoppingListsRepo } from "./repos/shoppingLists";
import { createPrepPlansRepo } from "./repos/prepPlans";
import { createCustomRecipesRepo } from "./repos/customRecipes";

const requiredEnvironmentVariables = ["MONGO_URI", "JWT_SECRET"] as const;

function validateEnvironment() {
  const missing = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim()
  );
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

async function createApplication() {
  validateEnvironment();
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

  const isProd = process.env.NODE_ENV === "production";
  const app = express();
  if (isProd) {
    app.set("trust proxy", 1);
  }
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd
        ? { maxAge: 15552000, includeSubDomains: true, preload: true }
        : false,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  // Basic CSRF protection for cross-site cookie auth:
  // require a known Origin for GraphQL POSTs in production.
  app.use((req, res, next) => {
    if (req.method === "POST" && req.path === "/graphql") {
      const origin = req.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).send("CSRF blocked: invalid origin");
      }
      if (!origin && isProd) {
        return res.status(403).send("CSRF blocked: missing origin");
      }
    }
    next();
  });
  const getOperationNames = (req: express.Request): string[] => {
    const body: any = req.body;
    const entries = Array.isArray(body) ? body : [body];
    const names: string[] = [];

    for (const entry of entries) {
      if (!entry) continue;
      if (typeof entry.operationName === "string" && entry.operationName) {
        names.push(entry.operationName);
        continue;
      }
      if (typeof entry.query === "string") {
        const match = entry.query.match(/\b(?:mutation|query)\s+([A-Za-z0-9_]+)/);
        if (match?.[1]) names.push(match[1]);
      }
    }

    return names;
  };

  const hasOperation = (req: express.Request, name: string) => {
    const target = name.toLowerCase();
    return getOperationNames(req).some((op) => op.toLowerCase() === target);
  };

  const graphqlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: express.Request) => req.method !== "POST",
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: express.Request) =>
      req.method !== "POST" ||
      (!hasOperation(req, "Login") &&
        !hasOperation(req, "SignUp") &&
        !hasOperation(req, "DemoLogin")),
  });

  const prepPlanLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: express.Request) =>
      req.method !== "POST" || !hasOperation(req, "GeneratePrepPlan"),
  });

  app.use(authMiddleware);

  const yoga = createYoga({
    schema: createSchema({ typeDefs, resolvers }),
    context: (ctx: any) => ({
      user: (ctx.req as any).user,
      setAuthCookie: (ctx.req as any).setAuthCookie,
      clearAuthCookie: (ctx.req as any).clearAuthCookie,
      repos,
    }),
    graphiql: !isProd,
    plugins: [
      {
        onValidate({ addValidationRule }: any) {
          if (isProd) {
            addValidationRule(NoSchemaIntrospectionCustomRule);
          }
        },
      },
    ],
    cors: false,
  });

  app.use("/graphql", graphqlLimiter, authLimiter, prepPlanLimiter, yoga);

  return app;
}

let applicationPromise: Promise<express.Express> | undefined;

function getApplication() {
  applicationPromise ??= createApplication();
  return applicationPromise;
}

// Export an Express application immediately so Vercel can detect and invoke it.
// Initialization is cached per warm function instance, including the MongoDB client.
const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(async (req, res, next) => {
  try {
    const initializedApp = await getApplication();
    initializedApp(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("API request failed", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 413
    ) {
      return res.status(413).json({
        error: "The request is too large. Choose a smaller recipe image.",
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () =>
    console.log(`API on http://localhost:${port}/graphql`)
  );
}
