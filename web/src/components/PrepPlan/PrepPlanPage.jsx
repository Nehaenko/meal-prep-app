import { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { Recipe } from "../../graphql";
import { useLoading } from "../../state/LoadingContext";
import { usePrepPlans } from "../../state/PrepPlansContext";

function formatTitleFromIds(recipeIds, recipesById) {
  const titles = (recipeIds ?? [])
    .map((id) => recipesById[id]?.title)
    .filter(Boolean);
  if (!titles.length) {
    const count = recipeIds?.length ?? 0;
    return count > 0 ? `${count} meals` : "Prep plan";
  }
  const head = titles.slice(0, 3).join(", ");
  const rest = titles.length - 3;
  return rest > 0 ? `${head} +${rest}` : head;
}

function stepKey(step) {
  return `${step?.order ?? ""}-${step?.description ?? ""}`;
}

export default function PrepPlanPage() {
  const client = useApolloClient();
  const { withLoading } = useLoading();
  const {
    prepPlans,
    loading,
    saving,
    draftPlan,
    clearDraftPlan,
    savePrepPlan,
    deletePrepPlan,
  } = usePrepPlans();
  const [recipesById, setRecipesById] = useState({});
  const [error, setError] = useState("");

  const allRecipeIds = useMemo(() => {
    const ids = new Set();
    (draftPlan?.recipeIds ?? []).forEach((id) => ids.add(id));
    (prepPlans ?? []).forEach((plan) =>
      (plan.recipeIds ?? []).forEach((id) => ids.add(id))
    );
    return Array.from(ids);
  }, [draftPlan?.recipeIds, prepPlans]);

  const missingIds = useMemo(
    () => allRecipeIds.filter((id) => !recipesById[id]),
    [allRecipeIds, recipesById]
  );

  useEffect(() => {
    if (!missingIds.length) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          missingIds.map((id) =>
            client.query({
              query: Recipe,
              variables: { id },
              fetchPolicy: "cache-first",
            })
          )
        );
        if (cancelled) return;
        setRecipesById((prev) => {
          const next = { ...prev };
          results.forEach(({ data }) => {
            if (data?.recipe?.id) next[data.recipe.id] = data.recipe;
          });
          return next;
        });
      } catch {
        if (!cancelled) setError("Failed to load recipe titles.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missingIds, client]);

  const draftTitle = useMemo(
    () => formatTitleFromIds(draftPlan?.recipeIds, recipesById),
    [draftPlan?.recipeIds, recipesById]
  );

  const handleSaveDraft = async () => {
    if (!draftPlan?.steps?.length) return;
    try {
      setError("");
      await withLoading(
        savePrepPlan({
          title: draftTitle,
          recipeIds: draftPlan.recipeIds,
          steps: draftPlan.steps,
        })
      );
    } catch (err) {
      setError(err?.message || "Failed to save prep plan.");
    }
  };

  const handleDeleteDraft = () => {
    clearDraftPlan();
  };

  const handleDeleteSaved = async (planId) => {
    try {
      setError("");
      await withLoading(deletePrepPlan(planId));
    } catch (err) {
      setError(err?.message || "Failed to delete prep plan.");
    }
  };

  return (
    <div className="prep-page">
      {error ? <p className="prep-error">{error}</p> : null}
      {draftPlan?.steps?.length ? (
        <section className="prep-card glass-card">
          <div className="prep-card-header">
            <div>
              <p className="prep-pill">New plan</p>
              <h3>{draftTitle}</h3>
              <p className="prep-meta">
                {draftPlan.steps.length} step
                {draftPlan.steps.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="prep-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                Save plan
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleDeleteDraft}
                disabled={saving}
              >
                Discard
              </button>
            </div>
          </div>

          <ol className="prep-steps">
            {draftPlan.steps.map((step) => (
              <li key={stepKey(step)} className="prep-step">
                <p className="prep-step-desc">{step.description}</p>
                {step.appliesToRecipeIds?.length ? (
                  <p className="prep-step-meta">
                    Applies to:{" "}
                    {step.appliesToRecipeIds
                      .map((id) => recipesById[id]?.title ?? id)
                      .join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="prep-card glass-card">
        <div className="prep-card-header">
          <div>
            <h3>Saved plans</h3>
            <p className="prep-meta" data-testid="saved-plans-count">
              {prepPlans?.length ?? 0} saved plan
              {(prepPlans?.length ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading && !prepPlans ? <p>Loading prep plans...</p> : null}
        {!loading && (prepPlans?.length ?? 0) === 0 ? (
          <p className="empty-state">
            No saved prep plans yet. Generate one from your planner.
          </p>
        ) : null}

        {(prepPlans?.length ?? 0) > 0 ? (
          <div className="prep-plan-list">
            {prepPlans.map((plan) => {
              const title =
                plan.title || formatTitleFromIds(plan.recipeIds, recipesById);
              return (
                <details key={plan.id} className="prep-plan-item">
                  <summary className="prep-plan-summary">
                    <div>
                      <p className="prep-plan-title">{title}</p>
                      <p className="prep-plan-meta">
                        {plan.steps?.length ?? 0} steps
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={(event) => {
                        event.preventDefault();
                        handleDeleteSaved(plan.id);
                      }}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </summary>
                  <ol className="prep-steps">
                    {(plan.steps ?? []).map((step) => (
                      <li key={stepKey(step)} className="prep-step">
                        <p className="prep-step-desc">{step.description}</p>
                        {step.appliesToRecipeIds?.length ? (
                          <p className="prep-step-meta">
                            Applies to:{" "}
                            {step.appliesToRecipeIds
                              .map((id) => recipesById[id]?.title ?? id)
                              .join(", ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
