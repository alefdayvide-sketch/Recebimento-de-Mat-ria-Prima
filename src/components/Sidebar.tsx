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
import { cx } from './ui';

interface NavItem {
  key: ViewKey;
  label: string;
  short: string;
  icon: LucideIcon;
  badge?: (r: Romaneio[]) => number;
}

const pendAdmin = (r: Romaneio[]) => r.filter((x) => x.status === 'Ag. Aprovação Admin').length;
const pendQual = (r: Romaneio[]) => r.filter((x) => x.status === 'Ag. Qualidade').length;
const pendLog = (r: Romaneio[]) => r.filter((x) => x.status === 'Aguardando Caminhão').length;

export const NAV: Record<DepartmentRole, NavItem[]> = {
  admin: [
    { key: 'dashboard', label: 'Fluxo de recebimento', short: 'Fluxo', icon: LayoutDashboard },
    { key: 'analise', label: 'Análise Admin', short: 'Decisão', icon: Gavel, badge: pendAdmin },
    { key: 'romaneios', label: 'Romaneios', short: 'Romaneios', icon: FileSpreadsheet },
    { key: 'logistica', label: 'Logística (Ficha Cega)', short: 'Pátio', icon: Truck, badge: pendLog },
    { key: 'qualidade', label: 'Qualidade (≥20%)', short: 'Qualidade', icon: Microscope, badge: pendQual },
    { key: 'comparativo', label: 'Comparativo', short: 'Comparar', icon: Scale },
    { key: 'indicadores', label: 'Indicadores', short: 'Números', icon: BarChart3 },
    { key: 'consulta', label: 'Consulta', short: 'Consulta', icon: Search },
  ],
  logistica: [
    { key: 'logistica', label: 'Fichas Cegas & Pátio', short: 'Pátio', icon: Truck, badge: pendLog },
    { key: 'consulta', label: 'Consulta & Histórico', short: 'Histórico', icon: Search },
  ],
  qualidade: [
    { key: 'qualidade', label: 'Inspeção Qualidade (≥20%)', short: 'Inspeção', icon: Microscope, badge: pendQual },
    { key: 'comparativo', label: 'Comparativo Auditado', short: 'Comparar', icon: Scale },
    { key: 'consulta', label: 'Consulta & Histórico', short: 'Histórico', icon: Search },
  ],
};

export const ROLE_ICON: Record<DepartmentRole, LucideIcon> = { admin: Gavel, logistica: Truck, qualidade: ClipboardCheck };

export function Sidebar({
  role,
  view,
  setView,
  romaneios,
  open,
  onClose,
  onReset,
}: {
  role: DepartmentRole;
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
      {open && <div className="no-print fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-40 flex w-24 flex-col items-center gap-1.5 bg-vinho py-5 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white font-display text-base font-extrabold text-vinho" title="Icopallet">
          IP
        </div>

        <nav className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-2">
          {NAV[role].map((n) => {
            const count = n.badge?.(romaneios) ?? 0;
            const Icon = n.icon;
            const ativo = view === n.key;
            return (
              <button
                key={n.key}
                title={n.label}
                aria-label={n.label}
                onClick={() => {
                  setView(n.key);
                  onClose();
                }}
                className={cx(
                  'relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
                  ativo ? 'bg-white/[0.18] text-white' : 'text-vinho-100 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon size={22} strokeWidth={ativo ? 2.3 : 2} />
                {n.short}
                {count > 0 && (
                  <span className="absolute right-3 top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 font-mono text-[10px] font-bold text-vinho">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative">
          <button
            onClick={() => setConfirmando((c) => !c)}
            title="Restaurar dados de demonstração"
            aria-label="Restaurar dados de demonstração"
            className="grid h-11 w-11 place-items-center rounded-xl text-vinho-100 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw size={18} />
          </button>
          {confirmando && (
            <div className="absolute bottom-0 left-full ml-3 w-64 rounded-2xl border border-line bg-white p-4 text-sm text-ink shadow-lift">
              <p className="font-semibold">Restaurar os dados de exemplo?</p>
              <p className="mt-1 text-xs text-muted">As alterações feitas até agora serão perdidas.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    onReset();
                    setConfirmando(false);
                  }}
                  className="h-9 flex-1 rounded-lg bg-ink text-xs font-bold text-white hover:bg-black"
                >
                  Restaurar
                </button>
                <button onClick={() => setConfirmando(false)} className="h-9 flex-1 rounded-lg border border-line text-xs font-bold text-ink hover:bg-canvas">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
