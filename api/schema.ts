export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Recipe {
    id: ID!
    title: String!
    summary: String
    image: String
    steps: [String!]!
    ingredients: [String!]!
    source: String
    timeMinutes: Int
    calories: Int
  }
  type PlannerItem {
    id: ID!
    recipeId: ID!
    servings: Int!
    createdAt: String!
  }
  type ShoppingItem {
    name: String!
    quantity: Float
    unit: String
    substitutes: [String!]
  }
  type ShoppingList {
    id: ID!
    recipeId: ID!
    title: String!
    items: [ShoppingItem!]!
    createdAt: String!
  }
  type PrepStep {
    order: Int!
    description: String!
    appliesToRecipeIds: [ID!]!
  }
  type User {
    id: ID!
    email: String!
  }

  input PlannerItemInput {
    recipeId: ID!
    servings: Int!
  }
  input ShoppingItemInput {
    name: String!
    quantity: Float
    unit: String
    substitutes: [String!]
  }

  type RecipeSearchResult {
    items: [Recipe!]!
    page: Int!
    totalResults: Int!
    totalPages: Int!
  }

  type Query {
    me: User
    searchRecipes(ingredients: [String!]!, page: Int): RecipeSearchResult!
    recipe(id: ID!): Recipe
    plannerItems: [PlannerItem!]!
    favorites: [Recipe!]!
    shoppingLists: [ShoppingList!]!
  }

  type Mutation {
    signup(email: String!, password: String!): Boolean!
    login(email: String!, password: String!): Boolean!
    logout: Boolean!

    addToPlanner(items: [PlannerItemInput!]!): [PlannerItem!]!
    removeFromPlanner(recipeId: ID!): Boolean!
    clearPlanner: Boolean!
    toggleFavorite(recipeId: ID!): Boolean!

    createShoppingList(recipeId: ID!): ShoppingList!
    updateShoppingList(listId: ID!, items: [ShoppingItemInput!]!): ShoppingList!
    deleteShoppingList(listId: ID!): Boolean!

    generatePrepPlan(recipeIds: [ID!]!): [PrepStep!]!
    generateShoppingList(
      recipeIds: [ID!]!
      pantry: [String!]!
    ): [ShoppingItem!]!
  }
`;
