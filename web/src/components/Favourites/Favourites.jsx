import { useFavourites } from "../../state/FavouriesContext";
import FavouriteCard from "./FavouriteCard";

export default function Favourites() {
  const { favouritesItems, loading: favouritesLoading } = useFavourites();

  if (favouritesLoading) {
    return <p className="p-4">Loading favourites…</p>;
  }

  if (!favouritesItems || favouritesItems.length === 0) {
    return <p className="p-4">Your favourites list is empty.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4">
      {favouritesItems.map((recipe) => (
        <FavouriteCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
