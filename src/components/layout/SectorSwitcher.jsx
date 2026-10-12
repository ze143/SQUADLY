import { ChevronDown, Layers, Lock, Globe } from 'lucide-react';
import { useState } from 'react';
import { useSector } from '../../context/SectorContext';

const colorClasses = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-200 text-slate-700',
};

const ALL_SECTORS = {
  id: null,
  name: 'جميع القطاعات',
  code: 'all',
  color: 'slate',
  isAll: true,
};

export default function SectorSwitcher() {
  const {
    sectors, // النشطة المتاحة
    selectedSector,
    selectedSectorId,
    setSelectedSectorId,
    canSwitchSector,
    isAllSectors,
    isAdmin,
  } = useSector();

  const [open, setOpen] = useState(false);

  // "جميع القطاعات" بس للأدمن
  const options = isAdmin ? [ALL_SECTORS, ...sectors] : sectors;

  const currentOption = isAllSectors ? ALL_SECTORS : selectedSector;

  // ===== سويتش =====
  if (canSwitchSector) {
    const currentColor =
      colorClasses[currentOption?.color] || colorClasses.slate;
    const CurrentIcon = isAllSectors ? Globe : Layers;

    return (
      <div className="px-3 mb-3 relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${currentColor}`}
            >
              <CurrentIcon size={14} />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[10px] text-slate-400">
                {isAdmin ? 'القطاع الحالي' : 'قطاعاتك'}
              </p>
              <p className="text-sm font-bold text-white truncate">
                {currentOption?.name || '—'}
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition shrink-0 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {options.map((option) => {
              const isSelected = option.id === selectedSectorId;
              const c = colorClasses[option.color] || colorClasses.slate;
              const Icon = option.isAll ? Globe : Layers;

              return (
                <button
                  key={option.id ?? 'all'}
                  onClick={() => {
                    setSelectedSectorId(option.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition text-right ${
                    isSelected ? 'bg-slate-700' : ''
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${c}`}
                  >
                    <Icon size={12} />
                  </div>
                  <span className="text-sm text-white flex-1 truncate">
                    {option.name}
                  </span>
                  {isSelected && (
                    <span className="text-emerald-400 text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ===== عرض بسيط =====
  if (!selectedSector) return null;

  const color = colorClasses[selectedSector.color] || colorClasses.emerald;

  return (
    <div className="px-3 py-2 mx-3 mb-3 rounded-lg bg-slate-800 border border-slate-700">
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
        >
          <Layers size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Lock size={10} /> قطاعك
          </p>
          <p className="text-sm font-bold text-white truncate">
            {selectedSector.name}
          </p>
        </div>
      </div>
    </div>
  );
}