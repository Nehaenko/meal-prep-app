const BASE = "https://www.themealdb.com/api/json/v1/1";
export const PAGE_SIZE = 10;
const MAX_INGREDIENT_FIELDS = 20;

type MealFilterItem = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
};

type MealDetail = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
  strInstructions?: string | null;
  [key: string]: any;
};

type RecipeCard = {
  id: string;
  title: string;
  image: string | null;
  summary: string | null;
  readyInMinutes: number | null;
  calories: number | null;
};

export async function searchRecipes(
  ingredients: string[],
  page = 1
): Promise<{ results: RecipeCard[]; totalResults: number }> {
  const normalizedIngredients = [...new Set(ingredients.map((i) => i.trim()).filter(Boolean))];
  if (normalizedIngredients.length === 0) {
    return { results: [], totalResults: 0 };
  }

  const [primary, ...rest] = normalizedIngredients;
  let candidateIds = await fetchMealIdsForIngredient(primary);
  if (candidateIds.length === 0) {
    return { results: [], totalResults: 0 };
  }

  const detailCache = new Map<string, MealDetail>();
  if (rest.length) {
    const details = await Promise.all(
      candidateIds.map(async (id) => {
        const detail = await fetchMealDetail(id);
        if (detail) detailCache.set(id, detail);
        return detail;
      })
    );
    candidateIds = details
      .filter(
        (meal): meal is MealDetail =>
          !!meal && rest.every((ingredient) => mealContainsIngredient(meal, ingredient))
      )
      .map((meal) => meal.idMeal);
  }

  const totalResults = candidateIds.length;
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * PAGE_SIZE;
  const sliceIds = candidateIds.slice(start, start + PAGE_SIZE);

  const results = await Promise.all(
    sliceIds.map(async (id) => {
      let detail = detailCache.get(id);
      if (!detail) {
        const fetched = await fetchMealDetail(id);
        if (fetched) {
          detailCache.set(id, fetched);
          detail = fetched;
        }
      }
      return detail ? buildSearchResult(detail) : null;
    })
  );

  return {
    results: results.filter((card): card is RecipeCard => !!card),
    totalResults,
  };
}

export async function getRecipeById(id: string) {
  const numeric = id.replace("mealdb:", "");
  const meal = await fetchMealDetail(numeric);
  if (!meal) throw new Error("Meal not found");
  return normalizeMeal(meal);
}

function buildSearchResult(meal: MealDetail): RecipeCard {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb ?? null,
    summary: buildSummary(meal.strInstructions),
    readyInMinutes: null,
    calories: null,
  };
}

function normalizeMeal(meal: MealDetail) {
  return {
    id: `mealdb:${meal.idMeal}`,
    title: meal.strMeal,
    image: meal.strMealThumb ?? null,
    steps: parseSteps(meal.strInstructions),
    ingredients: buildIngredientList(meal),
    source: "themealdb",
    timeMinutes: null,
    calories: null,
    summary: buildSummary(meal.strInstructions),
  };
}

async function fetchMealIdsForIngredient(ingredient: string): Promise<string[]> {
  const url = new URL(`${BASE}/filter.php`);
  url.searchParams.set("i", ingredient);
  const json = await fetchJson(url, `filter ingredient: ${ingredient}`);
  const meals: MealFilterItem[] = json?.meals ?? [];
  return meals.map((meal) => meal.idMeal);
}

async function fetchMealDetail(id: string): Promise<MealDetail | null> {
  if (!id) return null;
  const url = new URL(`${BASE}/lookup.php`);
  url.searchParams.set("i", id);
  const json = await fetchJson(url, `lookup id: ${id}`);
  const meals: MealDetail[] = json?.meals ?? [];
  return meals[0] ?? null;
}

async function fetchJson(url: URL, context: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`TheMealDB ${context} ${res.status}`);
  }
  return res.json();
}

function buildSummary(instructions?: string | null) {
  if (!instructions) return null;
  const stripped = instructions.replace(/\s+/g, " ").trim();
  return stripped.length > 180 ? `${stripped.slice(0, 177)}…` : stripped;
}

function parseSteps(instructions?: string | null) {
  if (!instructions) return [];
  return instructions
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((step) => step.trim())
    .map((step) => step.replace(/^step\s*\d+\s*[:.)-]?\s*/i, "").trim())
    .filter((step) => step && !/^step\s*\d+$/i.test(step));
}

function buildIngredientList(meal: MealDetail) {
  const items: string[] = [];
  for (let i = 1; i <= MAX_INGREDIENT_FIELDS; i++) {
    const ingredient = (meal[`strIngredient${i}`] as string | undefined)?.trim();
    const measure = (meal[`strMeasure${i}`] as string | undefined)?.trim();
    if (!ingredient) continue;
    const combined = [measure, ingredient].filter(Boolean).join(" ").trim();
    items.push(combined);
  }
  return items;
}

function mealContainsIngredient(meal: MealDetail, ingredient: string) {
  const target = ingredient.trim().toLowerCase();
  if (!target) return true;
  for (let i = 1; i <= MAX_INGREDIENT_FIELDS; i++) {
    const name = (meal[`strIngredient${i}`] as string | undefined)?.trim().toLowerCase();
    if (!name) continue;
    if (name.includes(target)) return true;
  }
  return false;
}
