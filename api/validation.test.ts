import { describe, expect, it } from "vitest";
import { customRecipeSchema, sanitizeText } from "./validation";

describe("API validation", () => {
  it("normalizes pasted markup into safe plain text", () => {
    expect(sanitizeText("  Chop <strong>two</strong> onions  ")).toBe(
      "Chop two onions"
    );
  });

  it("rejects unsupported custom recipe image values", () => {
    expect(
      customRecipeSchema.safeParse({
        title: "Soup",
        image: "javascript:alert(1)",
        ingredients: ["onion"],
        steps: ["Cook"],
      }).success
    ).toBe(false);
  });
});
