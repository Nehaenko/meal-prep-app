import { useEffect, useState } from "react";
import { useShoppingLists } from "../../state/ShoppingListContext";

export default function AddToShoppingListButton({ recipe }) {
  const {
    shoppingLists,
    loading: shoppingLoading,
    createShoppingList,
    deleteShoppingList,
  } = useShoppingLists();
  const [listId, setListId] = useState(null);
  const [inList, setInList] = useState(false);
  const [error, setError] = useState("");
  const [isShoppingSubmitting, setIsShoppingSubmitting] = useState(false);

  useEffect(() => {
    if (!shoppingLists || !recipe?.id) return;
    const existing = shoppingLists.find(
      (list) => list.recipeId === recipe.id
    );
    setInList(Boolean(existing));
    setListId(existing?.id ?? null);
  }, [shoppingLists, recipe?.id]);

  const handleClick = async (event) => {
    event.preventDefault();
    if (isShoppingSubmitting) return;
    if (!recipe?.id) return;
    try {
      setError("");
      setIsShoppingSubmitting(true);
      if (inList && listId) {
        await deleteShoppingList(listId);
        setInList(false);
        setListId(null);
      } else {
        const created = await createShoppingList(recipe.id);
        setInList(true);
        setListId(created?.id ?? null);
      }
    } catch (err) {
      setError(err?.message || "Failed to update shopping list.");
    } finally {
      setIsShoppingSubmitting(false);
    }
  };

  return (
    <>
      {error ? (
        <p className="text-sm text-red-600">Shopping list error.</p>
      ) : null}
      <button
        onClick={handleClick}
        disabled={shoppingLoading || isShoppingSubmitting}
        className="meal-action meal-action--outline"
        aria-busy={isShoppingSubmitting}
      >
        {isShoppingSubmitting
          ? inList
            ? "Removing..."
            : "Adding..."
          : inList
            ? "Remove from Shopping List"
            : "Add to Shopping List"}
      </button>
    </>
  );
}
