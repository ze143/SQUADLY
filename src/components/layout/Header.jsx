import { Menu, Bell, Search, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ROLE_LABELS } from "../../utils/constants";
import { getInitials } from "../../utils/formatters";

export default function Header({ onMenuClick }) {
  const { profile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-4 transition-colors"
      dir="rtl"
    >
      {/* Left (Right in RTL): Menu + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
          aria-label="القائمة"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-full max-w-md transition-colors">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="بحث سريع..."
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Right (Left in RTL): Actions + Profile */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
          aria-label="تبديل الوضع"
          title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 relative transition"
          aria-label="الإشعارات"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-slate-200 dark:border-slate-800">
          <div className="text-left">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">
              {profile?.full_name || "مستخدم"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ROLE_LABELS[profile?.role] || "-"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
            {getInitials(profile?.full_name)}
          </div>
        </div>
      </div>
    </header>
  );
}