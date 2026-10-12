export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'لا توجد بيانات',
  onRowClick,
  keyField = 'id',
}) {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        جارٍ التحميل...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-right">
        <thead className="bg-slate-50 text-slate-600 text-sm">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`p-3 font-medium ${col.headerClassName || ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[keyField]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-slate-100 ${
                onRowClick ? 'hover:bg-slate-50 cursor-pointer' : ''
              } transition`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`p-3 text-sm text-slate-700 ${col.className || ''}`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}