import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const apiUrl = import.meta.env.VITE_API_URL || "/graphql";

const client = new ApolloClient({
  link: new HttpLink({
    uri: apiUrl,
    credentials: "include",
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          plannerItems: {
            // Always replace plannerItems list so cache doesn't warn about merges.
            merge(_, incoming) {
              return incoming;
            },
          },
          favorites: {
            // Replace favorites list as a whole to avoid merge warnings.
            merge(_, incoming) {
              return incoming;
            },
          },
          shoppingLists: {
            // Replace shopping lists as a whole to avoid merge warnings.
            merge(_, incoming) {
              return incoming;
            },
          },
          prepPlans: {
            // Replace prep plans list as a whole to avoid merge warnings.
            merge(_, incoming) {
              return incoming;
            },
          },
          customRecipes: {
            // Replace custom recipes list as a whole to avoid merge warnings.
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network", errorPolicy: "all" },
    query: { fetchPolicy: "network-only", errorPolicy: "all" },
    mutate: { errorPolicy: "all" },
  },
});

export default client;
