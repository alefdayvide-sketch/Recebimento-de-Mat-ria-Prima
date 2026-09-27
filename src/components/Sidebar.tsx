import {
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  Gavel,
  LayoutDashboard,
  Microscope,
  RotateCcw,
  Scale,
  Search,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { DepartmentRole, Romaneio, ViewKey } from '../types';
import { cx, TEMAS } from './ui';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
  badge?: (r: Romaneio[]) => number;
}

const pendAdmin = (r: Romaneio[]) => r.filter((x) => x.status === 'Ag. Aprovação Admin').length;
const pendQual = (r: Romaneio[]) => r.filter((x) => x.status === 'Ag. Qualidade').length;
const pendLog = (r: Romaneio[]) => r.filter((x) => x.status === 'Aguardando Caminhão').length;

export const NAV: Record<DepartmentRole, NavItem[]> = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'analise', label: 'Análise Admin', icon: Gavel, badge: pendAdmin },
    { key: 'romaneios', label: 'Romaneios', icon: FileSpreadsheet },
    { key: 'logistica', label: 'Logística (Ficha Cega)', icon: Truck, badge: pendLog },
    { key: 'qualidade', label: 'Qualidade (≥20%)', icon: Microscope, badge: pendQual },
    { key: 'comparativo', label: 'Comparativo', icon: Scale },
    { key: 'indicadores', label: 'Indicadores', icon: BarChart3 },
    { key: 'consulta', label: 'Consulta', icon: Search },
  ],
  logistica: [
    { key: 'logistica', label: 'Fichas Cegas & Pátio', icon: Truck, badge: pendLog },
    { key: 'consulta', label: 'Consulta & Histórico', icon: Search },
  ],
  qualidade: [
    { key: 'qualidade', label: 'Inspeção Qualidade (≥20%)', icon: Microscope, badge: pendQual },
    { key: 'comparativo', label: 'Comparativo Auditado', icon: Scale },
    { key: 'consulta', label: 'Consulta & Histórico', icon: Search },
  ],
};

const ROLE_ICON: Record<DepartmentRole, LucideIcon> = { admin: Gavel, logistica: Truck, qualidade: ClipboardCheck };

const ROLE_ACTIVE: Record<DepartmentRole, string> = {
  admin: 'bg-vinho text-white border-vinho-400',
  logistica: 'bg-teal-600 text-white border-teal-400',
  qualidade: 'bg-rose-600 text-white border-rose-400',
};

const NAV_ACTIVE: Record<DepartmentRole, string> = {
  admin: 'bg-vinho/20 text-red-100 border-l-vinho-400',
  logistica: 'bg-teal-500/10 text-teal-100 border-l-teal-400',
  qualidade: 'bg-rose-500/10 text-rose-100 border-l-rose-400',
};

export function Sidebar({
  role,
  setRole,
  view,
  setView,
  romaneios,
  open,
  onClose,
  onReset,
}: {
  role: DepartmentRole;
  setRole: (r: DepartmentRole) => void;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  romaneios: Romaneio[];
  open: boolean;
  onClose: () => void;
  onReset: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <>
      {open && <div className="no-print fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-zinc-800 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-vinho font-black text-white shadow-lg shadow-vinho/30">IP</div>
            <div>
              <div className="text-lg font-extrabold tracking-[0.18em] text-white">ICOPALLET</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Industrial Quality &amp; Logistics</div>
            </div>
          </div>
        </div>

        <div className="border-b border-zinc-800 px-4 py-4">
          <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Perfil de acesso</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(TEMAS) as DepartmentRole[]).map((r) => {
              const Icon = ROLE_ICON[r];
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cx(
                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition',
                    role === r ? ROLE_ACTIVE[r] : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  <Icon size={16} />
                  {r === 'admin' ? 'Admin' : TEMAS[r].nome}
                </button>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV[role].map((n) => {
            const count = n.badge?.(romaneios) ?? 0;
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                onClick={() => {
                  setView(n.key);
                  onClose();
                }}
                className={cx(
                  'mb-1 flex w-full items-center gap-3 rounded-r-lg border-l-2 px-3 py-2.5 text-sm transition',
                  view === n.key ? NAV_ACTIVE[role] : 'border-l-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
                )}
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{n.label}</span>
                {count > 0 && (
                  <span className="min-w-[22px] rounded-full bg-red-600 px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-white">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 px-4 py-3">
          {confirmando ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-100">
              <p className="mb-2">Restaurar os dados de exemplo? As alterações atuais serão perdidas.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onReset();
                    setConfirmando(false);
                  }}
                  className="flex-1 rounded-md bg-amber-600 px-2 py-1.5 font-semibold text-white hover:bg-amber-500"
                >
                  Restaurar
                </button>
                <button onClick={() => setConfirmando(false)} className="flex-1 rounded-md border border-zinc-700 px-2 py-1.5 text-zinc-300 hover:bg-zinc-800">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmando(true)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
              <RotateCcw size={14} /> Restaurar dados de demonstração
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
