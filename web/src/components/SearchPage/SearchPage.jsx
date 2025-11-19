import { useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { useLoading } from "../../state/LoadingContext";
import SearchRecipes from "../../graphql/SearchRecipes.gql";
import ResultsGrid from "./ResultsGrid";
import SearchPagination from "./Pagination";

const PAGE_SIZE = 10;

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [page, setPage] = useState(1);
  
  const inputRef = useRef(null);
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

  function executeSearch(targetIngredients, targetPage) {
    if (!targetIngredients.length) return;
    setPage(targetPage);
    withLoading(
      runSearch({
        variables: { ingredients: targetIngredients, page: targetPage },
      })
    );
  }

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
  const endIndex = items.length ? (currentPage - 1) * PAGE_SIZE + items.length : 0;
  const displayTotal = totalResults || endIndex;
  const canPaginate = items.length > 0 && totalPages > 1;

  return (
    <div className="mt-8 px-4">
      <form
        className="mx-auto flex max-w-xl items-center gap-2"
        onSubmit={onSubmit}
      >
        <label htmlFor="ingredient-search" className="sr-only">
          Search ingredients
        </label>
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {/* pot icon */}
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 7h10" />
              <path d="M12 5v2" />
              <path d="M3 11h2" />
              <path d="M19 11h2" />
              <rect x="5" y="9" width="14" height="9" rx="2" />
            </svg>
          </div>
          <div
            className="flex min-h-[44px] w-full flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white py-1.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm
                       placeholder:text-gray-400 focus-within:border-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500"
            onClick={() => inputRef.current?.focus()}
          >
            {ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-gray-200"
              >
                {ingredient}
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(ingredient)}
                  className="text-gray-400 transition hover:text-gray-600"
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
                  ? "Type ingredients, separated by commas…"
                  : ""
              }
              className="flex-1 border-0 bg-transparent py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white
                     shadow-sm hover:bg-gray-900 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mx-auto mt-4 max-w-xl rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {!loading && hasSearched && items.length === 0 && (
        <p className="mx-auto mt-6 max-w-xl text-sm text-gray-500">
          No recipes found. Try different ingredients.
        </p>
      )}

      {!loading && hasSearched && items.length > 0 && (
        <p className="mx-auto mt-6 max-w-5xl text-xs uppercase tracking-wide text-gray-500">
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
