import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useApolloClient } from "@apollo/client/react";
import { CreateCustomRecipe, CustomRecipes, DeleteCustomRecipe } from "../graphql";
import { useAuth } from "./AuthContext";

const CustomRecipesContext = createContext(null);

function extractMessage(errOrArr) {
  const error = Array.isArray(errOrArr) ? errOrArr[0] : errOrArr;
  const graphQLErrors = error?.graphQLErrors?.[0]?.message;
  const networkError = error?.networkError?.message;
  const message = error?.message;
  return graphQLErrors || networkError || message || "Something went wrong";
}

function normalizeList(values) {
  return (values ?? [])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function sanitizeInput(input) {
  return {
    title: String(input?.title ?? "").trim(),
    image: input?.image ?? null,
    ingredients: normalizeList(input?.ingredients),
    steps: normalizeList(input?.steps),
  };
}

export function CustomRecipesProvider({ children }) {
  const client = useApolloClient();
  const { user, loading: authLoading } = useAuth();
  const [customRecipes, setCustomRecipes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCustomRecipes = useCallback(async () => {
    if (!user) {
      setCustomRecipes([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.query({
        query: CustomRecipes,
        fetchPolicy: "network-only",
      });
      setCustomRecipes(data.customRecipes ?? []);
    } catch {
      setCustomRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCustomRecipes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCustomRecipes();
  }, [user, authLoading, fetchCustomRecipes]);

  const createCustomRecipe = useCallback(async (input) => {
    setSaving(true);
    try {
      const sanitized = sanitizeInput(input);
      const res = await client.mutate({
        mutation: CreateCustomRecipe,
        variables: { input: sanitized },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      const created = res.data?.createCustomRecipe ?? null;
      if (created) {
        setCustomRecipes((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          return [created, ...base.filter((recipe) => recipe.id !== created.id)];
        });
      }
      return created;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  }, [client]);

  const deleteCustomRecipe = useCallback(async (recipeId) => {
    setSaving(true);
    try {
      const res = await client.mutate({
        mutation: DeleteCustomRecipe,
        variables: { recipeId },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      setCustomRecipes((prev) =>
        Array.isArray(prev) ? prev.filter((recipe) => recipe.id !== recipeId) : prev
      );
      return true;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  }, [client]);

  const value = useMemo(
    () => ({
      customRecipes,
      loading,
      saving,
      fetchCustomRecipes,
      createCustomRecipe,
      deleteCustomRecipe,
    }),
    [
      customRecipes,
      loading,
      saving,
      fetchCustomRecipes,
      createCustomRecipe,
      deleteCustomRecipe,
    ]
  );

  return (
    <CustomRecipesContext.Provider value={value}>
      {children}
    </CustomRecipesContext.Provider>
  );
}

export function useCustomRecipes() {
  const ctx = useContext(CustomRecipesContext);
  if (!ctx) {
    return {
      customRecipes: [],
      loading: false,
      saving: false,
      fetchCustomRecipes: async () => {},
      createCustomRecipe: async () => {},
      deleteCustomRecipe: async () => {},
    };
  }
  return ctx;
}
