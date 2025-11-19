### Meal prep App Specifications

**Core Types (conceptual)**

- `Recipe { id, title, image, steps[], ingredients[], source, timeMinutes, callories }`
- `PlannerItem { id, recipeId, servings, createdAt }`
- `PrepStep { order, description, appliesToRecipeIds[] }`
- `ShoppingList { id, recipeId, title, items: [ShoppingItem!]!, createdAt }`
- `ShoppingItem { name, quantity, unit, substitutes[] }`

**Queries**

- `searchRecipes(ingredients: [String!]!, page: Int): RecipeSearchResult!`
- `recipe(id: ID!): Recipe`
- `plannerItems: [PlannerItem!]!`
- `favorites: [Recipe!]!`
- `shoppingLists: [ShoppingList!]!` ← feeds the floating modal

**Mutations**

- `addToPlanner(items: [PlannerItemInput!]!): [PlannerItem!]!`
- `removeFromPlanner(recipeId: ID!): Boolean!`
- `clearPlanner: Boolean!`
- `toggleFavorite(recipeId: ID!): Boolean!`
- `generatePrepPlan(recipeIds: [ID!]!): [PrepStep!]!`
- `generateShoppingList(recipeIds: [ID!]!, pantry: [String!]!): [ShoppingItem!]!`
- **(per-recipe lists):**
    - `createShoppingList(recipeId: ID!): ShoppingList!` *(server computes “missing” = recipe.ingredients − pantry/initial query)*
    - `updateShoppingList(listId: ID!, items: [ShoppingItemInput!]!): ShoppingList!`
    - `deleteShoppingList(listId: ID!): Boolean!`
- `signup(email, password)`, `login(email, password)`, `logout`

### Tech in use

- DB: MongoDB (native Node driver, no Mongoose)
- Recipe API: TheMealDB
- LLM: for prep-plan merging & substitutions

```mermaid
flowchart LR
  user[User]
  web[React + Router + Apollo Client]
  api[Express + GraphQL Yoga]
  db[(MongoDB)]
  mealdb[TheMealDB API]
  llm[LLM Provider]

  user --> web
  web -->|GraphQL| api
  api --> db
  api --> mealdb
  api --> llm
```

```mermaid
flowchart TB
  subgraph API[Express + GraphQL Yoga]
    schema[GraphQL Schema]
    resolvers[Resolvers]
    auth[Auth Middleware]
    adapters[[Adapters: TheMealDB / LLM]]
    repos[[Repositories: users, plannerItems, favorites, recipesCache, shoppingLists]]
  end
  schema --> resolvers
  resolvers --> auth
  resolvers --> repos
  resolvers --> adapters
```

```mermaid
sequenceDiagram
  participant UI as React UI
  participant GQL as GraphQL Yoga
  participant Repo as Mongo (recipesCache, shoppingLists)
  participant MealDB as TheMealDB

  UI->>GQL: createShoppingList(recipeId)
  GQL->>Repo: find recipe in recipesCache
  alt cache miss
    GQL->>MealDB: fetch recipe details
    MealDB-->>GQL: recipe
    GQL->>Repo: upsert recipe in recipesCache
  end
  GQL->>GQL: compute missing = ingredients − (pantry ∪ initial search)
  GQL->>Repo: insert shoppingList {title, items}
  Repo-->>GQL: shoppingList
  GQL-->>UI: ShoppingList
```

```mermaid
erDiagram
  USERS {
    ObjectId _id
    string email
    string passwordHash
    date createdAt
  }
  PLANNERITEMS {
    ObjectId _id
    ObjectId userId
    string recipeId
    int servings
    date createdAt
  }
  FAVORITES {
    ObjectId _id
    ObjectId userId
    string recipeId
    date createdAt
  }
  RECIPESCACHE {
    string _id  "provider:externalId"
    string provider
    string externalId
    string title
    string image
    string[] ingredients
    string[] steps
    int timeMinutes
    date cachedAt
  }
  SHOPPINGLISTS {
    ObjectId _id
    ObjectId userId
    string recipeId
    string title
    json items  "name, quantity?, unit?, substitutes[]"
    date createdAt
  }

  USERS ||--o{ PLANNERITEMS : owns
  USERS ||--o{ FAVORITES : stars
  USERS ||--o{ SHOPPINGLISTS : has
  RECIPESCACHE ||--o{ PLANNERITEMS : references
  RECIPESCACHE ||--o{ SHOPPINGLISTS : references
```
