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
import Notifications from "../pages/Notifications";
import Search from "../pages/Search";
import Calendar from "../pages/Calendar";
import ComparePlayers from "../pages/ComparePlayers";
import Training from "../pages/Training";
import Meetings from "../pages/Meetings";
import Injuries from "../pages/Injuries";
import Treasury from "../pages/Treasury";
import TreasuryReports from "../pages/TreasuryReports";
import Contracts from "../pages/Contracts";
import ContractDetails from "../pages/ContractDetails";
import ContractsReports from "../pages/ContractsReports";

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
        <Route path="notifications" element={<Notifications />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="training" element={<Training />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="injuries" element={<Injuries />} />
        <Route
          path="/treasury"
          element={
            <ProtectedRoute requireAdmin>
              <Treasury />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasury/reports"
          element={
            <ProtectedRoute requireAdmin>
              <TreasuryReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="compare"
          element={
            <ProtectedRoute requireAdmin>
              <ComparePlayers />
            </ProtectedRoute>
          }
        />
        <Route
          path="search"
          element={
            <ProtectedRoute requireAdmin>
              <Search />
            </ProtectedRoute>
          }
        />
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
        <Route path="contracts" element={<Contracts />} />
        <Route path="contracts/:id" element={<ContractDetails />} />
        <Route path="contracts/reports" element={<ContractsReports />} />
      </Route>

      {/* صفحة 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
