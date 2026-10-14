import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, X, DollarSign } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useSector } from "../../context/SectorContext";
import {
  POSITIONS,
  PLAYER_TYPES,
  PAYMENT_TYPES,
  PAYMENT_STATUS,
} from "../../utils/constants";
import {
  validateNationalId,
  extractBirthDateFromNID,
  extractBirthYearFromNID,
} from "../../utils/validation";
import { isAdmin, getAllowedTeamIds } from "../../utils/permissions";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Card from "../ui/Card";
import InstallmentsGenerator from "../finance/InstallmentsGenerator";

export default function PlayerForm({ player = null, onSuccess, onCancel }) {
  const { profile } = useAuth();
  const isEdit = Boolean(player);

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nidError, setNidError] = useState("");
  const [installments, setInstallments] = useState([]);
  const { selectedSectorId } = useSector();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: player
      ? { ...player, total_amount: player.total_amount || 0 }
      : {
          full_name: "",
          national_id: "",
          birth_date: "",
          birth_year: "",
          position: "",
          team_id: "",
          previous_clubs: "",
          technical_level: "",
          player_type: "free",
          payment_type: "full",
          total_amount: 0,
          paid_amount: 0, // ✅ جديد
          payment_status: "pending",
        },
  });

  const watchedNid = watch("national_id");
  const playerType = watch("player_type");
  const paymentType = watch("payment_type");
  const totalAmount = watch("total_amount");
  const paidAmount = watch("paid_amount");

  // ====== تحميل الفرق ======
  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      let query = supabase
        .from("teams")
        .select("id, name, category, parent_team_id, group_label")
        .order("name");

      if (selectedSectorId) {
        query = query.eq("sector_id", selectedSectorId);
      }

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setTeams([]);
          setLoadingTeams(false);
          return;
        }
        query = query.in("id", allowed);
      }

      const { data } = await query;
      setTeams(data || []);
      setLoadingTeams(false);
    };
    if (profile) loadTeams();
  }, [profile, selectedSectorId]);

  // ====== استخراج تاريخ الميلاد ======
  useEffect(() => {
    if (!watchedNid || watchedNid.length !== 14) {
      setNidError("");
      return;
    }
    if (!validateNationalId(watchedNid)) {
      setNidError("الرقم القومي غير صحيح (14 رقماً)");
      return;
    }
    setNidError("");
    const birthDate = extractBirthDateFromNID(watchedNid);
    const birthYear = extractBirthYearFromNID(watchedNid);
    if (birthDate) setValue("birth_date", birthDate);
    if (birthYear) setValue("birth_year", birthYear);
  }, [watchedNid, setValue]);

  // ✅ تحميل الأقساط الموجودة (عند التعديل)
  useEffect(() => {
    const loadInstallments = async () => {
      if (!player?.id) {
        setInstallments([]);
        return;
      }
      const { data } = await supabase
        .from("installments")
        .select("*")
        .eq("player_id", player.id)
        .order("due_date", { ascending: true });

      setInstallments(
        (data || []).map((i) => ({
          amount: i.amount,
          due_date: i.due_date,
          status: i.status,
          notes: i.notes,
        })),
      );
    };

    loadInstallments();
  }, [player?.id]);

  useEffect(() => {
    if (player) reset({ ...player, total_amount: player.total_amount || 0 });
  }, [player, reset]);

  const onSubmit = async (data) => {
    console.log("🔥 onSubmit called");
    console.log("📤 Data:", data);
    console.log("🆔 National ID:", data.national_id);
    console.log("✅ NID Valid?", validateNationalId(data.national_id));

    if (!validateNationalId(data.national_id)) {
      console.error("❌ NID validation failed!");
      setNidError("الرقم القومي غير صحيح (14 رقماً)");
      alert("❌ الرقم القومي غير صحيح");
      return;
    }

    // ✅ تحقق: لو "أقساط"، لازم فيه أقساط
    // ✅ تحقق: لو استثماري
    if (data.player_type === "investment") {
      const total = Number(data.total_amount) || 0;
      const paid = Number(data.paid_amount) || 0;

      // تحقق: لازم يكون فيه مبلغ إجمالي
      if (total <= 0) {
        alert("يرجى إدخال المبلغ الإجمالي");
        return;
      }

      // تحقق: دفعة جزئية
      if (data.payment_type === "partial") {
        if (paid <= 0) {
          alert("يرجى إدخال المبلغ المدفوع مقدمًا");
          return;
        }
        if (paid >= total) {
          alert("المبلغ المدفوع يجب أن يكون أقل من الإجمالي");
          return;
        }
        if (installments.length === 0) {
          alert("يرجى إضافة أقساط الباقي");
          return;
        }
      }

      // تحقق: أقساط
      if (data.payment_type === "installments") {
        if (installments.length === 0) {
          alert("يرجى إضافة الأقساط على الأقل قسط واحد");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        full_name: data.full_name.trim(),
        national_id: data.national_id.trim(),
        birth_date: data.birth_date,
        birth_year: Number(data.birth_year),
        position: data.position,
        team_id: data.team_id || null,
        previous_clubs: data.previous_clubs || null,
        technical_level: data.technical_level || null,
        player_type: data.player_type,
        payment_type:
          data.player_type === "investment" ? data.payment_type : null,
        total_amount:
          data.player_type === "investment"
            ? Number(data.total_amount) || 0
            : 0,
        payment_status:
          data.player_type === "investment" ? data.payment_status : "pending",
      };

      console.log("📦 Payload:", payload);

      // 1. احفظ اللاعب
      let playerId;
      if (isEdit) {
        console.log("✏️ Updating player...");
        const { error } = await supabase
          .from("players")
          .update(payload)
          .eq("id", player.id);
        if (error) throw error;
        playerId = player.id;
        console.log("✅ Player updated:", playerId);
      } else {
        console.log("➕ Inserting new player...");
        const { data: newPlayer, error } = await supabase
          .from("players")
          .insert(payload)
          .select()
          .single();

        console.log("📥 Insert response:", { newPlayer, error });

        if (error) throw error;
        playerId = newPlayer.id;
        console.log("✅ Player inserted:", playerId);
      }

      // 2. احفظ الأقساط حسب نوع الدفع
      if (data.player_type === "investment") {
        // ✅ احذف القديم (عند التعديل)
        if (isEdit) {
          console.log("🗑️ Deleting old installments...");
          await supabase
            .from("installments")
            .delete()
            .eq("player_id", playerId);
        }

        const today = new Date().toISOString().split("T")[0];
        const allRecords = [];

        // ✅ الحالة 1: دفعة كاملة → قسط واحد مسدد
        if (data.payment_type === "full") {
          console.log("✅ Full payment - creating 1 paid installment");
          allRecords.push({
            player_id: playerId,
            amount: Number(data.total_amount) || 0,
            due_date: today,
            paid_date: today,
            status: "paid",
            notes: "دفعة كاملة",
          });
        }

        // ✅ الحالة 2: دفعة جزئية → قسط مسدد + أقساط للباقي
        if (data.payment_type === "partial") {
          const paid = Number(data.paid_amount) || 0;
          const total = Number(data.total_amount) || 0;
          const remaining = total - paid;

          console.log("💰 Partial payment:", { paid, total, remaining });

          // 2.1 قسط مسدد بالمبلغ المدفوع
          if (paid > 0) {
            allRecords.push({
              player_id: playerId,
              amount: paid,
              due_date: today,
              paid_date: today,
              status: "paid",
              notes: "دفعة مقدمة",
            });
          }

          // 2.2 أقساط للباقي
          if (installments.length > 0 && remaining > 0) {
            const remainingRecords = installments.map((inst) => ({
              player_id: playerId,
              amount: Number(inst.amount),
              due_date: inst.due_date,
              status: inst.status || "unpaid",
              notes: inst.notes || null,
            }));
            allRecords.push(...remainingRecords);
          }
        }

        // ✅ الحالة 3: أقساط → كل الأقساط (بدون قسط مسدد)
        if (data.payment_type === "installments") {
          console.log("📋 Installments only");
          if (installments.length > 0) {
            const records = installments.map((inst) => ({
              player_id: playerId,
              amount: Number(inst.amount),
              due_date: inst.due_date,
              status: inst.status || "unpaid",
              notes: inst.notes || null,
            }));
            allRecords.push(...records);
          }
        }

        // ✅ احفظ كل الأقساط مرة واحدة
        if (allRecords.length > 0) {
          console.log("📦 All installments to insert:", allRecords);
          const { error: instErr } = await supabase
            .from("installments")
            .insert(allRecords);
          if (instErr) throw instErr;
          console.log(`✅ ${allRecords.length} installments inserted`);
        }
      }

      console.log("🎉 All done! Calling onSuccess...");
      alert("✅ تم حفظ اللاعب بنجاح");
      onSuccess?.();
    } catch (err) {
      console.error("❌ Catch error:", err);
      alert("حدث خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderTeamOption = (t) => {
    const label = t.group_label
      ? `${t.name} (مجموعة ${t.group_label})`
      : t.name;
    return (
      <option key={t.id} value={t.id}>
        {label} — {t.category}
      </option>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" dir="rtl">
      {/* ====== البيانات الشخصية ====== */}
      <Card padding="p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          البيانات الشخصية
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="الاسم الرباعي"
            required
            placeholder="مثال: أحمد محمد علي حسن"
            error={errors.full_name?.message}
            {...register("full_name", { required: "الاسم مطلوب" })}
          />

          <Input
            label="الرقم القومي"
            required
            maxLength={14}
            placeholder="14 رقماً"
            error={nidError || errors.national_id?.message}
            {...register("national_id", {
              required: "الرقم القومي مطلوب",
              minLength: { value: 14, message: "يجب أن يكون 14 رقماً" },
              maxLength: { value: 14, message: "يجب أن يكون 14 رقماً" },
            })}
          />

          <Input
            type="date"
            label="تاريخ الميلاد"
            error={errors.birth_date?.message}
            {...register("birth_date", { required: "تاريخ الميلاد مطلوب" })}
          />

          <Input
            type="number"
            label="سنة المواليد (للمسابقات)"
            required
            placeholder="2007"
            error={errors.birth_year?.message}
            {...register("birth_year", { required: "سنة المواليد مطلوبة" })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              المركز <span className="text-red-500">*</span>
            </label>
            <select
              {...register("position", { required: "المركز مطلوب" })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- اختر المركز --</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">
                {errors.position.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              الفريق / المجموعة <span className="text-red-500">*</span>
            </label>
            <select
              {...register("team_id", { required: "الفريق مطلوب" })}
              disabled={loadingTeams}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 ${
                errors.team_id ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">
                {loadingTeams ? "جارٍ التحميل..." : "-- اختر الفريق --"}
              </option>
              {teams.map(renderTeamOption)}
            </select>
            {errors.team_id && (
              <p className="text-red-500 text-xs mt-1">
                {errors.team_id.message}
              </p>
            )}
          </div>

          <Input
            containerClassName="md:col-span-2"
            label="الأندية السابقة"
            placeholder="مثال: الأهلي، الزمالك..."
            {...register("previous_clubs")}
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              المستوى الفني
            </label>
            <textarea
              rows={3}
              placeholder="وصف المستوى الفني للاعب..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              {...register("technical_level")}
            />
          </div>
        </div>
      </Card>

      {/* ====== التصنيف المالي ====== */}
      <Card padding="p-5">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-emerald-600" />
          التصنيف المالي
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              نوع اللاعب <span className="text-red-500">*</span>
            </label>
            <select
              {...register("player_type")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PLAYER_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {playerType === "investment" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  طريقة الدفع <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("payment_type")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PAYMENT_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="number"
                label="المبلغ الإجمالي (ج.م)"
                min={0}
                step={100}
                {...register("total_amount")}
              />

              {/* ✅ المبلغ المدفوع — بس لو "جزئية" */}
              {paymentType === "partial" && (
                <Input
                  type="number"
                  label="المبلغ المدفوع مقدمًا (ج.م)"
                  min={0}
                  step={100}
                  {...register("paid_amount")}
                />
              )}
            </>
          )}
        </div>

        {playerType === "free" && (
          <p className="text-sm text-slate-500 mt-3 bg-slate-50 p-3 rounded-lg">
            اللاعب الفري لا يحتاج إلى أي بيانات مالية.
          </p>
        )}

        {/* ✅ مولد الأقساط */}
        {playerType === "investment" &&
          (paymentType === "installments" || paymentType === "partial") && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              {/* ✅ لو جزئية: الباقي = الإجمالي - المدفوع */}
              <InstallmentsGenerator
                totalAmount={
                  paymentType === "partial"
                    ? (Number(totalAmount) || 0) - (Number(paidAmount) || 0)
                    : Number(totalAmount) || 0
                }
                installments={installments}
                onChange={setInstallments}
                label={
                  paymentType === "partial"
                    ? `أقساط الباقي (${((Number(totalAmount) || 0) - (Number(paidAmount) || 0)).toLocaleString()} ج.م)`
                    : "أقساط المبلغ الكامل"
                }
              />
            </div>
          )}
      </Card>

      {/* ====== الأزرار ====== */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
          >
            <X size={16} /> إلغاء
          </Button>
        )}
        <Button type="submit" loading={saving}>
          <Save size={16} /> {isEdit ? "تحديث البيانات" : "حفظ اللاعب"}
        </Button>
      </div>
    </form>
  );
}
