import { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { usePlanner } from "../../state/PlannerContext";
import { Recipe } from "../../graphql";
import { Link } from "react-router-dom";

export default function Planner() {
  const { plannerItems, loading } = usePlanner();
  const client = useApolloClient();
  const [recipesById, setRecipesById] = useState({});
  const [recipeError, setRecipeError] = useState("");
  const [recipesLoading, setRecipesLoading] = useState(false);

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
      } catch (err) {
        if (!cancelled) setRecipeError("Failed to load recipe details.");
      } finally {
        if (!cancelled) setRecipesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plannerItems, recipesById, client]);

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
      {plannerCount === 0 && !loading && <p>Planner is empty</p>}
      {plannerCount > 0 && (
        <div className="space-y-2">
          {itemsWithRecipe.map(({ item, recipe }) => (
            <Link
              key={item.id}
              to={`/recipe/${item.recipeId}`}
              state={recipe ? { results: recipe } : undefined}
              className="block"
            >
              <div className="flex items-center gap-3 rounded border p-3">
                {recipe?.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {recipe?.title ?? item.recipeId}
                  </p>
                  {recipe?.summary && (
                    <p className="text-sm text-gray-700">{recipe.summary}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Servings: {item.servings}
                  </p>
                  <p className="text-xs text-gray-500">
                    Added: {item.createdAt}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {recipesLoading && <p>Loading recipe details…</p>}
          {recipeError && <p className="text-red-600 text-sm">{recipeError}</p>}
          <div className="flex flex-col gap-3">
            <button
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
            >
              Clear everything
            </button>
            <button
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
            >
              Generate prep steps
            </button>
            <button
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
            >
              Generate shopping list
            </button>
          </div>
        </div>
      )}
    </>
  );
}
