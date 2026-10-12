import { useState } from "react";
import { UserPlus, Search, Users as UsersIcon } from "lucide-react";
import { usePlayers } from "../hooks/usePlayers";
import { useTeams } from "../hooks/useTeams";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/permissions";
import { POSITIONS } from "../utils/constants";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import PlayerCard from "../components/players/PlayerCard";
import PlayerForm from "../components/players/PlayerForm";

export default function Players() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);

  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { players, loading, removePlayer } = usePlayers({
    search: search || undefined,
    teamId: filterTeam || undefined,
    position: filterPosition || undefined,
  });
  const { teams } = useTeams();

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا اللاعب؟")) return;
    try {
      await removePlayer(id);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const handleEdit = (player) => {
    setEditing(player);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة اللاعبين</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "جارٍ التحميل..." : `إجمالي: ${players.length} لاعب`}
          </p>
        </div>
        {admin && (
          <Button onClick={() => setShowForm(true)}>
            <UserPlus size={18} /> إضافة لاعب جديد
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="بحث بالاسم أو الرقم القومي..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="كل الفرق"
            options={teams.map((t) => ({
              value: t.id,
              label: `${t.name} - ${t.category}`,
            }))}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
          <Select
            placeholder="كل المراكز"
            options={POSITIONS}
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
          />
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : players.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title="لا يوجد لاعبون"
            description="ابدأ بإضافة أول لاعب في النظام."
            action={
              admin ? (
                <Button onClick={() => setShowForm(true)}>
                  <UserPlus size={18} /> إضافة لاعب
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={admin ? handleEdit : undefined}
              onDelete={admin ? handleDelete : undefined}
              canEdit={admin}
              canDelete={admin}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={closeForm}
          title={editing ? "تعديل بيانات اللاعب" : "إضافة لاعب جديد"}
          size="xl"
        >
          <PlayerForm
            player={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  );
}
