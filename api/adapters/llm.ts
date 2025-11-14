import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PrepStep = { order: number; description: string; appliesToRecipeIds: string[] };

export async function generatePrepPlan(recipeIds: string[]): Promise<PrepStep[]> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'Merge multiple recipes into one consolidated prep plan. Reply ONLY with JSON: {"steps":[{"order":1,"description":"...","appliesToRecipeIds":["id1","id2"]}]}'
    },
    { role: 'user', content: JSON.stringify({ recipeIds }) }
  ];

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0
  });

  const raw = resp.choices[0]?.message?.content ?? '{"steps":[]}';
  let data: any;
  try { data = JSON.parse(raw); } catch { data = { steps: [] }; }

  const steps = Array.isArray(data.steps) ? data.steps : [];
  return steps.map((s: any, i: number) => ({
    order: Number(s?.order ?? i + 1),
    description: String(s?.description ?? ''),
    appliesToRecipeIds: Array.isArray(s?.appliesToRecipeIds) ? s.appliesToRecipeIds : recipeIds
  }));
}
