import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useLazyQuery } from "@apollo/client/react";
import { useLoading } from "../../state/LoadingContext";
import { SearchRecipes } from "../../graphql";
import ResultsGrid from "./ResultsGrid";
import SearchPagination from "./Pagination";

const PAGE_SIZE = 10;
const quickFilters = [
  { label: "Chicken", value: "chicken", emoji: "🍗" },
  { label: "Salmon", value: "salmon", emoji: "🐟" },
  { label: "Beef", value: "beef", emoji: "🥩" },
  { label: "Rice", value: "rice", emoji: "🍚" },
  { label: "Broccoli", value: "broccoli", emoji: "🥦" },
  { label: "Egg", value: "egg", emoji: "🍳" },
];
const cx = (...c) => c.filter(Boolean).join(" ");

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const inputRef = useRef(null);
  const hydratedRef = useRef(false);
  const [runSearch, { data, loading, error }] = useLazyQuery(SearchRecipes, {
    fetchPolicy: "network-only",
  });

  const { withLoading } = useLoading();

  function onSubmit(e) {
    e.preventDefault();
    const pending = tokenize(inputValue);
    const finalIngredients = Array.from(new Set([...ingredients, ...pending]));
    if (finalIngredients.length === 0) return;
    setIngredients(finalIngredients);
    setInputValue("");
    executeSearch(finalIngredients, 1);
  }

  function tokenize(value) {
    return value
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  function addIngredientsFromParts(parts) {
    if (!parts.length) return;
    const normalized = parts.flatMap((part) => tokenize(part));
    if (!normalized.length) return;
    setIngredients((prev) => {
      const set = new Set(prev);
      normalized.forEach((token) => set.add(token));
      return Array.from(set);
    });
  }

  function handleInputChange(e) {
    const { value } = e.target;
    if (!value) {
      setInputValue("");
      return;
    }
    const parts = value.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 0) {
      setInputValue("");
      return;
    }
    const endsWithSeparator = /[,\s]$/.test(value);
    const completed = endsWithSeparator ? parts : parts.slice(0, -1);
    const remainder = endsWithSeparator ? "" : parts[parts.length - 1] ?? "";
    if (completed.length) {
      addIngredientsFromParts(completed);
    }
    setInputValue(remainder);
  }

  function handleInputKeyDown(e) {
    if ((e.key === "Enter" || e.key === "Tab") && inputValue.trim()) {
      e.preventDefault();
      addIngredientsFromParts([inputValue]);
      setInputValue("");
      return;
    }
    if (e.key === "Backspace" && !inputValue && ingredients.length) {
      e.preventDefault();
      setIngredients((prev) => prev.slice(0, -1));
    }
  }

  function handleInputBlur() {
    if (!inputValue.trim()) return;
    addIngredientsFromParts([inputValue]);
    setInputValue("");
  }

  function handleRemoveIngredient(name) {
    setIngredients((prev) => prev.filter((item) => item !== name));
  }

  const executeSearch = useCallback(
    (targetIngredients, targetPage) => {
      if (!targetIngredients.length) return;
      setPage(targetPage);
      withLoading(
        runSearch({
          variables: { ingredients: targetIngredients, page: targetPage },
        })
      ).catch((err) => {
        // Ignore aborts from route changes / StrictMode double-invoke
        if (err?.name === "AbortError") return;
        throw err;
      });
      setSearchParams({
        q: targetIngredients.join(","),
        page: String(targetPage),
      });
    },
    [runSearch, setSearchParams, withLoading]
  );

  function goToPage(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    if (!ingredients.length || safePage === page) return;
    executeSearch(ingredients, safePage);
  }

  const searchResult = data?.searchRecipes;
  const items = searchResult?.items ?? [];
  const totalPages = searchResult?.totalPages ?? 1;
  const totalResults = searchResult?.totalResults ?? 0;
  const currentPage = searchResult?.page ?? page;
  const hasSearched = !!data;
  const startIndex = items.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endIndex = items.length
    ? (currentPage - 1) * PAGE_SIZE + items.length
    : 0;
  const displayTotal = totalResults || endIndex;
  const canPaginate = items.length > 0 && totalPages > 1;

  useEffect(() => {
    if (hydratedRef.current) return;
    const query = searchParams.get("q");
    const page = Number(searchParams.get("page")) || 1;
    const fromUrl = query ? query.split(",").filter(Boolean) : [];
    if (fromUrl.length) {
      setIngredients(fromUrl);
      executeSearch(fromUrl, page);
    }
    hydratedRef.current = true;
  }, [executeSearch, searchParams]);

  const quickSelected = useMemo(() => ingredients[0], [ingredients]);

  function handleQuickFilter(value) {
    const token = value.toLowerCase();
    setIngredients([token]);
    setInputValue("");
    executeSearch([token], 1);
  }

  return (
    <div className="mt-4 space-y-6">
      <section className="glass-card px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-wide text-[var(--green-700)]">
              Hello foodie 👋
            </h1>
            <p className="text-[var(--muted-400)] font-medium">
              Nutritious food at your fingertips.
            </p>
          </div>
        </div>

        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={onSubmit}
        >
          <label htmlFor="ingredient-search" className="sr-only">
            Search ingredients
          </label>
          <div
            className="search-shell flex-1 flex-wrap"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {ingredients.map((ingredient) => (
                <span key={ingredient} className="tag-badge">
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ingredient)}
                    className="text-[var(--muted-400)] transition hover:text-[var(--ink-700)]"
                  >
                    <span className="sr-only">Remove {ingredient}</span>
                    &times;
                  </button>
                </span>
              ))}
              <input
                id="ingredient-search"
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  ingredients.length === 0
                    ? "Find your food here…"
                    : "Add more ingredients"
                }
                className="search-input min-w-[140px]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              Search
            </button>
          </div>
        </form>

        <div className="pill-scroll mt-4">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={cx(
                "chip text-sm",
                quickSelected === filter.value ? "active" : "",
              )}
              onClick={() => handleQuickFilter(filter.value)}
            >
              <span className="text-lg" aria-hidden>
                {filter.emoji}
              </span>
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="glass-card mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {!loading && hasSearched && items.length === 0 && (
        <p className="mx-auto mt-2 max-w-3xl text-sm font-semibold text-[var(--ink-700)] empty-state">
          No recipes found. Try another ingredient or category.
        </p>
      )}

      {!loading && hasSearched && items.length > 0 && (
        <p className="mx-auto mt-1 max-w-5xl text-xs uppercase tracking-wide text-[var(--ink-700)]">
          Showing {startIndex}-{Math.min(endIndex, displayTotal)} of{" "}
          {displayTotal} recipes
        </p>
      )}

      <ResultsGrid items={items} />
      <SearchPagination
        canPaginate={canPaginate}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        goToPage={goToPage}
      />
    </div>
  );
}
