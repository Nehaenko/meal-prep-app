import { useMemo, useState } from "react";
import { IoHeartOutline, IoHeartSharp } from "react-icons/io5";
import { useFavourites } from "../../state/FavouriesContext";

export default function AddToFavouritesButton({ recipe }) {
  const {
    toggleFavourites,
    favouritesItems,
    loading: favouritesLoading,
  } = useFavourites();

  const [favouritesError, setFavouritesError] = useState("");
  const isFavourite = useMemo(() => {
    if (!favouritesItems || !recipe?.id) return false;
    return favouritesItems.some((item) => item.id === recipe.id);
  }, [favouritesItems, recipe?.id]);

  async function addTofavouritesHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!recipe?.id) return;
    setFavouritesError("");

    try {
      await toggleFavourites(recipe.id);
    } catch (error) {
      setFavouritesError(error.message || "Failed to update favourites");
      setTimeout(() => setFavouritesError(""), 3000);
    }
  }

  return (
    <>
      {favouritesError && <p>{favouritesError}</p>}
      <button
        onClick={addTofavouritesHandler}
        disabled={favouritesLoading}
        className="meal-fav-btn"
        aria-label={
          isFavourite ? "Remove from favourites" : "Add to favourites"
        }
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
