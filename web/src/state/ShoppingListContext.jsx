import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useApolloClient } from "@apollo/client/react";
import {
  ShoppingLists,
  CreateShoppingList,
  UpdateShoppingList,
  DeleteShoppingList,
  ClearShoppingLists,
} from "../graphql/index";
import { useAuth } from "./AuthContext";

const ShoppingListContext = createContext(null);

function extractMessage(errOrArr) {
  const error = Array.isArray(errOrArr) ? errOrArr[0] : errOrArr;
  const graphQLErrors = error?.graphQLErrors?.[0]?.message;
  const networkError = error?.networkError?.message;
  const message = error?.message;
  return graphQLErrors || networkError || message || "Something went wrong";
}

function sanitizeShoppingItems(items) {
  return (items ?? []).map((item) => ({
    name: item?.name ?? "",
    quantity:
      item?.quantity === "" || Number.isNaN(item?.quantity)
        ? null
        : item?.quantity ?? null,
    unit: item?.unit ?? null,
    substitutes: item?.substitutes ?? null,
    note: item?.note ?? null,
  }));
}

export function ShoppingListProvider({ children }) {
  const client = useApolloClient();
  const { user, loading: authLoading } = useAuth();
  const [shoppingLists, setShoppingLists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchShoppingLists = useCallback(async () => {
    if (!user) {
      setShoppingLists([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.query({
        query: ShoppingLists,
        fetchPolicy: "network-only",
      });
      setShoppingLists(data.shoppingLists ?? []);
    } catch {
      setShoppingLists([]);
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setShoppingLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchShoppingLists();
  }, [user, authLoading, fetchShoppingLists]);

  const createShoppingList = async (recipeId) => {
    setSaving(true);
    try {
      const res = await client.mutate({
        mutation: CreateShoppingList,
        variables: { recipeId },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      const created = res.data?.createShoppingList ?? null;
      if (created) {
        setShoppingLists((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          const idx = base.findIndex(
            (list) => list.id === created.id || list.recipeId === created.recipeId
          );
          if (idx >= 0) {
            const next = [...base];
            next[idx] = created;
            return next;
          }
          return [created, ...base];
        });
      }
      return created;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateShoppingList = async (listId, items) => {
    setSaving(true);
    try {
      const res = await client.mutate({
        mutation: UpdateShoppingList,
        variables: { listId, items: sanitizeShoppingItems(items) },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      const updated = res.data?.updateShoppingList ?? null;
      if (updated) {
        setShoppingLists((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          const idx = base.findIndex((list) => list.id === updated.id);
          if (idx >= 0) {
            const next = [...base];
            next[idx] = updated;
            return next;
          }
          return [updated, ...base];
        });
      }
      return updated;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteShoppingList = async (listId) => {
    setSaving(true);
    try {
      const res = await client.mutate({
        mutation: DeleteShoppingList,
        variables: { listId },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      setShoppingLists((prev) =>
        Array.isArray(prev) ? prev.filter((list) => list.id !== listId) : prev
      );
      return true;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const clearShoppingLists = async () => {
    setSaving(true);
    try {
      const res = await client.mutate({
        mutation: ClearShoppingLists,
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      setShoppingLists([]);
      return true;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShoppingListContext.Provider
      value={{
        shoppingLists,
        loading,
        saving,
        fetchShoppingLists,
        createShoppingList,
        updateShoppingList,
        deleteShoppingList,
        clearShoppingLists,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingLists() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) {
    return {
      shoppingLists: [],
      loading: false,
      saving: false,
      fetchShoppingLists: async () => {},
      createShoppingList: async () => {},
      updateShoppingList: async () => {},
      deleteShoppingList: async () => {},
      clearShoppingLists: async () => {},
    };
  }
  return ctx;
}
