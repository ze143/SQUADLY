import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      dir="rtl"
    >
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
          <SearchX size={48} />
        </div>
        <h1 className="text-6xl font-bold text-slate-800 mb-3">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-2">
          الصفحة غير موجودة
        </h2>
        <p className="text-slate-500 mb-6">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
        </p>
        <Link to="/dashboard">
          <Button>
            <Home size={16} /> العودة للرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}