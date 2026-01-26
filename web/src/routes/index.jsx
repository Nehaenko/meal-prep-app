import { Routes, Route } from "react-router";
import SearchPage from "../components/SearchPage/SearchPage";
import MealPage from "../components/MealPage/MealPage";
import PlannerPage from "../components/Planner/Planner";
import FavouritesPage from "../components/Favourites/Favourites";
import ShoppingListPage from "../components/ShoppingList/ShoppingListPage";

// Optional: a tiny 404 page
function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">404 — Page not found</h1>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/recipe/:id" element={<MealPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="/shopping-list" element={<ShoppingListPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
