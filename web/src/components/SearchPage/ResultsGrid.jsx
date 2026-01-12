import { Link } from "react-router-dom";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";
import AddToFavouritesButton from "../ActionElements/AddToFavouritesButton";

export default function ResultsGrid({ items }) {
  return (
    <>
      <div className="mx-auto mt-3 max-w-5xl meal-grid">
        {items.map((results) => (
          <div key={results.id} className="meal-card">
            <AddToFavouritesButton recipe={results} />
            <Link
              to={`/recipe/${results.id}`}
              state={{ results }}
              className="block"
            >
              {results.image && (
                <div className="meal-card-media">
                  <img
                    src={results.image}
                    alt={results.title}
                    className="meal-card-image"
                  />
                </div>
              )}
              <div className="meal-card-body">
                <h3 className="meal-card-title line-clamp-2">
                  {results.title}
                </h3>
                {results.summary && (
                  <p className="meal-card-summary line-clamp-3">
                    {results.summary}
                  </p>
                )}
                <div className="meal-card-meta">
                  {results.timeMinutes != null && (
                    <span>~{results.timeMinutes} min</span>
                  )}
                  {results.calories != null && (
                    <span>{results.calories} cal</span>
                  )}
                </div>
              </div>
            </Link>
            <div className="meal-card-actions">
              <AddToPlannerButton recipe={results} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
