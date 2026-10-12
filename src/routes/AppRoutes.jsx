import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../components/layout/Layout";

// الصفحات
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Players from "../pages/Players";
import PlayerProfile from "../pages/PlayerProfile";
import Teams from "../pages/Teams";
import Matches from "../pages/Matches";
import MatchDetails from "../pages/MatchDetails";
import Finance from "../pages/Finance";
import Reports from "../pages/Reports";
import Escalations from "../pages/Escalations";
import Users from "../pages/Users";
import NotFound from "../pages/NotFound";
import AdminReports from "../pages/AdminReports";
import Sectors from "../pages/Sectors";

export default function AppRoutes() {
  return (
    <Routes>
      {/* صفحة تسجيل الدخول */}
      <Route path="/login" element={<Login />} />

      {/* كل الصفحات المحمية داخل Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:id" element={<PlayerProfile />} />
        <Route path="teams" element={<Teams />} />
        <Route path="matches" element={<Matches />} />
        <Route path="matches/:id" element={<MatchDetails />} />
        <Route path="finance" element={<Finance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="escalations" element={<Escalations />} />
        <Route
          path="settings/sectors"
          element={
            <ProtectedRoute requireAdmin>
              <Sectors />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="users"
          element={
            <ProtectedRoute requireAdmin>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute requireAdmin>
              <AdminReports />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* صفحة 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
