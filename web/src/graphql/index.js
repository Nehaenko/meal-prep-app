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
