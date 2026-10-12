# ⚽ نظام إدارة قطاع الناشئين والفريق الأول

نظام إداري ومالي شامل لإدارة قطاع الناشئين والفريق الأول لكرة القدم.

## 🚀 الميزات

- **إدارة اللاعبين**: استمارة تسجيل كاملة مع التحقق من الرقم القومي.
- **التصنيف المالي**: فري / استثماري، مع إدارة الأقساط والمدفوعات.
- **إدارة المباريات**: التشكيل (11+9)، الأحداث، الحكام، التقرير الفني والإداري.
- **طلبات التصعيد**: نقل اللاعبين بين الفرق مع موافقة/رفض الإداري الآخر.
- **التقارير**: تقارير الأداء، الهدافين، والتقارير المالية.
- **الأدوار والصلاحيات**: مدير نظام (Admin) + إداري فريق (Team Admin).
- **واجهة عربية RTL** كاملة ومتجاوبة.

## 🛠️ التقنيات

- React 18 + Vite
- Tailwind CSS
- Supabase (Database + Auth + Edge Functions)
- React Router v6
- React Hook Form
- Lucide Icons

## 📦 التثبيت

### 1) استنساخ المشروع
```bash
git clone <repo-url>
cd football-management
npm install
```

### 2) إعداد Supabase
1. أنشئ مشروعاً على [supabase.com](https://supabase.com)
2. افتح **SQL Editor** ونفّذ محتوى `supabase/schema.sql`
3. من **Authentication → Users** أنشئ أول مستخدم (admin)
4. من **SQL Editor** نفّذ:
```sql
INSERT INTO users (auth_id, full_name, email, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'المدير',
  'admin@example.com',
  'admin'
);
```

### 3) متغيرات البيئة
```bash
cp .env.example .env
```

### 4) نشر Edge Function (اختياري)
```bash
supabase login
supabase link --project-ref <your-ref>
supabase secrets set SERVICE_ROLE_KEY=<your-service-role-key>
supabase functions deploy create-user
```

### 5) تشغيل المشروع
```bash
npm run dev
```

المشروع سيعمل على: [http://localhost:5173](http://localhost:5173)

## 🔐 الأدوار

| الدور | الصلاحيات |
|------|-----------|
| **Admin** | كل الصلاحيات على النظام |
| **Team Admin** | إدارة فرقه فقط |

## 📝 الترخيص
هذا المشروع خاص ومملوك لصاحبه.