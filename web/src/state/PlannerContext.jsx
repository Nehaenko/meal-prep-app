import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useApolloClient } from "@apollo/client/react";
import {
  AddToPlanner,
  RemoveFromPlanner,
  ClearPlanner,
  PlannerItems,
} from "../graphql/index";

const PlannerContext = createContext(null);

function extractMessage(errOrArr) {
  const error = Array.isArray(errOrArr) ? errOrArr[0] : errOrArr;
  const graphQLErrors = error?.graphQLErrors?.[0]?.message;
  const networkError = error?.networkError?.message;
  const message = error?.message;
  return graphQLErrors || networkError || message || "Something went wrong";
}

export function PlannerProvider({ children }) {
  const client = useApolloClient();
  const [plannerItems, setPlannerItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlannerItems = useCallback(async () => {
    try {
      const { data } = await client.query({
        query: PlannerItems,
        fetchPolicy: "network-only",
      });
      setPlannerItems(data.plannerItems ?? []);
    } catch {
      setPlannerItems(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchPlannerItems();
  }, [fetchPlannerItems]);

  const clearPlanner = async () => {
    setLoading(true);
    await client.mutate({
      mutation: ClearPlanner,
    });
    setPlannerItems([]);
    await client.resetStore();
    setLoading(false);
  };

  const removeFromPlanner = async (recipeId) => {
    setLoading(true);
    await client.mutate({
      mutation: RemoveFromPlanner,
      variables: { recipeId },
      errorPolicy: "all",
    });
    await fetchPlannerItems();
    await client.resetStore();
    setLoading(false);
  };

  const addToPlanner = async (items) => {
    try {
      setLoading(true);
      const res = await client.mutate({
        mutation: AddToPlanner,
        variables: { items },
        errorPolicy: "all",
      });

      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));

      await fetchPlannerItems();
    } catch (err) {
      setLoading(false);
      throw new Error(extractMessage(err));
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        plannerItems,
        loading,
        addToPlanner,
        removeFromPlanner,
        clearPlanner,
        fetchPlannerItems,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) {
    throw new Error("usePlanner must be used within an PlannerContext");
  }
  return ctx;
}
