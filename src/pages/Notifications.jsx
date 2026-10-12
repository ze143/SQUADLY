import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Trash2, X,
  ArrowUpCircle, Ban, AlertTriangle, Calendar, DollarSign, Info,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { formatDateTime } from '../utils/formatters';

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

export default function Notifications() {
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

  const handleClick = (n) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="text-emerald-600" /> الإشعارات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار غير مقروء`
              : 'كل الإشعارات مقروءة'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAsRead}>
              <CheckCheck size={16} /> تعليم الكل كمقروء
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('حذف كل الإشعارات؟')) clearAll();
              }}
            >
              <Trash2 size={16} /> حذف الكل
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="لا توجد إشعارات"
            description="ستظهر هنا كل الإشعارات الخاصة بك."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] || Info;
              const colorClass = COLORS[n.type] || COLORS.general;

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition cursor-pointer hover:shadow-sm ${
                    !n.is_read
                      ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${colorClass}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${
                          !n.is_read
                            ? 'font-bold text-slate-800 dark:text-slate-100'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></span>
                      )}
                    </div>
                    {n.message && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {n.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition shrink-0"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}