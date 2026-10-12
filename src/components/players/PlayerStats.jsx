import { Target, Trophy, AlertTriangle, Calendar, Ban } from 'lucide-react';
import Card from '../ui/Card';

const colorMap = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

function StatBox({ icon: Icon, label, value, color = 'emerald' }) {
  const c = colorMap[color] || colorMap.emerald;
  return (
    <Card padding="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${c.bg} ${c.text}`}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

export default function PlayerStats({
  goals = 0,
  assists = 0,
  yellowCards = 0,
  redCards = 0,
  matchesPlayed = 0,
  activeSuspensions = 0,
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <StatBox icon={Target} label="الأهداف" value={goals} color="emerald" />
      <StatBox icon={Trophy} label="صناعة الأهداف" value={assists} color="blue" />
      <StatBox icon={Calendar} label="المشاركات" value={matchesPlayed} color="purple" />
      <StatBox icon={AlertTriangle} label="إنذارات" value={yellowCards} color="amber" />
      <StatBox icon={AlertTriangle} label="طرد" value={redCards} color="red" />
      <StatBox icon={Ban} label="إيقافات نشطة" value={activeSuspensions} color="red" />
    </div>
  );
}