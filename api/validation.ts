import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const trimString = (value: string) => value.trim();
const trimmedString = () => z.string().trim();

export const emailSchema = z
  .string()
  .email()
  .max(320)
  .transform((value) => trimString(value).toLowerCase());

export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/);

export const idSchema = z.string().min(1).max(128);

export const ingredientsSchema = z
  .array(trimmedString().min(1).max(120))
  .min(1)
  .max(100);

export const stepsSchema = z
  .array(trimmedString().min(1).max(500))
  .min(1)
  .max(200);

export const customRecipeSchema = z.object({
  title: trimmedString().min(1).max(120),
  image: z.string().url().max(2048).optional().nullable(),
  ingredients: ingredientsSchema,
  steps: stepsSchema,
});

export const plannerItemSchema = z.object({
  recipeId: idSchema,
  servings: z.number().int().min(1).max(50),
});

export const shoppingItemSchema = z.object({
  name: trimmedString().min(1).max(120),
  quantity: z.number().min(0).max(100000).optional().nullable(),
  unit: trimmedString().max(32).optional().nullable(),
  substitutes: z.array(trimmedString().min(1).max(120)).max(50).optional().nullable(),
  note: trimmedString().max(300).optional().nullable(),
});

export const prepStepSchema = z.object({
  order: z.number().int().min(1).max(1000),
  description: trimmedString().min(1).max(500),
  appliesToRecipeIds: z.array(idSchema).min(1).max(50),
});

export const prepPlanSchema = z.object({
  title: trimmedString().min(1).max(120),
  recipeIds: z.array(idSchema).min(1).max(50),
  steps: z.array(prepStepSchema).min(1).max(200),
});

export const searchRecipesSchema = z.object({
  ingredients: z.array(trimmedString().min(1).max(80)).min(1).max(20),
  page: z.number().int().min(1).max(200).optional(),
});

export const sanitizeText = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();

export const sanitizeStringArray = (values: string[]) =>
  values.map(sanitizeText).filter((value) => value.length > 0);
