import { Link } from "react-router-dom";

export default function PlannerCart({ itemsWithRecipe, selectedIds, toggleSelection }) {
  return (
    <>
      {itemsWithRecipe.map(({ item, recipe }) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded border p-3"
        >
          <div className="flex items-center">
            <input
              id={`select-${item.id}`}
              type="checkbox"
              checked={selectedIds.has(item.recipeId)}
              onChange={(e) => toggleSelection(item.recipeId, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"
            />
          </div>
          <Link
            to={`/recipe/${item.recipeId}`}
            state={recipe ? { results: recipe } : undefined}
            className="flex flex-1 items-center gap-3"
          >
            {recipe?.image && (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{recipe?.title ?? item.recipeId}</p>
              {recipe?.summary && (
                <p className="text-sm text-gray-700">{recipe.summary}</p>
              )}
              <p className="text-sm text-gray-600">Servings: {item.servings}</p>
              <p className="text-xs text-gray-500">Added: {item.createdAt}</p>
            </div>
          </Link>
        </div>
      ))}
    </>
  );
}
