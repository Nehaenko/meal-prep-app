import "./App.css";
import useOnlineStatus from "./state/useOnlineStatus";
import { useAuth } from "./state/AuthContext";
import { useLoading } from "./state/LoadingContext";
import Header from "./components/Header";
import ErrorBanner from "./components/ui/ErrorBanner";
import Loader from "./components/ui/Loader";;
import AppRoutes from "./routes"; 

function App() {
  const online = useOnlineStatus();
  const { loading } = useAuth();
  const { isLoading: uiLoading } = useLoading();

  return (
    <div className="app-shell">
      {!online && <ErrorBanner />}
      {(loading || uiLoading) && <Loader />}
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-36 pt-4 sm:pt-6">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
