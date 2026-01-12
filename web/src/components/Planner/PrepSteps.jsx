export default function PrepStepsList({ prepSteps, itemsWithRecipe, recipesById, prepError }) {
  return (
    <>
      {prepError && <p className="text-red-600 text-sm">{prepError}</p>}
      <div>
        {prepSteps && prepSteps.length > 0 && (
          <div
            className="rounded border p-3 space-y-2"
            data-testid="prep_steps"
          >
            <p className="font-semibold text-sm">Prep plan</p>
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              {prepSteps.map((step) => (
                <li key={`${step.order}-${step.description}`}>
                  <p>{step.description}</p>
                  {step.appliesToRecipeIds?.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Applies to{" "}
                      {step.appliesToRecipeIds
                        .map(
                          (id) =>
                            recipesById[id]?.title ??
                            itemsWithRecipe.find(
                              ({ item }) => item.recipeId === id
                            )?.item.recipeId ??
                            id
                        )
                        .join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  );
}
