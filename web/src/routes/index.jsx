import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SearchPage from "../components/SearchPage/SearchPage";
import Loader from "../components/ui/Loader";
import { useAuth } from "../state/AuthContext";
import { hasHowItWorksPending } from "../lib/howItWorks";

const MealPage = lazy(() => import("../components/MealPage/MealPage"));
const PlannerPage = lazy(() => import("../components/Planner/Planner"));
const FavouritesPage = lazy(() => import("../components/Favourites/Favourites"));
const ShoppingListPage = lazy(() =>
  import("../components/ShoppingList/ShoppingListPage")
);
const PrepPlanPage = lazy(() => import("../components/PrepPlan/PrepPlanPage"));
const CustomRecipesPage = lazy(() =>
  import("../components/CustomRecipes/CustomRecipesPage")
);
const HowItWorksPage = lazy(() =>
  import("../components/HowItWorks/HowItWorksPage")
);
const PrivacyPolicyPage = lazy(() =>
  import("../components/Privacy/PrivacyPolicyPage")
);
const NotFoundPage = lazy(() =>
  import("../components/NotFound/NotFoundPage")
);

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
    <Suspense fallback={<Loader label="Loading page" />}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/recipe/:id" element={<MealPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/favourites" element={<FavouritesPage />} />
        <Route path="/shopping-list" element={<ShoppingListPage />} />
        <Route path="/prep-plan" element={<PrepPlanPage />} />
        <Route path="/my-recipes" element={<CustomRecipesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
