import { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { usePlanner } from "../../state/PlannerContext";
import { useShoppingLists } from "../../state/ShoppingListContext";
import { usePrepPlans } from "../../state/PrepPlansContext";
import { useLoading } from "../../state/LoadingContext";
import { Recipe, GeneratePrepPlan } from "../../graphql";
import PlannerCart from "./PlannerCard";

export default function Planner() {
  const { plannerItems, loading, clearPlanner } = usePlanner();
  const { shoppingLists, createShoppingList, fetchShoppingLists } =
    useShoppingLists();
  const { setDraftPlan } = usePrepPlans();
  const { withLoading } = useLoading();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [recipesById, setRecipesById] = useState({});
  const [recipeError, setRecipeError] = useState("");
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedShoppingIds, setSelectedShoppingIds] = useState(new Set());
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState("");
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState("");

  // Fetch recipe details for planner items so we can show titles/images.
  useEffect(() => {
    if (!plannerItems || plannerItems.length === 0) return;

    const missingIds = plannerItems
      .map((item) => item.recipeId)
      .filter((id) => !recipesById[id]);

    if (missingIds.length === 0) return;

    let cancelled = false;
    setRecipesLoading(true);
    setRecipeError("");

    (async () => {
      try {
        const results = await Promise.all(
          missingIds.map((id) =>
            client.query({
              query: Recipe,
              variables: { id },
              fetchPolicy: "cache-first",
            })
          )
        );

        if (cancelled) return;

        setRecipesById((prev) => {
          const next = { ...prev };
          results.forEach(({ data }) => {
            if (data?.recipe?.id) {
              next[data.recipe.id] = data.recipe;
            }
          });
          return next;
        });
      } catch {
        if (!cancelled) setRecipeError("Failed to load recipe details.");
      } finally {
        if (!cancelled) setRecipesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plannerItems, recipesById, client]);

  useEffect(() => {
    setSelectedIds(new Set(plannerItems?.map((item) => item.recipeId) ?? []));
  }, [plannerItems]);

  useEffect(() => {
    setSelectedShoppingIds(
      new Set(plannerItems?.map((item) => item.recipeId) ?? [])
    );
  }, [plannerItems]);

  const clearHandler = async () => {
    await clearPlanner(true);
    setSelectedIds(new Set());
    setSelectedShoppingIds(new Set());
    setPrepError("");
    setShoppingError("");
  };

  const toggleSelection = (recipeId, isSelected) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  };

  const toggleShoppingSelection = (recipeId, isSelected) => {
    setSelectedShoppingIds((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  };

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const selectedShoppingList = useMemo(
    () => Array.from(selectedShoppingIds),
    [selectedShoppingIds]
  );

  const handleGeneratePrepPlan = async () => {
    setPrepError("");
    if (selectedList.length === 0) {
      setPrepError("Select at least one meal to generate a prep plan.");
      return;
    }
    try {
      setPrepLoading(true);
      const { data } = await withLoading(
        client.mutate({
          mutation: GeneratePrepPlan,
          variables: { recipeIds: selectedList },
        }),
        "Hang tight, we're crafting your plan..."
      );
      const steps = data?.generatePrepPlan ?? [];
      if (!steps.length) {
        setPrepError("No prep steps were generated. Please try again.");
        return;
      }
      setDraftPlan({
        recipeIds: selectedList,
        steps,
        createdAt: new Date().toISOString(),
      });
      navigate("/prep-plan");
    } catch (err) {
      const message =
        err?.message || "Failed to generate prep steps. Please try again.";
      setPrepError(message);
    } finally {
      setPrepLoading(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    setShoppingError("");
    if (selectedShoppingList.length === 0) {
      setShoppingError("Select at least one meal to generate a shopping list.");
      return;
    }

    try {
      setShoppingLoading(true);
      const existing = new Set(
        (shoppingLists ?? []).map((list) => list.recipeId)
      );
      for (const recipeId of selectedShoppingList) {
        if (!existing.has(recipeId)) {
          await createShoppingList(recipeId);
        }
      }
      await fetchShoppingLists();
      navigate("/shopping-list");
    } catch (err) {
      const message =
        err?.message || "Failed to generate shopping list. Please try again.";
      setShoppingError(message);
    } finally {
      setShoppingLoading(false);
    }
  };

  const itemsWithRecipe = useMemo(() => {
    if (!plannerItems) return [];
    return plannerItems.map((item) => ({
      item,
      recipe: recipesById[item.recipeId],
    }));
  }, [plannerItems, recipesById]);
  const plannerCount = plannerItems?.length ?? 0;

  return (
    <>
      {plannerCount === 0 && !loading && (
        <p data-testid="planner_empty" className="empty-state">
          Your planner is empty.
        </p>
      )}
      {plannerCount > 0 && (
        <div className="space-y-2">
          <button
            onClick={clearHandler}
            data-testid="clear_planner"
            className="btn btn-soft"
          >
            Reset planner
          </button>
          <PlannerCart
            itemsWithRecipe={itemsWithRecipe}
            selectedIds={selectedIds}
            toggleSelection={toggleSelection}
            selectedShoppingIds={selectedShoppingIds}
            toggleShoppingSelection={toggleShoppingSelection}
          />
          {recipesLoading && <p>Loading recipe details…</p>}
          {recipeError && <p className="text-red-600 text-sm">{recipeError}</p>}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleGeneratePrepPlan}
              disabled={prepLoading || selectedList.length === 0}
              className="btn btn-primary"
            >
              {prepLoading ? "Generating..." : "Generate prep steps"}
            </button>
            <button
              onClick={handleGenerateShoppingList}
              disabled={shoppingLoading || selectedShoppingList.length === 0}
              className="btn btn-soft"
            >
              {shoppingLoading ? "Generating..." : "Generate shopping list"}
            </button>
            {shoppingError && (
              <p className="text-red-600 text-sm">{shoppingError}</p>
            )}
          </div>
          {prepError && <p className="text-red-600 text-sm">{prepError}</p>}
        </div>
      )}
    </>
  );
}
