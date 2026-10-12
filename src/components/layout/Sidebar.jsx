import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUpCircle,
  UserCog,
  LogOut,
  Trophy,
  X,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isAdmin as checkIsAdmin } from "../../utils/permissions";
import { ROLE_LABELS } from "../../utils/constants";
import SectorSwitcher from "./SectorSwitcher";

const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/players", label: "اللاعبون", icon: Users },
  { to: "/teams", label: "الفرق", icon: Shield },
  { to: "/matches", label: "المباريات", icon: Calendar },
  { to: "/finance", label: "المالية", icon: DollarSign },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
  { to: "/escalations", label: "طلبات التصعيد", icon: ArrowUpCircle },
];

const adminItems = [
  { to: "/users", label: "إدارة المستخدمين", icon: UserCog },
  { to: "/settings/sectors", label: "القطاعات", icon: Layers },
  { to: "/admin/reports", label: "التقارير المتقدمة", icon: BarChart3 },
];

export default function Sidebar({ onClose, isMobile = false }) {
  const { profile, logout } = useAuth();
  const admin = checkIsAdmin(profile);

  const items = admin ? [...navItems, ...adminItems] : navItems;

  const handleLogout = async () => {
    if (confirm("هل تريد تسجيل الخروج؟")) {
      await logout();
    }
  };

  return (
    <aside
      className={`
        w-64 bg-slate-900 text-white min-h-screen flex flex-col
        ${isMobile ? "fixed inset-y-0 right-0 z-40 shadow-2xl" : ""}
      `}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Trophy size={22} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">SQUADLY</h1>
            <p className="text-xs text-slate-400">
              نظام إدارة قطاعات كرة القدم
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sector Switcher */}
      <SectorSwitcher />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                isActive
                  ? "bg-emerald-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-slate-800 dark:border-slate-800 p-3">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
            {profile?.full_name?.charAt(0) || "؟"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || "مستخدم"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {ROLE_LABELS[profile?.role] || "بدون دور"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
