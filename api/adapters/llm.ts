import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

type PrepStep = { order: number; description: string; appliesToRecipeIds: string[] };
type RecipeBrief = { id: string; title?: string | null; ingredients: string[]; steps: string[] };

export async function generatePrepPlan(recipes: RecipeBrief[]): Promise<PrepStep[]> {
  if (!client) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const payload = {
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps
    }))
  };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'Merge multiple recipes into one consolidated prep plan. Use the provided recipe steps and ingredients to find overlaps. Reply ONLY with JSON: {"steps":[{"order":1,"description":"...","appliesToRecipeIds":["id1","id2"]}]}'
    },
    { role: 'user', content: JSON.stringify(payload) }
  ];

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0
  });

  const raw = resp.choices[0]?.message?.content ?? '{"steps":[]}';
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { steps: [] };
  }

  const steps = Array.isArray(data.steps) ? data.steps : [];
  return steps.map((s: any, i: number) => ({
    order: Number(s?.order ?? i + 1),
    description: String(s?.description ?? ''),
    appliesToRecipeIds: Array.isArray(s?.appliesToRecipeIds)
      ? s.appliesToRecipeIds
      : recipes.map((r) => r.id)
  }));
}
