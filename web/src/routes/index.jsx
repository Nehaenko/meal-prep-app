import { Routes, Route } from "react-router";
import SearchPage from "../components/SearchPage/SearchPage";
import MealPage from "../components/MealPage/MealPage";
import PlannerPage from "../components/Planner/Planner";
import FavouritesPage from "../components/Favourites/Favourites";
import ShoppingListPage from "../components/ShoppingList/ShoppingListPage";
import PrepPlanPage from "../components/PrepPlan/PrepPlanPage";
import CustomRecipesPage from "../components/CustomRecipes/CustomRecipesPage";
import NotFoundPage from "../components/NotFound/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/recipe/:id" element={<MealPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="/shopping-list" element={<ShoppingListPage />} />
      <Route path="/prep-plan" element={<PrepPlanPage />} />
      <Route path="/my-recipes" element={<CustomRecipesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
