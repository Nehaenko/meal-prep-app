
### Validation Rules (plain English)

- `servings >= 1`
- `PlannerItem.recipeId` must exist (cached or retrievable)
- **Per-recipe ShoppingList creation:**
    - Default list title from recipe title
    - “Missing” items = `recipe.ingredients − (user pantry ∪ initial search ingredients)`
- ShoppingList edits must ensure `items.name` is non-empty; quantities optional
- Auth: strong password policy; unique email; all user-scoped operations require auth
