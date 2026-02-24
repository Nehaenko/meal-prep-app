import { useEffect, useState } from "react";
import { usePlanner } from "../../state/PlannerContext";

export default function AddToPlannerButton({ recipe }) {
  const {
    addToPlanner,
    removeFromPlanner,
    plannerItems,
  } = usePlanner();
  const [plannerError, setPlannerError] = useState("");
  const [itemAddedToPlanner, setItemAddedToPlanner] = useState(false);
  const [isPlannerSubmitting, setIsPlannerSubmitting] = useState(false);

  useEffect(() => {
    if (!plannerItems || !recipe?.id) return;
    setItemAddedToPlanner(
      plannerItems.some((item) => item.recipeId === recipe.id)
    );
  }, [plannerItems, recipe?.id]);

  async function addToPlannerHandler(event) {
    event.preventDefault();
    if (isPlannerSubmitting) return;
    if (!recipe?.id) return;
    setPlannerError("");
    setIsPlannerSubmitting(true);
    if (itemAddedToPlanner) {
      try {
        await removeFromPlanner(recipe.id);
        setItemAddedToPlanner(false);
      } catch (error) {
        setPlannerError(error.message);
        setItemAddedToPlanner(false);
      } finally {
        setIsPlannerSubmitting(false);
      }
    } else {
      try {
        await addToPlanner([{ recipeId: recipe.id, servings: 1 }]);
        setItemAddedToPlanner(true);
      } catch (error) {
        setPlannerError(error.message);
        setItemAddedToPlanner(false);
      } finally {
        setIsPlannerSubmitting(false);
      }
    }
  }

  return (
    <>
      {plannerError && (
        <p>Error happend during adding process. Please try again later.</p>
      )}
      <button
        onClick={addToPlannerHandler}
        disabled={isPlannerSubmitting}
        className="meal-action meal-action--primary"
        aria-busy={isPlannerSubmitting}
      >
        {isPlannerSubmitting
          ? itemAddedToPlanner
            ? "Removing..."
            : "Adding..."
          : itemAddedToPlanner
            ? "Remove from Planner"
            : "Add to Planner"}
      </button>
    </>
  );
}
