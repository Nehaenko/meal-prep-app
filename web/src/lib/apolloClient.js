import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_API_URL,
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
