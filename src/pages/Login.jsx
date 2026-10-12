import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Trophy, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateEmail } from "../utils/validation";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(form.email)) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }
    if (form.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    const { error: loginError } = await login(form.email, form.password);
    setLoading(false);

    if (loginError) {
      setError("بيانات الدخول غير صحيحة، حاول مرة أخرى");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-4">
            <Trophy size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SQUADLY</h1>
          <p className="text-sm text-slate-500 mt-1">نظام إدارة قطاعات كرة القدم </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="البريد الإلكتروني"
            placeholder="admin@example.com"
            icon={Mail}
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Input
            type="password"
            label="كلمة المرور"
            placeholder="••••••••"
            icon={Lock}
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <Button type="submit" fullWidth loading={loading} size="lg">
            تسجيل الدخول
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
            Ziad Abdelkader <br/>
            01550769928 <br/>
          جميع الحقوق محفوظة © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
