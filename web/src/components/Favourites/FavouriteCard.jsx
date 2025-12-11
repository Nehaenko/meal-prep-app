import { Link } from "react-router-dom";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";
import AddToFavouritesButton from "../ActionElements/AddToFavouritesButton";

export default function FavouriteCard({ recipe }) {
  return (
    <div className="flex flex-col gap-3 rounded border p-3 shadow-sm">
      <Link
        to={`/recipe/${recipe.id}`}
        state={{ results: recipe }}
        className="flex items-start gap-3"
      >
        {recipe?.image && (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-16 w-16 rounded object-cover"
          />
        )}
        <div className="flex-1">
          <p className="font-semibold">{recipe.title}</p>
          {recipe?.summary && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {recipe.summary}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
            {recipe?.timeMinutes != null && <span>{recipe.timeMinutes} min</span>}
            {recipe?.calories != null && <span>{recipe.calories} cal</span>}
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2">
        <AddToPlannerButton recipe={recipe} />
        <AddToFavouritesButton recipe={recipe} />
      </div>
    </div>
  );
}
