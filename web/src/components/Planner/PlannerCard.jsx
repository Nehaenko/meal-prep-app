import { Link } from "react-router-dom";
import { useState } from "react";
import { IoTrashSharp } from "react-icons/io5";
import { usePlanner } from "../../state/PlannerContext";
import AddToFavouritesButton from "../ActionElements/AddToFavouritesButton";

export default function PlannerCart({
  itemsWithRecipe,
  selectedIds,
  toggleSelection,
  selectedShoppingIds,
  toggleShoppingSelection,
}) {
  const { removeFromPlanner } = usePlanner();
  const [plannerError, setPlannerError] = useState("");

  async function removeFromPlannerHandler(id) {
    try {
      await removeFromPlanner(id);
    } catch (error) {
      setPlannerError(error.message);
    }
  }

  return (
    <div className="meal-grid">
      {itemsWithRecipe.map(({ item, recipe }) => (
        <div key={item.id} className="meal-card">
          <AddToFavouritesButton recipe={recipe} />
          <Link
            to={`/recipe/${item.recipeId}`}
            state={recipe ? { results: recipe } : undefined}
            className="block"
          >
            {recipe?.image && (
              <div className="meal-card-media">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="meal-card-image"
                />
              </div>
            )}
            <div className="meal-card-body">
              <p className="meal-card-title">
                {recipe?.title ?? item.recipeId}
              </p>
              {recipe?.summary && (
                <p className="meal-card-summary line-clamp-2">
                  {recipe.summary}
                </p>
              )}
              <div className="meal-card-meta">
                <span>Servings: {item.servings}</span>
                {recipe?.timeMinutes != null && (
                  <span>{recipe.timeMinutes} min</span>
                )}
                {recipe?.calories != null && <span>{recipe.calories} cal</span>}
              </div>
              <div className="meal-card-meta">
                <span>Added: {item.createdAt}</span>
              </div>
            </div>
          </Link>
          <div className="meal-card-actions meal-card-actions--planner">
            <div className="meal-card-checks">
              <label className="meal-card-select">
                <input
                  id={`select-${item.id}`}
                  type="checkbox"
                  checked={selectedIds.has(item.recipeId)}
                  onChange={(e) =>
                    toggleSelection(item.recipeId, e.target.checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
                Include in prep plan
              </label>
              <label className="meal-card-select">
                <input
                  id={`select-shopping-${item.id}`}
                  type="checkbox"
                  checked={selectedShoppingIds.has(item.recipeId)}
                  onChange={(e) =>
                    toggleShoppingSelection(item.recipeId, e.target.checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
                Include in shopping list
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeFromPlannerHandler(item.recipeId)}
              className="meal-icon-btn"
              aria-label="Remove from planner"
            >
              <IoTrashSharp className="h-5 w-5" />
            </button>
          </div>
          {plannerError ? (
            <p className="px-4 pb-4 text-xs text-red-600">{plannerError}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
