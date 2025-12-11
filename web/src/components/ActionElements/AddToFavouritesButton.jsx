import { useMemo, useState } from "react";
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
        className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
      >
        {favouritesLoading
          ? "Adding..."
          : isFavourite
          ? "Remove from Favourites"
          : "Add to Favourites"}
      </button>
    </>
  );
}
