import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Trash2, X,
  ArrowUpCircle, Ban, AlertTriangle, Calendar, DollarSign, Info,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDateTime } from '../../utils/formatters';

const ICONS = {
  escalation_new: ArrowUpCircle,
  escalation_approved: Check,
  escalation_rejected: X,
  yellow_warning: AlertTriangle,
  suspension_created: Ban,
  fine_unpaid: DollarSign,
  installment_overdue: DollarSign,
  match_upcoming: Calendar,
  general: Info,
};

const COLORS = {
  escalation_new: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300',
  escalation_approved: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300',
  escalation_rejected: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300',
  yellow_warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300',
  suspension_created: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300',
  fine_unpaid: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300',
  installment_overdue: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300',
  match_upcoming: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300',
  general: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  // إغلاق عند الضغط خارج القائمة
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleNotificationClick = (n) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  const recent = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 relative transition"
        aria-label="الإشعارات"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 left-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                الإشعارات
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                  title="تعليم الكل كمقروء"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('حذف كل الإشعارات؟')) clearAll();
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  title="حذف الكل"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center">
                <Bell
                  size={32}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  لا توجد إشعارات
                </p>
              </div>
            ) : (
              recent.map((n) => {
                const Icon = ICONS[n.type] || Info;
                const colorClass = COLORS[n.type] || COLORS.general;

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-right flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      !n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${colorClass}`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          !n.is_read
                            ? 'font-bold text-slate-800 dark:text-slate-100'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDateTime(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 border-t border-slate-200 dark:border-slate-800 font-medium transition"
            >
              عرض كل الإشعارات
            </Link>
          )}
        </div>
      )}
    </div>
  );
}