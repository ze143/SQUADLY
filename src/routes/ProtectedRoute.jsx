import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/permissions';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-6">
          <p className="text-red-600 font-bold mb-2">لا يوجد صلاحيات لهذا الحساب</p>
          <p className="text-slate-500 text-sm">
            الحساب موجود لكن غير مرتبط بأي دور في النظام. تواصل مع مدير النظام.
          </p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin(profile)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}