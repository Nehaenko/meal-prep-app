
const BASE = 'https://api.spoonacular.com';
const KEY = process.env.SPOONACULAR_KEY as string;
if (!KEY) console.warn('SPOONACULAR_KEY missing');

type SpoonSearchResult = {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
};

type SpoonRecipeInfo = {
  id: number;
  title: string;
  image?: string;
  extendedIngredients?: { original: string }[];
  analyzedInstructions?: { steps: { number: number; step: string }[] }[];
  readyInMinutes?: number;
  nutrition?: { nutrients?: { name: string; amount: number; unit: string }[] };
};

export async function searchRecipes(ingredients: string[], page = 1): Promise<SpoonSearchResult[]> {
  const offset = (page - 1) * 10;
  const url = new URL(`${BASE}/recipes/complexSearch`);
  url.searchParams.set('apiKey', KEY);
  url.searchParams.set('includeIngredients', ingredients.join(','));
  url.searchParams.set('number', '10');
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('addRecipeInformation', 'true'); // brings image + time
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Spoonacular search ${res.status}`);
  const json = await res.json();
  const results: any[] = json?.results ?? [];
  return results.map(r => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes
  }));
}

export async function getRecipeById(id: string) {
  // id is like "spoon:12345" or "12345"
  const numeric = Number(id.replace('spoon:', ''));
  const url = new URL(`${BASE}/recipes/${numeric}/information`);
  url.searchParams.set('apiKey', KEY);
  url.searchParams.set('includeNutrition', 'true');

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Spoonacular info ${res.status}`);
  const data = (await res.json()) as SpoonRecipeInfo;
  return normalizeRecipe(data);
}

export function normalizeRecipe(s: SpoonRecipeInfo) {
  const steps =
    s.analyzedInstructions?.[0]?.steps?.map(st => st.step.trim()).filter(Boolean) ?? [];
  const ingredients =
    s.extendedIngredients?.map(i => i.original.trim()).filter(Boolean) ?? [];

  const calories = s.nutrition?.nutrients?.find(n => n.name.toLowerCase() === 'calories');

  return {
    id: `spoon:${s.id}`,
    title: s.title,
    image: s.image ?? null,
    steps,
    ingredients,
    source: 'spoonacular',
    timeMinutes: s.readyInMinutes ?? null,
    calories: calories ? Math.round(calories.amount) : null
  };
}
