import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

type PrepStep = { order: number; description: string; appliesToRecipeIds: string[] };
type RecipeBrief = { id: string; title?: string | null; ingredients: string[]; steps: string[] };

const PREP_PLAN_SCHEMA = {
  name: 'prep_plan',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            order: { type: 'integer' },
            description: { type: 'string' },
            appliesToRecipeIds: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['order', 'description', 'appliesToRecipeIds']
        }
      }
    },
    required: ['steps']
  },
  strict: true
} as const;

function extractJsonObject(text: string | null | undefined): any {
  const raw = text ?? '';
  if (!raw.trim()) return { steps: [] };
  try {
    return JSON.parse(raw);
  } catch {
    // Try to salvage a JSON object embedded in extra prose/code fences.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { steps: [] };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { steps: [] };
    }
  }
}

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

  let data: any = { steps: [] };
  try {
    // Prefer structured output so we always get valid JSON back.
    const resp = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      text: { format: { type: 'json_schema', ...PREP_PLAN_SCHEMA } },
      input: [
        {
          role: 'system',
          content:
            'Merge multiple recipes into one consolidated prep plan. Use overlaps in ingredients and steps. Return a compact, practical plan.'
        },
        { role: 'user', content: JSON.stringify(payload) }
      ]
    });
    data = extractJsonObject(resp.output_text);
  } catch (err) {
    console.error('Structured prep plan failed, falling back to chat.completions', err);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'Merge multiple recipes into one consolidated prep plan. Use the provided recipe steps and ingredients to find overlaps. Reply ONLY with JSON: {"steps":[{"order":1,"description":"...","appliesToRecipeIds":["id1","id2"]}]}'
      },
      { role: 'user', content: JSON.stringify(payload) }
    ];
    const fallback = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0
    });
    data = extractJsonObject(fallback.choices[0]?.message?.content);
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
