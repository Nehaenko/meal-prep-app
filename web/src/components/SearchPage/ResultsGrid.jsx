import { Link } from "react-router-dom";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";

export default function ResultsGrid({ items }) {
  return (
    <>
      <div className="mx-auto mt-3 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((results) => (
          <div
            key={results.id}
            className="overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <Link
              to={`/recipe/${results.id}`}
              state={{ results }}
              className="block"
            >
              {results.image && (
                <img
                  src={results.image}
                  alt={results.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium">
                  {results.title}
                </h3>
                {results.summary && (
                  <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                    {results.summary}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-3 text-xs text-gray-500">
                  {results.timeMinutes != null && (
                    <span>~{results.timeMinutes} min</span>
                  )}
                  {results.calories != null && (
                    <span>{results.calories} cal</span>
                  )}
                </div>
              </div>
            </Link>

            <div className="flex flex-col p-3 gap-2 border-t bg-gray-50">
              <AddToPlannerButton recipe={results} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
