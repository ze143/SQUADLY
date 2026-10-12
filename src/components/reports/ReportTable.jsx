import { Download, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { exportToCSV } from '../../utils/reportUtils';

export default function ReportTable({
  title,
  subtitle,
  columns = [],
  data = [],
  loading = false,
  exportFilename = 'report',
  emptyMessage = 'لا توجد بيانات',
  actions,
}) {
  const handleExport = () => {
    exportToCSV(data, columns, exportFilename);
  };

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {actions}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={14} /> CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={FileText} title={emptyMessage} />
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`p-3 font-medium whitespace-nowrap ${col.className || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`p-3 text-sm text-slate-700 ${
                        col.className || ''
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? col.accessor(row)
                        : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}