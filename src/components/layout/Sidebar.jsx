import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  CalendarDays,
  DollarSign,
  BarChart3,
  ArrowUpCircle,
  UserCog,
  LogOut,
  Trophy,
  X,
  Layers,
  Bell,
  Search as SearchIcon,
  ArrowLeftRight,
  Dumbbell,
  MessageSquare,
  HeartPulse,
  Home,
  Activity,
  Wallet,
  Settings,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isAdmin as checkIsAdmin } from "../../utils/permissions";
import { ROLE_LABELS } from "../../utils/constants";
import SectorSwitcher from "./SectorSwitcher";

// ===== الأقسام =====
const SECTIONS = [
  {
    id: "main",
    label: "الرئيسية",
    icon: Home,
    items: [
      { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
      { to: "/calendar", label: "التقويم", icon: CalendarDays },
    ],
    adminOnly: false,
  },
  {
    id: "activities",
    label: "الأنشطة",
    icon: Activity,
    items: [
      { to: "/training", label: "التدريبات", icon: Dumbbell },
      { to: "/meetings", label: "الاجتماعات", icon: MessageSquare },
      { to: "/matches", label: "المباريات", icon: Calendar },
      { to: "/injuries", label: "الإصابات", icon: HeartPulse },
    ],
    adminOnly: false,
  },
  {
    id: "management",
    label: "الإدارة",
    icon: Users,
    items: [
      { to: "/players", label: "اللاعبون", icon: Users },
      { to: "/teams", label: "الفرق", icon: Shield },
      { to: "/escalations", label: "طلبات التصعيد", icon: ArrowUpCircle },
    ],
    adminOnly: false,
  },
  {
    id: "finance",
    label: "المالية والتقارير",
    icon: Wallet,
    items: [
      { to: "/finance", label: "المالية", icon: DollarSign },
      { to: "/reports", label: "التقارير", icon: BarChart3 },
    ],
    adminOnly: false,
  },
  {
    id: "treasury",
    label: "الخزينة والعقود",
    icon: Wallet,
    items: [
      { to: "/treasury", label: "الخزينة", icon: Wallet },
      { to: "/treasury/reports", label: "تقارير الخزينة", icon: BarChart3 },
      { to: "/contracts", label: "العقود", icon: FileText },
      { to: "/contracts/reports", label: "تقارير العقود", icon: BarChart3 },
    ],
    adminOnly: true, // 
  },
  {
    id: "admin",
    label: "إدارة النظام",
    icon: Settings,
    items: [
      { to: "/search", label: "البحث المتقدم", icon: SearchIcon },
      { to: "/compare", label: "مقارنة لاعبين", icon: ArrowLeftRight },
      { to: "/users", label: "إدارة المستخدمين", icon: UserCog },
      { to: "/settings/sectors", label: "القطاعات", icon: Layers },
      { to: "/admin/reports", label: "التقارير المتقدمة", icon: BarChart3 },
    ],
    adminOnly: true,
  },
];

export default function Sidebar({ onClose, isMobile = false }) {
  const { profile, logout } = useAuth();
  const admin = checkIsAdmin(profile);

  const handleLogout = async () => {
    if (confirm("هل تريد تسجيل الخروج؟")) {
      await logout();
    }
  };

  // الفلترة حسب الصلاحيات
  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || admin);

  return (
    <aside
      className={`
        w-64 bg-slate-900 text-white h-screen flex flex-col
        ${isMobile ? "fixed inset-y-0 right-0 z-40 shadow-2xl" : ""}
      `}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
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
      <div className="shrink-0">
        <SectorSwitcher />
      </div>

      {/* Navigation (scrollable) */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2 space-y-4">
        {visibleSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.id}>
              {/* Section Header */}
              <div className="flex items-center gap-2 px-2 mb-1.5">
                <SectionIcon size={12} className="text-slate-500" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  {section.label}
                </span>
              </div>

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                        isActive
                          ? "bg-emerald-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      ].join(" ")
                    }
                  >
                    <Icon size={16} />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-slate-800 p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
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
