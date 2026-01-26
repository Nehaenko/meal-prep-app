import { useEffect, useMemo } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { useParams, useLocation } from "react-router-dom";
import { Recipe } from "../../graphql";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";
import AddToFavouritesButton from "../ActionElements/AddToFavouritesButton";
import AddToShoppingListButton from "../ActionElements/AddToShoppingListButton";
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
    <div className="meal-detail-shell">
      <section className="meal-hero">
        <AddToFavouritesButton recipe={recipe} />
        {recipe.image && (
          <img
            className="meal-hero-image"
            src={recipe.image}
            alt={recipe.title}
          />
        )}
      </section>

      <section className="meal-detail-card">
        <h2 className="meal-detail-title">{recipe.title}</h2>
        {recipe.summary && (
          <p className="meal-detail-summary">{recipe.summary}</p>
        )}

        <div className="meal-detail-meta">
          <div className="meal-detail-stat">
            <p>Time</p>
            <span>
              {recipe.timeMinutes != null ? `${recipe.timeMinutes} min` : "—"}
            </span>
          </div>
          <div className="meal-detail-stat">
            <p>Calories</p>
            <span>{recipe.calories != null ? `${recipe.calories} cal` : "—"}</span>
          </div>
          <div className="meal-detail-stat">
            <p>Ingredients</p>
            <span>{ingredients.length}</span>
          </div>
        </div>

        <div className="meal-detail-section">
          <h3>Ingredients</h3>
          <ul className="meal-detail-list">
            {ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="meal-detail-section">
          <h3>Steps</h3>
          <ol className="meal-detail-list meal-detail-steps">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {recipe.source && (
          <div className="meal-detail-section">
            <h3>Source</h3>
            <p className="meal-detail-summary">{recipe.source}</p>
          </div>
        )}

        <div className="meal-detail-actions">
          <AddToPlannerButton recipe={recipe} />
          <AddToShoppingListButton recipe={recipe} />
        </div>
      </section>
    </div>
  );
}
