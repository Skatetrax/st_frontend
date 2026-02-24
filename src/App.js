import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { checkSession } from "./api/api";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard";
import SkaterOverviewPage from "./pages/SkaterOverviewPage";
import EquipmentPage from "./pages/EquipmentPage";
import MaintenancePage from "./pages/MaintenancePage";
import IceTimePage from "./pages/IceTimePage";


function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    checkSession().then(setSession).catch(() => setSession({ logged_in: false }));
  }, []);

  if (session === null) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setSession} />} />
        <Route path="/dashboard" element={session.logged_in ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/skater_overview" element={session.logged_in ? <SkaterOverviewPage /> : <Navigate to="/login" />} />
        <Route path="/equipment/configs" element={session.logged_in ? <EquipmentPage /> : <Navigate to="/login" />} />
        <Route path="/equipment/maintenance" element={session.logged_in ? <MaintenancePage /> : <Navigate to="/login" />} />
        <Route path="/ice_time" element={session.logged_in ? <IceTimePage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={session.logged_in ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
