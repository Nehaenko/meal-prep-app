import { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { usePlanner } from "../../state/PlannerContext";
import { Recipe, GeneratePrepPlan } from "../../graphql";
import PrepStepsList from "./PrepSteps";
import PlannerCart from "./PlannerCard";

export default function Planner() {
  const { plannerItems, loading, clearPlanner } = usePlanner();
  const client = useApolloClient();
  const [recipesById, setRecipesById] = useState({});
  const [recipeError, setRecipeError] = useState("");
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [prepSteps, setPrepSteps] = useState([]);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState("");

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

  const clearHandler = async () => {
    await clearPlanner(true);
    setPrepSteps([]);
    setSelectedIds(new Set());
    setPrepError("");
  };

  const toggleSelection = (recipeId, isSelected) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  };

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const handleGeneratePrepPlan = async () => {
    setPrepError("");
    setPrepSteps([]);
    if (selectedList.length === 0) {
      setPrepError("Select at least one meal to generate a prep plan.");
      return;
    }
    try {
      setPrepLoading(true);
      const { data } = await client.mutate({
        mutation: GeneratePrepPlan,
        variables: { recipeIds: selectedList },
      });
      setPrepSteps(data?.generatePrepPlan ?? []);
    } catch (err) {
      const message =
        err?.message || "Failed to generate prep steps. Please try again.";
      setPrepError(message);
    } finally {
      setPrepLoading(false);
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
      {loading && <p>Loading planner...</p>}
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
            <button className="btn btn-soft">Generate shopping list</button>
          </div>
          <PrepStepsList
            prepSteps={prepSteps}
            itemsWithRecipe={itemsWithRecipe}
            recipesById={recipesById}
            prepError={prepError}
          />
        </div>
      )}
    </>
  );
}
