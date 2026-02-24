import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";
import AddToShoppingListButton from "../ActionElements/AddToShoppingListButton";
import { useCustomRecipes } from "../../state/CustomRecipesContext";
import { useLoading } from "../../state/LoadingContext";

function splitSteps(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);
}

function formatIngredientLine(item) {
  const parts = [];
  if (item?.quantity != null && !Number.isNaN(item.quantity)) {
    parts.push(String(item.quantity));
  }
  if (item?.unit) parts.push(item.unit.trim());
  parts.push(String(item?.name ?? "").trim());
  return parts.join(" ").trim();
}

function CustomRecipeCard({ recipe, onDelete, onUpdate, deleting }) {
  const ingredientsCount = recipe?.ingredients?.length ?? 0;
  const stepsCount = recipe?.steps?.length ?? 0;
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(recipe?.title ?? "");
  const [editStepsText, setEditStepsText] = useState(
    (recipe?.steps ?? []).join("\n")
  );
  const [editIngredients, setEditIngredients] = useState(
    recipe?.ingredients ?? []
  );
  const [editIngredientDraft, setEditIngredientDraft] = useState({
    name: "",
    quantity: "",
    unit: "",
  });
  const [editImageData, setEditImageData] = useState(recipe?.image ?? null);
  const [editImageName, setEditImageName] = useState("");
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState({
    title: "",
    ingredients: "",
    steps: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (isEditing) return;
    setEditTitle(recipe?.title ?? "");
    setEditStepsText((recipe?.steps ?? []).join("\n"));
    setEditIngredients(recipe?.ingredients ?? []);
    setEditImageData(recipe?.image ?? null);
  }, [recipe, isEditing]);

  const startEdit = () => {
    setIsOpen(true);
    setIsEditing(true);
    setEditTitle(recipe?.title ?? "");
    setEditStepsText((recipe?.steps ?? []).join("\n"));
    setEditIngredients(recipe?.ingredients ?? []);
    setEditIngredientDraft({ name: "", quantity: "", unit: "" });
    setEditImageData(recipe?.image ?? null);
    setEditImageName("");
    setEditError("");
    setEditFieldErrors({ title: "", ingredients: "", steps: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditError("");
    setEditFieldErrors({ title: "", ingredients: "", steps: "" });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setEditImageData(recipe?.image ?? null);
      setEditImageName("");
      return;
    }
    setEditImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setEditImageData(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => {
      setEditImageData(recipe?.image ?? null);
      setEditError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const addIngredient = () => {
    const name = editIngredientDraft.name.trim();
    if (!name) return;
    const quantityRaw = editIngredientDraft.quantity.trim();
    const quantity = quantityRaw === "" ? null : Number(quantityRaw);
    const unit = editIngredientDraft.unit.trim();
    const nextItem = {
      name,
      quantity: Number.isFinite(quantity) ? quantity : null,
      unit,
    };
    const line = formatIngredientLine(nextItem);
    if (!line) return;
    setEditIngredients((prev) => (prev.includes(line) ? prev : [...prev, line]));
    setEditFieldErrors((prev) => ({ ...prev, ingredients: "" }));
    setEditIngredientDraft({ name: "", quantity: "", unit: "" });
  };

  const removeIngredient = (line) =>
    setEditIngredients((prev) => prev.filter((item) => item !== line));

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    const steps = splitSteps(editStepsText);
    const nextErrors = { title: "", ingredients: "", steps: "" };
    if (!editTitle.trim()) {
      nextErrors.title = "Recipe title is required.";
    }
    if (!editIngredients.length) {
      nextErrors.ingredients = "Add at least one ingredient.";
    }
    if (!steps.length) {
      nextErrors.steps = "Add at least one prep step.";
    }
    if (nextErrors.title || nextErrors.ingredients || nextErrors.steps) {
      setEditFieldErrors(nextErrors);
      return;
    }
    try {
      setEditError("");
      setEditFieldErrors({ title: "", ingredients: "", steps: "" });
      setIsSaving(true);
      await onUpdate(recipe.id, {
        title: editTitle,
        image: editImageData,
        ingredients: editIngredients,
        steps,
      });
      setIsSaving(false);
      setIsEditing(false);
    } catch (err) {
      setEditError(err?.message || "Failed to update recipe.");
      setIsSaving(false);
    }
  };

  return (
    <details
      className="custom-card"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="custom-card-summary">
        <div className="custom-card-title-row">
          <p className="custom-card-title">{recipe.title}</p>
          <p className="custom-card-meta">
            {ingredientsCount} ingredients · {stepsCount} steps
          </p>
        </div>
        <div className="custom-card-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={(event) => {
              event.preventDefault();
              startEdit();
            }}
            disabled={deleting || isSaving}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-soft"
            onClick={(event) => {
              event.preventDefault();
              onDelete(recipe.id);
            }}
            disabled={deleting || isSaving}
          >
            Delete
          </button>
        </div>
      </summary>

      <div className="custom-card-body">
        {isEditing ? (
          <form className="custom-form" onSubmit={handleUpdate}>
            {editError ? <p className="custom-error">{editError}</p> : null}
            <label className="custom-field">
              <span>
                Title <span className="text-red-600">*</span>
              </span>
              <input
                className="custom-input"
                value={editTitle}
                onChange={(event) => {
                  setEditTitle(event.target.value);
                  if (editFieldErrors.title) {
                    setEditFieldErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                placeholder="e.g. Sunday roast chicken"
                disabled={deleting || isSaving}
              />
              {editFieldErrors.title ? (
                <p className="custom-error">{editFieldErrors.title}</p>
              ) : null}
            </label>

            <label className="custom-field">
              <span>Image</span>
              <div className="custom-file-row">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="custom-file-input"
                  onChange={handleFileChange}
                  disabled={deleting || isSaving}
                />
                {editImageName ? (
                  <p className="custom-meta">{editImageName}</p>
                ) : null}
              </div>
              {editImageData ? (
                <img className="custom-preview" src={editImageData} alt="Preview" />
              ) : null}
            </label>

            <label className="custom-field">
              <span>
                Ingredients <span className="text-red-600">*</span>
              </span>
              <div className="custom-ingredient-row">
                <label className="custom-ingredient-control custom-ingredient-control--name">
                  <span>Name</span>
                  <input
                    className="custom-input custom-input--name"
                    placeholder="Ingredient name"
                    value={editIngredientDraft.name}
                    onChange={(event) =>
                      setEditIngredientDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addIngredient();
                      }
                    }}
                    disabled={deleting || isSaving}
                  />
                </label>
                <label className="custom-ingredient-control">
                  <span>Qty</span>
                  <input
                    type="number"
                    step="0.01"
                    className="custom-input custom-input--qty"
                    placeholder="0"
                    value={editIngredientDraft.quantity}
                    onChange={(event) =>
                      setEditIngredientDraft((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                      }))
                    }
                    disabled={deleting || isSaving}
                  />
                </label>
                <label className="custom-ingredient-control">
                  <span>Unit</span>
                  <input
                    className="custom-input custom-input--unit"
                    placeholder="e.g. g"
                    value={editIngredientDraft.unit}
                    onChange={(event) =>
                      setEditIngredientDraft((prev) => ({
                        ...prev,
                        unit: event.target.value,
                      }))
                    }
                    disabled={deleting || isSaving}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={addIngredient}
                  disabled={deleting || isSaving}
                >
                  Add
                </button>
              </div>
              {editIngredients.length ? (
                <div className="custom-ingredient-list">
                  {editIngredients.map((line) => (
                    <span key={line} className="tag-badge">
                      {line}
                      <button
                        type="button"
                        onClick={() => removeIngredient(line)}
                        className="text-[var(--muted-400)] transition hover:text-[var(--ink-700)]"
                        disabled={deleting || isSaving}
                      >
                        <span className="sr-only">Remove {line}</span>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              {editFieldErrors.ingredients ? (
                <p className="custom-error">{editFieldErrors.ingredients}</p>
              ) : null}
              <p className="custom-meta">
                Add quantity and unit if you have them.
              </p>
            </label>

            <label className="custom-field">
              <span>
                Prep steps <span className="text-red-600">*</span>
              </span>
              <textarea
                className="custom-textarea"
                value={editStepsText}
                onChange={(event) => {
                  setEditStepsText(event.target.value);
                  if (editFieldErrors.steps) {
                    setEditFieldErrors((prev) => ({ ...prev, steps: "" }));
                  }
                }}
                placeholder={
                  "One step per line:\nSeason the chicken\nRoast for 45 minutes"
                }
                rows={6}
                disabled={deleting || isSaving}
              />
              {editFieldErrors.steps ? (
                <p className="custom-error">{editFieldErrors.steps}</p>
              ) : null}
            </label>

            <div className="custom-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={deleting || isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelEdit}
                disabled={deleting || isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <Link
              to={`/recipe/${recipe.id}`}
              state={{ results: recipe }}
              className="custom-card-link"
            >
              {recipe.image ? (
                <img
                  className="custom-card-image"
                  src={recipe.image}
                  alt={recipe.title}
                />
              ) : (
                <div className="custom-card-image custom-card-image--empty">
                  No image
                </div>
              )}
            </Link>

            <div className="custom-card-content">
              <div className="custom-card-section">
                <h4>Ingredients</h4>
                <ul className="custom-list">
                  {(recipe.ingredients ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="custom-card-section">
                <h4>Prep steps</h4>
                <ol className="custom-list custom-list--ordered">
                  {(recipe.steps ?? []).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="custom-card-actions">
                <AddToPlannerButton recipe={recipe} />
                <AddToShoppingListButton recipe={recipe} />
              </div>
            </div>
          </>
        )}
      </div>
    </details>
  );
}

export default function CustomRecipesPage() {
  const {
    customRecipes,
    loading,
    saving,
    createCustomRecipe,
    deleteCustomRecipe,
    updateCustomRecipe,
  } = useCustomRecipes();
  const { withLoading } = useLoading();
  const fileRef = useRef(null);
  const [title, setTitle] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imageName, setImageName] = useState("");
  const [formOpen, setFormOpen] = useState(true);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    ingredients: "",
    steps: "",
  });
  const [ingredients, setIngredients] = useState([]);
  const [ingredientDraft, setIngredientDraft] = useState({
    name: "",
    quantity: "",
    unit: "",
  });

  const hasRecipes = (customRecipes?.length ?? 0) > 0;
  const busy = loading || saving;

  useEffect(() => {
    if (!hasRecipes) {
      setFormOpen(true);
    }
  }, [hasRecipes]);


  const sortedRecipes = useMemo(() => customRecipes ?? [], [customRecipes]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageData(null);
      setImageName("");
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => {
      setImageData(null);
      setFormError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setStepsText("");
    setImageData(null);
    setImageName("");
    setIngredients([]);
    setFormError("");
    setFieldErrors({ title: "", ingredients: "", steps: "" });
    setIngredientDraft({ name: "", quantity: "", unit: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const addIngredient = () => {
    const name = ingredientDraft.name.trim();
    if (!name) return;
    const quantityRaw = ingredientDraft.quantity.trim();
    const quantity =
      quantityRaw === "" ? null : Number(quantityRaw);
    const unit = ingredientDraft.unit.trim();
    const nextItem = {
      name,
      quantity: Number.isFinite(quantity) ? quantity : null,
      unit,
    };
    const line = formatIngredientLine(nextItem);
    if (!line) return;
    setIngredients((prev) => (prev.includes(line) ? prev : [...prev, line]));
    setFieldErrors((prev) => ({ ...prev, ingredients: "" }));
    setIngredientDraft({ name: "", quantity: "", unit: "" });
  };

  const removeIngredient = (line) =>
    setIngredients((prev) => prev.filter((item) => item !== line));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const steps = splitSteps(stepsText);
    const nextErrors = { title: "", ingredients: "", steps: "" };
    if (!title.trim()) {
      nextErrors.title = "Recipe title is required.";
    }
    if (!ingredients.length) {
      nextErrors.ingredients = "Add at least one ingredient.";
    }
    if (!steps.length) {
      nextErrors.steps = "Add at least one prep step.";
    }
    if (nextErrors.title || nextErrors.ingredients || nextErrors.steps) {
      setFieldErrors(nextErrors);
      return;
    }
    try {
      setFieldErrors({ title: "", ingredients: "", steps: "" });
      setFormError("");
      await withLoading(
        createCustomRecipe({
          title,
          image: imageData,
          ingredients,
          steps,
        })
      );
      resetForm();
      setFormOpen(false);
    } catch (err) {
      setFormError(err?.message || "Failed to create recipe.");
    }
  };

  const handleDelete = async (recipeId) => {
    try {
      setFormError("");
      await withLoading(deleteCustomRecipe(recipeId));
    } catch (err) {
      setFormError(err?.message || "Failed to delete recipe.");
    }
  };

  const handleUpdate = async (recipeId, input) => {
    try {
      setFormError("");
      await withLoading(updateCustomRecipe(recipeId, input));
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="custom-page">
      <section className="custom-hero glass-card">
        <div>
          <h1>My recipes</h1>
          <p>
            Create your own meals and use them in planner, prep plans, and
            shopping lists.
          </p>
        </div>
        {hasRecipes ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setFormOpen((open) => !open)}
            disabled={busy}
          >
            {formOpen ? "Hide form" : "Add recipe"}
          </button>
        ) : null}
      </section>

      {formOpen ? (
        <section className="custom-form-card glass-card">
          {formError ? (
            <p className="custom-error" role="alert" aria-live="assertive">
              {formError}
            </p>
          ) : null}
          <div className="custom-form-header">
            <h3>Add a recipe</h3>
          </div>
          <form className="custom-form" onSubmit={handleSubmit}>
            <label className="custom-field">
              <span>
                Title <span className="text-red-600">*</span>
              </span>
              <input
                className="custom-input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                placeholder="e.g. Sunday roast chicken"
                disabled={busy}
              />
              {fieldErrors.title ? (
                <p className="custom-error">{fieldErrors.title}</p>
              ) : null}
            </label>

            <label className="custom-field">
              <span>Image</span>
              <div className="custom-file-row">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="custom-file-input"
                  onChange={handleFileChange}
                  disabled={busy}
                />
                {imageName ? <p className="custom-meta">{imageName}</p> : null}
              </div>
              {imageData ? (
                <img className="custom-preview" src={imageData} alt="Preview" />
              ) : null}
            </label>

            <label className="custom-field">
              <span>
                Ingredients <span className="text-red-600">*</span>
              </span>
              <div className="custom-ingredient-row">
                <label className="custom-ingredient-control custom-ingredient-control--name">
                  <span>Name</span>
                  <input
                    className="custom-input custom-input--name"
                    placeholder="Ingredient name"
                    value={ingredientDraft.name}
                    onChange={(event) =>
                      setIngredientDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addIngredient();
                      }
                    }}
                    disabled={busy}
                  />
                </label>
                <label className="custom-ingredient-control">
                  <span>Qty</span>
                  <input
                    type="number"
                    step="0.01"
                    className="custom-input custom-input--qty"
                    placeholder="0"
                    value={ingredientDraft.quantity}
                    onChange={(event) =>
                      setIngredientDraft((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>
                <label className="custom-ingredient-control">
                  <span>Unit</span>
                  <input
                    className="custom-input custom-input--unit"
                    placeholder="e.g. g"
                    value={ingredientDraft.unit}
                    onChange={(event) =>
                      setIngredientDraft((prev) => ({
                        ...prev,
                        unit: event.target.value,
                      }))
                    }
                    disabled={busy}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={addIngredient}
                  disabled={busy}
                >
                  Add
                </button>
              </div>
              {ingredients.length ? (
                <div className="custom-ingredient-list">
                  {ingredients.map((line) => (
                    <span key={line} className="tag-badge">
                      {line}
                      <button
                        type="button"
                        onClick={() => removeIngredient(line)}
                        className="text-[var(--muted-400)] transition hover:text-[var(--ink-700)]"
                        disabled={busy}
                      >
                        <span className="sr-only">Remove {line}</span>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              {fieldErrors.ingredients ? (
                <p className="custom-error">{fieldErrors.ingredients}</p>
              ) : null}
            </label>

            <label className="custom-field">
              <span>
                Prep steps <span className="text-red-600">*</span>
              </span>
              <textarea
                className="custom-textarea"
                value={stepsText}
                onChange={(event) => {
                  setStepsText(event.target.value);
                  if (fieldErrors.steps) {
                    setFieldErrors((prev) => ({ ...prev, steps: "" }));
                  }
                }}
                placeholder={
                  "One step per line:\nSeason the chicken\nRoast for 45 minutes"
                }
                rows={6}
                disabled={busy}
              />
              {fieldErrors.steps ? (
                <p className="custom-error">{fieldErrors.steps}</p>
              ) : null}
            </label>

            <div className="custom-form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {saving ? "Saving..." : "Save recipe"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetForm}
                disabled={busy}
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="custom-list-card glass-card">
        <div className="custom-form-header">
          <h3>Your recipes</h3>
          <p className="custom-meta">
            {sortedRecipes.length} recipe{sortedRecipes.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading && !customRecipes ? <p>Loading recipes...</p> : null}
        {!loading && sortedRecipes.length === 0 ? (
          <p className="empty-state" data-testid="empty-custom-recipes">
            No custom recipes yet. Add your first one above.
          </p>
        ) : null}

        {sortedRecipes.length > 0 ? (
          <div className="custom-recipes-list">
            {sortedRecipes.map((recipe) => (
              <CustomRecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                deleting={saving}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
