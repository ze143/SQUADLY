import { useEffect, useState } from "react";
import { Save, Users } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { getPositionLabel } from "../../utils/constants";

export default function MatchLineup({
  players = [],
  initialLineup = [],
  onSave,
  disabled = false,
}) {
  const [starters, setStarters] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialLineup.length) return;
    setStarters(
      initialLineup
        .filter((l) => l.lineup_type === "starter")
        .map((l) => l.player_id)
    );
    setSubstitutes(
      initialLineup
        .filter((l) => l.lineup_type === "substitute")
        .map((l) => l.player_id)
    );
  }, [initialLineup]);

  const toggleStarter = (playerId) => {
    if (disabled) return;
    const player = players.find((p) => p.id === playerId);
    if (player?._suspended) {
      return alert("هذا اللاعب موقوف. لا يمكن إضافته للتشكيل.");
    }
    if (player?._inactive) {
      return alert("هذا اللاعب غير نشط. لا يمكن إضافته للتشكيل.");
    }

    if (starters.includes(playerId)) {
      setStarters(starters.filter((id) => id !== playerId));
    } else {
      if (starters.length >= 11) return;
      if (substitutes.includes(playerId)) {
        setSubstitutes(substitutes.filter((id) => id !== playerId));
      }
      setStarters([...starters, playerId]);
    }
  };

  const toggleSubstitute = (playerId) => {
    if (disabled) return;
    const player = players.find((p) => p.id === playerId);
    if (player?._suspended) {
      return alert("هذا اللاعب موقوف. لا يمكن إضافته للتشكيل.");
    }
    if (player?._inactive) {
      return alert("هذا اللاعب غير نشط. لا يمكن إضافته للتشكيل.");
    }

    if (substitutes.includes(playerId)) {
      setSubstitutes(substitutes.filter((id) => id !== playerId));
    } else {
      if (substitutes.length >= 9) return;
      if (starters.includes(playerId)) {
        setStarters(starters.filter((id) => id !== playerId));
      }
      setSubstitutes([...substitutes, playerId]);
    }
  };

  const handleSave = async () => {
    if (starters.length !== 11) return alert("يجب اختيار 11 لاعباً أساسياً");
    if (substitutes.length !== 9) return alert("يجب اختيار 9 لاعبين احتياطيين");

    setSaving(true);
    try {
      await onSave(starters, substitutes);
      alert("تم حفظ التشكيل بنجاح ✅");
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ============ الأساسيون ============ */}
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              <h3 className="font-bold text-slate-800">التشكيل الأساسي</h3>
            </div>
            <Badge color={starters.length === 11 ? "emerald" : "amber"}>
              {starters.length} / 11
            </Badge>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto pl-1">
            {players.map((p) => {
              const isStarter = starters.includes(p.id);
              const isSub = substitutes.includes(p.id);
              const isSuspended = p._suspended;
              const isInactive = p._inactive;
              const isDisabled =
                disabled || (isSub && !isStarter) || isSuspended || isInactive;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleStarter(p.id)}
                  disabled={isDisabled}
                  className={[
                    "w-full flex items-center gap-3 p-2.5 rounded-lg text-right transition",
                    isStarter
                      ? "bg-emerald-50 border border-emerald-300"
                      : isSuspended
                      ? "bg-red-50 border border-red-200"
                      : isInactive
                      ? "bg-slate-100 border border-slate-300"
                      : "hover:bg-slate-50 border border-transparent",
                    isDisabled
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={isStarter}
                    readOnly
                    className="w-4 h-4 accent-emerald-600 pointer-events-none"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-700 truncate flex items-center gap-2 flex-wrap">
                    {p.full_name}
                    {p._escalated && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        ⚡ مصعّد
                      </span>
                    )}
                    {isSuspended && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        🚫 موقوف
                      </span>
                    )}
                    {isInactive && (
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        ⏸️ غير نشط
                      </span>
                    )}
                  </span>
                  <Badge color="blue" size="sm">
                    {getPositionLabel(p.position)}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ============ الاحتياطيون ============ */}
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-600" />
              <h3 className="font-bold text-slate-800">الاحتياطيون</h3>
            </div>
            <Badge color={substitutes.length === 9 ? "emerald" : "amber"}>
              {substitutes.length} / 9
            </Badge>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto pl-1">
            {players.map((p) => {
              const isStarter = starters.includes(p.id);
              const isSub = substitutes.includes(p.id);
              const isSuspended = p._suspended;
              const isInactive = p._inactive;
              const isDisabled =
                disabled ||
                (isStarter && !isSub) ||
                isSuspended ||
                isInactive;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSubstitute(p.id)}
                  disabled={isDisabled}
                  className={[
                    "w-full flex items-center gap-3 p-2.5 rounded-lg text-right transition",
                    isSub
                      ? "bg-amber-50 border border-amber-300"
                      : isSuspended
                      ? "bg-red-50 border border-red-200"
                      : isInactive
                      ? "bg-slate-100 border border-slate-300"
                      : "hover:bg-slate-50 border border-transparent",
                    isDisabled
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={isSub}
                    readOnly
                    className="w-4 h-4 accent-amber-600 pointer-events-none"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-700 truncate flex items-center gap-2 flex-wrap">
                    {p.full_name}
                    {p._escalated && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        ⚡ مصعّد
                      </span>
                    )}
                    {isSuspended && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        🚫 موقوف
                      </span>
                    )}
                    {isInactive && (
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        ⏸️ غير نشط
                      </span>
                    )}
                  </span>
                  <Badge color="blue" size="sm">
                    {getPositionLabel(p.position)}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {!disabled && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} /> حفظ التشكيل
          </Button>
        </div>
      )}
    </div>
  );
}