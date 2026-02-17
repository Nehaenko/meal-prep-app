import { Routes, Route, Navigate } from "react-router-dom";
import SearchPage from "../components/SearchPage/SearchPage";
import MealPage from "../components/MealPage/MealPage";
import PlannerPage from "../components/Planner/Planner";
import FavouritesPage from "../components/Favourites/Favourites";
import ShoppingListPage from "../components/ShoppingList/ShoppingListPage";
import PrepPlanPage from "../components/PrepPlan/PrepPlanPage";
import CustomRecipesPage from "../components/CustomRecipes/CustomRecipesPage";
import HowItWorksPage from "../components/HowItWorks/HowItWorksPage";
import NotFoundPage from "../components/NotFound/NotFoundPage";
import { useAuth } from "../state/AuthContext";
import { hasHowItWorksPending } from "../lib/howItWorks";

function HomeRoute() {
  const { user, initialized } = useAuth();
  if (!initialized) return null;
  if (user && hasHowItWorksPending()) {
    return <Navigate to="/how-it-works" replace />;
  }
  return <SearchPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/recipe/:id" element={<MealPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="/shopping-list" element={<ShoppingListPage />} />
      <Route path="/prep-plan" element={<PrepPlanPage />} />
      <Route path="/my-recipes" element={<CustomRecipesPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
