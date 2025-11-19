import "./App.css";
import { Routes, Route } from "react-router";
import useOnlineStatus from "./state/useOnlineStatus";
import { useAuth } from "./state/AuthContext";
import { useLoading } from "./state/LoadingContext";
import SearchPage from "./components/SearchPage/SearchPage";
import Planner from "./components/Planner/Planner";
import Favourites from "./components/Favourites/Favourites";
import Header from "./components/Header";
import ErrorBanner from "./components/ui/ErrorBanner";
import Loader from "./components/ui/Loader";

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
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/favourites" element={<Favourites />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
