import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useApolloClient } from "@apollo/client/react";
import { DeletePrepPlan, PrepPlans, SavePrepPlan } from "../graphql";
import { useAuth } from "./AuthContext";

const PrepPlansContext = createContext(null);

function extractMessage(errOrArr) {
  const error = Array.isArray(errOrArr) ? errOrArr[0] : errOrArr;
  const graphQLErrors = error?.graphQLErrors?.[0]?.message;
  const networkError = error?.networkError?.message;
  const message = error?.message;
  return graphQLErrors || networkError || message || "Something went wrong";
}

function sanitizeSteps(steps) {
  return (steps ?? []).map((step, index) => ({
    order: Number.isFinite(step?.order) ? Number(step.order) : index + 1,
    description: String(step?.description ?? "").trim(),
    appliesToRecipeIds: Array.isArray(step?.appliesToRecipeIds)
      ? step.appliesToRecipeIds.filter(Boolean)
      : [],
  }));
}

function sanitizePlan(plan) {
  return {
    title: String(plan?.title ?? "Prep plan").trim() || "Prep plan",
    recipeIds: Array.isArray(plan?.recipeIds) ? plan.recipeIds : [],
    steps: sanitizeSteps(plan?.steps),
  };
}

export function PrepPlansProvider({ children }) {
  const client = useApolloClient();
  const { user, loading: authLoading } = useAuth();
  const [prepPlans, setPrepPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftPlan, setDraftPlan] = useState(null);

  const fetchPrepPlans = useCallback(async () => {
    if (!user) {
      setPrepPlans([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.query({
        query: PrepPlans,
        fetchPolicy: "network-only",
      });
      setPrepPlans(data.prepPlans ?? []);
    } catch {
      setPrepPlans([]);
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPrepPlans([]);
      setDraftPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPrepPlans();
  }, [user, authLoading, fetchPrepPlans]);

  const savePrepPlan = async (plan) => {
    setSaving(true);
    try {
      const sanitized = sanitizePlan(plan);
      const res = await client.mutate({
        mutation: SavePrepPlan,
        variables: { plan: sanitized },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      const saved = res.data?.savePrepPlan ?? null;
      if (saved) {
        setPrepPlans((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          return [saved, ...base.filter((p) => p.id !== saved.id)];
        });
        setDraftPlan(null);
      }
      return saved;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deletePrepPlan = async (planId) => {
    setSaving(true);
    try {
      const res = await client.mutate({
        mutation: DeletePrepPlan,
        variables: { planId },
        errorPolicy: "all",
      });
      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));
      setPrepPlans((prev) =>
        Array.isArray(prev) ? prev.filter((plan) => plan.id !== planId) : prev
      );
      return true;
    } catch (err) {
      setSaving(false);
      throw new Error(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const clearDraftPlan = () => setDraftPlan(null);

  const value = useMemo(
    () => ({
      prepPlans,
      loading,
      saving,
      draftPlan,
      setDraftPlan,
      clearDraftPlan,
      fetchPrepPlans,
      savePrepPlan,
      deletePrepPlan,
    }),
    [
      prepPlans,
      loading,
      saving,
      draftPlan,
      fetchPrepPlans,
      savePrepPlan,
      deletePrepPlan,
    ]
  );

  return (
    <PrepPlansContext.Provider value={value}>
      {children}
    </PrepPlansContext.Provider>
  );
}

export function usePrepPlans() {
  const ctx = useContext(PrepPlansContext);
  if (!ctx) {
    return {
      prepPlans: [],
      loading: false,
      saving: false,
      draftPlan: null,
      setDraftPlan: () => {},
      clearDraftPlan: () => {},
      fetchPrepPlans: async () => {},
      savePrepPlan: async () => {},
      deletePrepPlan: async () => {},
    };
  }
  return ctx;
}

