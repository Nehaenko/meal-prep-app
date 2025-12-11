import "./App.css";
import useOnlineStatus from "./state/useOnlineStatus";
import { useAuth } from "./state/AuthContext";
import { useLoading } from "./state/LoadingContext";
import Header from "./components/Header";
import ErrorBanner from "./components/ui/ErrorBanner";
import Loader from "./components/ui/Loader";
import ShoppingListsDock from "./components/ShoppingList/ShoppingListsDock";
import PrepStepsList from "./components/Planner/PrepSteps";
import AppRoutes from "./routes"; 

function App() {
  const online = useOnlineStatus();
  const { loading } = useAuth();
  const { isLoading: uiLoading } = useLoading();

  return (
    <>
      {!online && <ErrorBanner />}
      {(loading || uiLoading) && <Loader />}
      <Header />
      <div className="h-screen">
        <AppRoutes />
      </div>
      {/* <ShoppingListsDock />
      <PrepStepsList /> */}
    </>
  );
}

export default App;
