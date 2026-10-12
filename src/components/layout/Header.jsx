import { Menu, Search, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ROLE_LABELS } from "../../utils/constants";
import { getInitials } from "../../utils/formatters";
import NotificationBell from "./NotificationBell";
import { Link } from 'react-router-dom';

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

        {/* Search Box */}
        <Link
          to="/search"
          className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-lg px-3 py-2 w-full max-w-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <Search
            size={18}
            className="text-slate-400 dark:text-slate-500 shrink-0"
          />
          <span className="text-sm text-slate-400 flex-1 text-right">
            بحث سريع...
          </span>
          <kbd className="hidden lg:inline-flex text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
            /
          </kbd>
        </Link>
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
        <NotificationBell />

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
