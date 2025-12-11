import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useApolloClient } from "@apollo/client/react";
import { Favorites, ToggleFavorite } from "../graphql/index";
import { useAuth } from "./AuthContext";

const FavouritesContext = createContext(null);

function extractMessage(errOrArr) {
  const error = Array.isArray(errOrArr) ? errOrArr[0] : errOrArr;
  const graphQLErrors = error?.graphQLErrors?.[0]?.message;
  const networkError = error?.networkError?.message;
  const message = error?.message;
  return graphQLErrors || networkError || message || "Something went wrong";
}

export function FavouritesProvider({ children }) {
  const client = useApolloClient();
  const { user, loading: authLoading } = useAuth();
  const [favouritesItems, setFavouritesItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFavouritesItems = useCallback(async () => {
    if (!user) {
      setFavouritesItems([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.query({
        query: Favorites,
        fetchPolicy: "network-only",
      });
      setFavouritesItems(data.favorites ?? []);
    } catch {
      setFavouritesItems([]);
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setFavouritesItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFavouritesItems();
  }, [user, authLoading, fetchFavouritesItems]);

  const toggleFavourites = async (recipeId) => {
    if (!user) return;
    setLoading(true);
    try {
      await client.mutate({
        mutation: ToggleFavorite,
        variables: { recipeId },
      });
      await fetchFavouritesItems();
    } catch (err) {
      throw new Error(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FavouritesContext.Provider
      value={{
        favouritesItems,
        loading,
        toggleFavourites,
        fetchFavouritesItems,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) {
    // Fallback for components rendered without provider (e.g., isolated tests)
    return {
      favouritesItems: [],
      loading: false,
      toggleFavourites: async () => {},
      fetchFavouritesItems: async () => {},
    };
  }
  return ctx;
}
