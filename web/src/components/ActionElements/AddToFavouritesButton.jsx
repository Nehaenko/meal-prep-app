import { useEffect, useState } from "react";
import { IoHeartOutline, IoHeartSharp } from "react-icons/io5";
import { useFavourites } from "../../state/FavouritesContext";

export default function AddToFavouritesButton({ recipe }) {
  const {
    toggleFavourites,
    favouritesItems,
    loading: favouritesLoading,
  } = useFavourites();

  const [favouritesError, setFavouritesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticFavourite, setOptimisticFavourite] = useState(null);
  const isFavouriteActual =
    !!recipe?.id &&
    Array.isArray(favouritesItems) &&
    favouritesItems.some((item) => item.id === recipe.id);
  const isFavourite =
    optimisticFavourite === null ? isFavouriteActual : optimisticFavourite;

  useEffect(() => {
    if (optimisticFavourite === null) return;
    if (isFavouriteActual === optimisticFavourite) {
      setOptimisticFavourite(null);
    }
  }, [isFavouriteActual, optimisticFavourite]);

  async function addTofavouritesHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    if (isSubmitting || !recipe?.id) return;
    const targetState = !isFavourite;
    setFavouritesError("");
    setIsSubmitting(true);
    setOptimisticFavourite(targetState);

    try {
      await toggleFavourites(recipe.id);
    } catch (error) {
      setFavouritesError(error.message || "Failed to update favourites");
      setOptimisticFavourite(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {favouritesError && <p>{favouritesError}</p>}
      <button
        onClick={addTofavouritesHandler}
        disabled={favouritesLoading || isSubmitting}
        className={`meal-fav-btn${isSubmitting ? " is-pending" : ""}`}
        aria-label={
          isFavourite ? "Remove from favourites" : "Add to favourites"
        }
        aria-busy={isSubmitting}
      >
        {isFavourite ? (
          <IoHeartSharp className="h-5 w-5 text-[var(--green-700)]" />
        ) : (
          <IoHeartOutline className="h-5 w-5" />
        )}
      </button>
    </>
  );
}
