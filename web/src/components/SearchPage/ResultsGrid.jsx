export default function ResultsGrid({ items }) {
  return (
    <>
      <div className="mx-auto mt-3 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((results) => (
          <article
            key={results.id}
            className="overflow-hidden rounded-lg border bg-white shadow-sm"
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

            <div className="flex flex-col p-3 gap-2">
              <button
                className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
              >
                Add to Planner
              </button>
              <button
                className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60 cursor-pointer"
              >
                View Meal
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}