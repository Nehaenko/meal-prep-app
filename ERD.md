### MangoDB — Storage shapes (logical)

**users** - Fields: _id, email, passwordHash, createdAt
Indexes: unique on email

**plannerItems** - Fields: _id, userId, recipeId, servings, createdAt
Indexes: compound { userId: 1, createdAt: -1 }

**favorites** - Fields: _id, userId, recipeId, createdAt
Indexes: compound unique { userId: 1, recipeId: 1 }

**recipesCache** - Fields: _id (you can make this provider:externalId), provider, externalId, title, image, ingredients[], steps[], timeMinutes, cachedAt
Indexes: unique on { provider: 1, externalId: 1 }, and TTL on cachedAt (optional) if you want auto-expiry

**shoppingLists** (per-recipe) - Fields: _id, userId, recipeId, title, items: [{ name, quantity?, unit?, substitutes?: string[] }], createdAt
Indexes: { userId: 1, recipeId: 1 }

**Normalization**: store items.name lowercased/trimmed