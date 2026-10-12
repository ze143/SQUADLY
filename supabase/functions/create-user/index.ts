// @ts-nocheck
// Supabase Edge Function: create-user
// الغرض: إنشاء مستخدم جديد في auth.users + سجل في جدول users
// مع ربط الفرق المسؤولة (user_teams)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  // ===== CORS preflight =====
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== 1) قراءة المتغيرات =====
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // ✅ الاسم الصح
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json(
        { error: 'متغيرات البيئة غير مكتملة على السيرفر' },
        500
      );
    }

    // ===== 2) التحقق من التوكن =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'غير مصرح: لا يوجد توكن' }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();

    if (callerErr || !caller) {
      return json({ error: 'غير مصرح: توكن غير صالح' }, 401);
    }

    // ===== 3) التحقق من دور الطالب =====
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile, error: callerProfileErr } = await adminClient
      .from('users')
      .select('role')
      .eq('auth_id', caller.id)
      .maybeSingle();

    if (callerProfileErr) {
      return json(
        { error: 'فشل التحقق من الصلاحيات: ' + callerProfileErr.message },
        500
      );
    }

    if (!callerProfile) {
      return json(
        { error: 'حسابك غير مسجّل في النظام. تواصل مع المدير.' },
        403
      );
    }

    if (callerProfile.role !== 'admin') {
      return json({ error: 'ليس لديك صلاحية إنشاء مستخدمين' }, 403);
    }

    // ===== 4) قراءة البيانات من الـ body =====
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'الطلب غير صالح (JSON غير صحيح)' }, 400);
    }

    const { email, password, full_name, phone, role, team_ids } = body;

    if (!email || !password || !full_name || !role) {
      return json(
        { error: 'بيانات ناقصة: email, password, full_name, role مطلوبة' },
        400
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, 400);
    }

    if (!['admin', 'team_admin'].includes(role)) {
      return json({ error: 'دور غير صالح' }, 400);
    }

    // ===== 5) إنشاء المستخدم في auth.users =====
    const { data: authData, error: authErr } =
      await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (authErr || !authData?.user) {
      return json(
        { error: authErr?.message || 'فشل إنشاء الحساب في Auth' },
        400
      );
    }

    const authUserId = authData.user.id;

    // ===== 6) إنشاء السجل في جدول users =====
    const { data: profile, error: profileErr } = await adminClient
      .from('users')
      .insert({
        auth_id: authUserId,
        full_name: full_name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (profileErr || !profile) {
      // rollback: احذف المستخدم من auth
      await adminClient.auth.admin.deleteUser(authUserId);
      return json(
        { error: profileErr?.message || 'فشل إنشاء السجل في جدول users' },
        400
      );
    }

    // ===== 7) ربط الفرق (فقط لإداري الفريق) =====
    if (
      role === 'team_admin' &&
      Array.isArray(team_ids) &&
      team_ids.length > 0
    ) {
      const records = team_ids
        .filter((tid) => typeof tid === 'string' && tid.length > 0)
        .map((tid) => ({
          user_id: profile.id,
          team_id: tid,
        }));

      if (records.length > 0) {
        const { error: linkErr } = await adminClient
          .from('user_teams')
          .insert(records);

        if (linkErr) {
          // rollback كامل
          await adminClient.from('users').delete().eq('id', profile.id);
          await adminClient.auth.admin.deleteUser(authUserId);
          return json(
            { error: 'فشل ربط الفرق: ' + linkErr.message },
            400
          );
        }
      }
    }

    // ===== 8) نجاح =====
    return json({ success: true, user: profile }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
    console.error('create-user error:', err);
    return json({ error: message }, 500);
  }
});