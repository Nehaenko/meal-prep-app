import { useEffect, useMemo } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { useParams, useLocation } from "react-router-dom";
import { Recipe } from "../../graphql";
import { useLoading } from "../../state/LoadingContext";

export default function MealPage() {
  const { id } = useParams();
  const location = useLocation();
  const initialData = location.state?.results;
  const { withLoading } = useLoading();

  const [fetchRecipe, { data, loading, error }] = useLazyQuery(Recipe, {
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    if (!id) return;
    withLoading(
      fetchRecipe({
        variables: { id },
      }).catch((err) => {
        // Ignore aborts from route changes / StrictMode double-invoke
        if (err?.name === "AbortError") return;
        throw err;
      })
    );
  }, [id, fetchRecipe, withLoading]);

  const recipe = useMemo(
    () => data?.recipe ?? initialData ?? null,
    [data, initialData]
  );

  if (loading && !recipe) return <div>Loading...</div>;
  if (error) return <div>Error loading recipe.</div>;
  if (!recipe) return <div>Recipe not found.</div>;

  const ingredients = recipe?.ingredients ?? [];
  const steps = recipe?.steps ?? [];

  return (
    <div className="container m-auto">
      <h2>{recipe.title}</h2>
      <div className="flex gap-3">
        {recipe.image && (
          <img className="w-52 h-52" src={recipe.image} alt={recipe.title} />
        )}
        <div>
          <h3>Ingredients</h3>
          <ul>
            {ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3>Steps</h3>
      <ol>
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      {recipe.source && (
        <p>
          Source: <span>{recipe.source}</span>
        </p>
      )}
      <div className="flex flex-col p-3 gap-2">
        <button
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
        >
          Add to Planner
        </button>
        <button
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
        >
          Add to Shopping List
        </button>
      </div>
    </div>
  );
}
