import { useMemo, useState } from "react";
import { useShoppingLists } from "../../state/ShoppingListContext";
import { useLoading } from "../../state/LoadingContext";

const SERVING_OPTIONS = [1, 2, 4, 6, 8];

const normalizeName = (name) => (name ?? "").trim().toLowerCase();
const formatName = (name) =>
  name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : "";

function formatQuantity(value) {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export default function ShoppingListPage() {
  const {
    shoppingLists,
    loading,
    saving,
    createShoppingList,
    updateShoppingList,
    clearShoppingLists,
  } = useShoppingLists();
  const { withLoading } = useLoading();
  const [servings, setServings] = useState(1);
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState({ name: "", quantity: "", unit: "" });
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "",
    note: "",
  });
  const [error, setError] = useState("");

  const aggregated = useMemo(() => {
    if (!shoppingLists) return [];
    const map = new Map();

    shoppingLists.forEach((list) => {
      (list.items ?? []).forEach((item) => {
        const key = normalizeName(item.name);
        if (!key) return;

        const sourceLabel =
          item?.note?.trim() ||
          (list.recipeId === "manual" ? "Manual" : list.title);

        const entry = map.get(key) ?? {
          key,
          name: item.name?.trim() || key,
          unit: item.unit ?? "",
          quantity: 0,
          hasQuantity: false,
          mixedUnits: false,
          sources: new Set(),
        };

        entry.sources.add(sourceLabel);

        if (item.quantity != null && !Number.isNaN(item.quantity)) {
          if (!entry.hasQuantity) {
            entry.quantity = 0;
            entry.hasQuantity = true;
          }
          if (
            entry.unit &&
            item.unit &&
            entry.unit.toLowerCase() !== item.unit.toLowerCase()
          ) {
            entry.mixedUnits = true;
          } else if (!entry.unit && item.unit) {
            entry.unit = item.unit;
          }
          if (!entry.mixedUnits) {
            entry.quantity += Number(item.quantity);
          }
        }

        map.set(key, entry);
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [shoppingLists]);
  const busy = loading || saving;

  const manualList = useMemo(
    () => shoppingLists?.find((list) => list.recipeId === "manual") ?? null,
    [shoppingLists]
  );

  const startEdit = (entry) => {
    setEditKey(entry.key);
    setDraft({
      name: entry.name,
      quantity: entry.hasQuantity ? String(entry.quantity) : "",
      unit: entry.unit ?? "",
    });
  };

  const cancelEdit = () => {
    setEditKey(null);
    setDraft({ name: "", quantity: "", unit: "" });
  };

  const saveEdit = async () => {
    const name = draft.name.trim();
    if (!name) {
      setError("Ingredient name is required.");
      return;
    }

    const quantity =
      draft.quantity === "" ? undefined : Number(draft.quantity);
    const unit = draft.unit.trim() || undefined;

    try {
      setError("");
      const listsToUpdate = (shoppingLists ?? []).filter((list) =>
        (list.items ?? []).some((item) => normalizeName(item.name) === editKey)
      );

      await withLoading(
        (async () => {
          for (const list of listsToUpdate) {
            const nextItems = (list.items ?? []).map((item) =>
              normalizeName(item.name) === editKey
                ? { ...item, name, quantity, unit }
                : item
            );
            await updateShoppingList(list.id, nextItems);
          }
        })()
      );

      cancelEdit();
    } catch (err) {
      setError(err?.message || "Failed to update item.");
    }
  };

  const removeItem = async (key) => {
    try {
      setError("");
      const listsToUpdate = (shoppingLists ?? []).filter((list) =>
        (list.items ?? []).some((item) => normalizeName(item.name) === key)
      );

      await withLoading(
        (async () => {
          for (const list of listsToUpdate) {
            const nextItems = (list.items ?? []).filter(
              (item) => normalizeName(item.name) !== key
            );
            await updateShoppingList(list.id, nextItems);
          }
        })()
      );
    } catch (err) {
      setError(err?.message || "Failed to remove item.");
    }
  };

  const addItem = async (event) => {
    event.preventDefault();
    const name = newItem.name.trim();
    if (!name) {
      setError("Ingredient name is required.");
      return;
    }

    const quantity =
      newItem.quantity === "" ? undefined : Number(newItem.quantity);
    const unit = newItem.unit.trim() || undefined;
    const note = newItem.note.trim() || undefined;

    try {
      setError("");
      await withLoading(
        (async () => {
          const list = manualList || (await createShoppingList("manual"));
          if (!list?.id) {
            throw new Error("Failed to create manual list.");
          }

          const baseItems = list.items ?? [];
          await updateShoppingList(list.id, [
            ...baseItems,
            { name, quantity, unit, note },
          ]);
        })()
      );

      setNewItem({ name: "", quantity: "", unit: "", note: "" });
    } catch (err) {
      setError(err?.message || "Failed to add item.");
    }
  };

  const handleClearAll = async () => {
    try {
      setError("");
      await withLoading(clearShoppingLists());
    } catch (err) {
      setError(err?.message || "Failed to clear shopping list.");
    }
  };

  return (
    <div className="shopping-page">
      <section className="shopping-header glass-card">
        <div className="shopping-header-content">
          <h1>Shopping list</h1>
          <p>
            See everything you need in one place, with notes on which meals use
            each ingredient.
          </p>
          {error ? <p className="shopping-error">{error}</p> : null}
        </div>
        <div className="shopping-servings">
          <span className="shopping-servings-label">Servings</span>
          <div className="pill-scroll">
            {SERVING_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setServings(option)}
                className={`chip ${servings === option ? "active" : ""}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="shopping-panel glass-card">
        <div className="shopping-panel-header">
          <h3>Ingredients</h3>
          <div className="shopping-panel-actions">
            <span className="shopping-count">
              {aggregated.length} item{aggregated.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="btn btn-soft"
              onClick={handleClearAll}
              disabled={busy || aggregated.length === 0}
            >
              Remove all
            </button>
          </div>
        </div>

        {loading && !shoppingLists && <p>Loading shopping list...</p>}
        {!loading && aggregated.length === 0 && (
          <p className="empty-state" data-testid="empty-shopping-list">Your shopping list is empty.</p>
        )}

        {aggregated.length > 0 && (
          <ul className="shopping-items">
            {aggregated.map((entry) => {
              const scaledQuantity =
                entry.hasQuantity && !entry.mixedUnits
                  ? entry.quantity * servings
                  : null;
              const sources = Array.from(entry.sources);
              return (
                <li key={entry.key} className="shopping-item">
                  <div className="shopping-item-main">
                    {editKey === entry.key ? (
                      <input
                        className="shopping-input"
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      <p className="shopping-item-name">
                        {formatName(entry.name)}
                      </p>
                    )}
                    {sources.length > 0 && (
                      <p className="shopping-item-meta">
                        Needed for: {sources.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="shopping-item-qty">
                    {editKey === entry.key ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          className="shopping-input shopping-input--qty"
                          value={draft.quantity}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              quantity: event.target.value,
                            }))
                          }
                        />
                        <input
                          className="shopping-input shopping-input--unit"
                          value={draft.unit}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              unit: event.target.value,
                            }))
                          }
                          placeholder="unit"
                        />
                      </>
                    ) : entry.mixedUnits ? (
                      <span className="shopping-mixed">Mixed units</span>
                    ) : (
                      <span>
                        {formatQuantity(scaledQuantity)}{" "}
                        {entry.unit ? entry.unit : ""}
                      </span>
                    )}
                  </div>

                  <div className="shopping-item-actions">
                    {editKey === entry.key ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => startEdit(entry)}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-soft"
                          onClick={() => removeItem(entry.key)}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="shopping-panel glass-card">
        <div className="shopping-panel-header">
          <h3>Add ingredient</h3>
          <span className="shopping-hint">Saved in your manual list.</span>
        </div>
        <form className="shopping-add-form" onSubmit={addItem}>
          <label className="sr-only" htmlFor="shopping-ingredient-name">
            Ingredient name
          </label>
          <input
            id="shopping-ingredient-name"
            className="shopping-input"
            value={newItem.name}
            onChange={(event) =>
              setNewItem((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Ingredient name"
            disabled={saving}
          />
          <label className="sr-only" htmlFor="shopping-ingredient-note">
            Recipe note
          </label>
          <input
            id="shopping-ingredient-note"
            className="shopping-input shopping-input--note"
            value={newItem.note}
            onChange={(event) =>
              setNewItem((prev) => ({ ...prev, note: event.target.value }))
            }
            placeholder="Recipe note (optional)"
            disabled={saving}
          />
          <label className="sr-only" htmlFor="shopping-ingredient-qty">
            Quantity
          </label>
          <input
            id="shopping-ingredient-qty"
            type="number"
            step="0.01"
            className="shopping-input shopping-input--qty"
            value={newItem.quantity}
            onChange={(event) =>
              setNewItem((prev) => ({ ...prev, quantity: event.target.value }))
            }
            placeholder="Qty"
            disabled={saving}
          />
          <label className="sr-only" htmlFor="shopping-ingredient-unit">
            Unit
          </label>
          <input
            id="shopping-ingredient-unit"
            className="shopping-input shopping-input--unit"
            value={newItem.unit}
            onChange={(event) =>
              setNewItem((prev) => ({ ...prev, unit: event.target.value }))
            }
            placeholder="Unit"
            disabled={saving}
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Add item
          </button>
        </form>
      </section>
    </div>
  );
}
