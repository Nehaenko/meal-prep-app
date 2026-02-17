import { useFavourites } from "../../state/FavouritesContext";
import FavouriteCard from "./FavouriteCard";

export default function Favourites() {
  const { favouritesItems } = useFavourites();

  if (!favouritesItems || favouritesItems.length === 0) {
    return <p className="empty-state">Your favourites list is empty.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl meal-grid">
      {favouritesItems.map((recipe) => (
        <FavouriteCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
