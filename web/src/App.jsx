import "./App.css";
import { Routes, Route } from "react-router";
import useOnlineStatus from "./state/useOnlineStatus";
import { useAuth } from "./state/AuthContext";
import SearchPage from "./components/SearchPage/SearchPage";
import Planner from "./components/Planner/Planner";
import Favourites from "./components/Favourites/Favourites";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ErrorBanner from "./components/ui/ErrorBanner";
import Loader from "./components/ui/Loader";

function App() {
  const online = useOnlineStatus();
  const { loading } = useAuth();

  return (
    <>
      {!online && <ErrorBanner />}
      {loading && <Loader />}
      <Header />
      <div className="h-screen">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/favourites" element={<Favourites />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
