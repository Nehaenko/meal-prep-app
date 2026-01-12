import { Link } from "react-router-dom";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";
import AddToFavouritesButton from "../ActionElements/AddToFavouritesButton";

export default function FavouriteCard({ recipe }) {
  return (
    <div className="meal-card">
      <AddToFavouritesButton recipe={recipe} />
      <Link
        to={`/recipe/${recipe.id}`}
        state={{ results: recipe }}
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
          <p className="meal-card-title">{recipe.title}</p>
          {recipe?.summary && (
            <p className="meal-card-summary line-clamp-2">
              {recipe.summary}
            </p>
          )}
          <div className="meal-card-meta">
            {recipe?.timeMinutes != null && <span>{recipe.timeMinutes} min</span>}
            {recipe?.calories != null && <span>{recipe.calories} cal</span>}
          </div>
        </div>
      </Link>
      <div className="meal-card-actions">
        <AddToPlannerButton recipe={recipe} />
      </div>
    </div>
  );
}
