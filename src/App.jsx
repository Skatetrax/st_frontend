import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import { checkSession } from "./api/api";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard";
import SkaterOverviewPage from "./pages/SkaterOverviewPage";
import EquipmentPage from "./pages/EquipmentPage";
import MaintenancePage from "./pages/MaintenancePage";
import IceTimePage from "./pages/IceTimePage";
import AddSessionPage from "./pages/AddSessionPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import ExhibitionsPage from "./pages/ExhibitionsPage";
import MusicLibraryPage from "./pages/MusicLibraryPage";
import SharedPlaylistPage from "./pages/SharedPlaylistPage";
import SkaterCardPage from "./pages/SkaterCardPage";
import SharedCardPage from "./pages/SharedCardPage";

function RequireAuth({ session, children }) {
  const location = useLocation();
  if (!session.logged_in) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    checkSession().then(setSession).catch(() => setSession({ logged_in: false }));
  }, []);

  if (session === null) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/shared/playlist/:shareToken" element={<SharedPlaylistPage />} />
        <Route path="/shared/card/:shareToken" element={<SharedCardPage />} />
        <Route path="/login" element={<LoginPage onLogin={setSession} />} />
        <Route path="/dashboard" element={<RequireAuth session={session}><DashboardPage /></RequireAuth>} />
        <Route path="/skater_overview" element={<RequireAuth session={session}><SkaterOverviewPage /></RequireAuth>} />
        <Route path="/equipment/configs" element={<RequireAuth session={session}><EquipmentPage /></RequireAuth>} />
        <Route path="/equipment/maintenance" element={<RequireAuth session={session}><MaintenancePage /></RequireAuth>} />
        <Route path="/ice_time" element={<RequireAuth session={session}><IceTimePage /></RequireAuth>} />
        <Route path="/performances/competitions" element={<RequireAuth session={session}><CompetitionsPage /></RequireAuth>} />
        <Route path="/performances/exhibitions" element={<RequireAuth session={session}><ExhibitionsPage /></RequireAuth>} />
        <Route path="/performances/music" element={<RequireAuth session={session}><MusicLibraryPage /></RequireAuth>} />
        <Route path="/skater_card" element={<RequireAuth session={session}><SkaterCardPage /></RequireAuth>} />
        <Route path="/add-session" element={<RequireAuth session={session}><AddSessionPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to={session.logged_in ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
