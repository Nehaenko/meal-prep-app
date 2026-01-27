import { gql } from "graphql-tag";

export const Me = gql`
  query Me {
    me {
      id
      email
    }
  }
`;

export const SignUp = gql`
  mutation SignUp($email: String!, $password: String!) {
    signup(email: $email, password: $password)
  }
`;

export const Login = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const LogOut = gql`
  mutation Logout {
    logout
  }
`;

export const SearchRecipes = gql`
  query SearchRecipes($ingredients: [String!]!, $page: Int) {
    searchRecipes(ingredients: $ingredients, page: $page) {
      page
      totalPages
      totalResults
      items {
        id
        title
        summary
        image
        timeMinutes
        calories
      }
    }
  }
`;

export const Recipe = gql`
  query Recipe($id: ID!) {
    recipe(id: $id) {
      id
      title
      summary
      image
      ingredients
      steps
      timeMinutes
      calories
      source
    }
  }
`;

export const AddToPlanner = gql`
  mutation AddToPlanner($items: [PlannerItemInput!]!) {
    addToPlanner(items: $items) {
      id
      recipeId
      servings
      createdAt
    }
  }
`;

export const RemoveFromPlanner = gql`
  mutation RemoveFromPlanner($recipeId: ID!) {
    removeFromPlanner(recipeId: $recipeId)
  }
`;

export const ClearPlanner = gql`
  mutation ClearPlanner {
    clearPlanner
  }
`;

export const GeneratePrepPlan = gql`
  mutation GeneratePrepPlan($recipeIds: [ID!]!) {
    generatePrepPlan(recipeIds: $recipeIds) {
      order
      description
      appliesToRecipeIds
    }
  }
`;

export const PrepPlans = gql`
  query PrepPlans {
    prepPlans {
      id
      title
      recipeIds
      createdAt
      updatedAt
      steps {
        order
        description
        appliesToRecipeIds
      }
    }
  }
`;

export const SavePrepPlan = gql`
  mutation SavePrepPlan($plan: PrepPlanInput!) {
    savePrepPlan(plan: $plan) {
      id
      title
      recipeIds
      createdAt
      updatedAt
      steps {
        order
        description
        appliesToRecipeIds
      }
    }
  }
`;

export const DeletePrepPlan = gql`
  mutation DeletePrepPlan($planId: ID!) {
    deletePrepPlan(planId: $planId)
  }
`;

export const CustomRecipes = gql`
  query CustomRecipes {
    customRecipes {
      id
      title
      image
      ingredients
      steps
      source
      timeMinutes
      calories
      summary
    }
  }
`;

export const CreateCustomRecipe = gql`
  mutation CreateCustomRecipe($input: CustomRecipeInput!) {
    createCustomRecipe(input: $input) {
      id
      title
      image
      ingredients
      steps
      source
      timeMinutes
      calories
      summary
    }
  }
`;

export const DeleteCustomRecipe = gql`
  mutation DeleteCustomRecipe($recipeId: ID!) {
    deleteCustomRecipe(recipeId: $recipeId)
  }
`;

export const PlannerItems = gql`
  query PlannerItems {
    plannerItems {
      id
      recipeId
      servings
      createdAt
    }
  }
`;

export const Favorites = gql`
  query Favorites {
    favorites {
      id
      title
      summary
      image
      steps
      ingredients
      source
      timeMinutes
      calories
    }
  }
`;

export const ToggleFavorite = gql`
  mutation ToggleFavorite($recipeId: ID!) {
    toggleFavorite(recipeId: $recipeId)
  }
`;

export const ShoppingLists = gql`
  query ShoppingLists {
    shoppingLists {
      id
      recipeId
      title
      createdAt
      items {
        name
        quantity
        unit
        substitutes
        note
      }
    }
  }
`;

export const CreateShoppingList = gql`
  mutation CreateShoppingList($recipeId: ID!) {
    createShoppingList(recipeId: $recipeId) {
      id
      recipeId
      title
      createdAt
      items {
        name
        quantity
        unit
        substitutes
        note
      }
    }
  }
`;

export const UpdateShoppingList = gql`
  mutation UpdateShoppingList($listId: ID!, $items: [ShoppingItemInput!]!) {
    updateShoppingList(listId: $listId, items: $items) {
      id
      recipeId
      title
      createdAt
      items {
        name
        quantity
        unit
        substitutes
        note
      }
    }
  }
`;

export const DeleteShoppingList = gql`
  mutation DeleteShoppingList($listId: ID!) {
    deleteShoppingList(listId: $listId)
  }
`;

export const ClearShoppingLists = gql`
  mutation ClearShoppingLists {
    clearShoppingLists
  }
`;
