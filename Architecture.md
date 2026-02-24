| Operation                           | Source                              | Notes                                                         |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `searchRecipes(ingredients)`        | TheMealDB                           | Server adapter; cache detail on first open                    |
| `recipe(id)`                        | recipesCache → fallback TheMealDB   | On miss, fetch → normalize → upsert cache                     |
| `plannerItems`                      | Mongo (`plannerItems` by `userId`)  | Sort by `createdAt desc`                                      |
| `addToPlanner`                      | Mongo insertMany                    | Validate servings; dedupe by (`userId`,`recipeId`) |
| `removeFromPlanner`                 | Mongo deleteOne                     | By (`userId`,`recipeId`)                                      |
| `clearPlanner`                      | Mongo deleteMany                    | By `userId`                                                   |
| `toggleFavorite`                    | Mongo upsert/delete                 | Unique index avoids dupes                                     |
| `createShoppingList(recipeId)`      | Compute missing → Mongo insert      | Missing = recipe.ingredients      |
| `updateShoppingList(listId, items)` | Mongo updateOne                     | Re-validate item names/units                                  |
| `deleteShoppingList(listId)`        | Mongo deleteOne                     |                                                               |
| `generatePrepPlan(recipeIds)`       | LLM                                 | Send compact JSON (ingredients/steps); validate JSON result   |
