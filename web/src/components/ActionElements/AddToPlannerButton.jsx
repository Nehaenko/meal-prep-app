import { useEffect, useState } from "react";
import { usePlanner } from "../../state/PlannerContext";

export default function AddToPlannerButton({ recipe }) {
  const {
    addToPlanner,
    removeFromPlanner,
    plannerItems,
    loading: plannerLoading,
  } = usePlanner();
  const [plannerError, setPlannerError] = useState("");
  const [itemAddedToPlanner, setItemAddedToPlanner] = useState(false);

  useEffect(() => {
    if (!plannerItems || !recipe?.id) return;
    setItemAddedToPlanner(
      plannerItems.some((item) => item.recipeId === recipe.id)
    );
  }, [plannerItems, recipe?.id]);

  async function addToPlannerHandler(event) {
    event.preventDefault();
    if (!recipe?.id) return;
    if (itemAddedToPlanner) {
      try {
        await removeFromPlanner(recipe.id);
        setItemAddedToPlanner(false);
      } catch (error) {
        setPlannerError(error.message);
        setTimeout(() => setPlannerError(""), 3000);
        setItemAddedToPlanner(false);
      }
    } else {
      try {
        await addToPlanner([{ recipeId: recipe.id, servings: 1 }]);
        setItemAddedToPlanner(true);
      } catch (error) {
        setPlannerError(error.message);
        setTimeout(() => setPlannerError(""), 3000);
        setItemAddedToPlanner(false);
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
        disabled={plannerLoading}
        className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
      >
        {plannerLoading
          ? "Updating..."
          : itemAddedToPlanner
          ? "Remove from Planner"
          : "Add to Planner"}
      </button>
    </>
  );
}
