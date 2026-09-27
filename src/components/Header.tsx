import { Gavel, Menu, Microscope, Truck } from 'lucide-react';
import type { DepartmentRole, Romaneio, ViewKey } from '../types';
import { NAV, ROLE_ICON } from './Sidebar';
import { cx, TEMAS } from './ui';

const ROLE_ATIVO: Record<DepartmentRole, string> = {
  admin: 'bg-white text-vinho shadow-card',
  logistica: 'bg-white text-teal-700 shadow-card',
  qualidade: 'bg-white text-rose-700 shadow-card',
};

export function Header({
  role,
  setRole,
  romaneios,
  onMenu,
  abrir,
}: {
  role: DepartmentRole;
  setRole: (r: DepartmentRole) => void;
  romaneios: Romaneio[];
  onMenu: () => void;
  abrir: (v: ViewKey) => void;
}) {
  const permitido = (v: ViewKey) => NAV[role].some((n) => n.key === v);
  const atalhos = [
    { view: 'logistica' as ViewKey, label: 'Caminhão', icon: Truck, n: romaneios.filter((r) => r.status === 'Aguardando Caminhão').length, cls: 'bg-teal-50 text-teal-800' },
    { view: 'qualidade' as ViewKey, label: 'Qualidade', icon: Microscope, n: romaneios.filter((r) => r.status === 'Ag. Qualidade').length, cls: 'bg-rose-50 text-rose-700' },
    { view: 'analise' as ViewKey, label: 'Admin', icon: Gavel, n: romaneios.filter((r) => r.status === 'Ag. Aprovação Admin').length, cls: 'bg-amber-50 text-amber-800' },
  ].filter((a) => permitido(a.view));

  return (
    <header className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
      <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-canvas lg:hidden" aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <span className="font-display text-base font-extrabold tracking-[0.16em] text-ink">ICOPALLET</span>
        <span className="hidden text-xs text-muted md:inline">Recebimento de matéria-prima</span>
      </div>

      <div className="order-last flex w-full gap-1 rounded-xl bg-canvas p-1 sm:order-none sm:ml-auto sm:w-auto" role="tablist" aria-label="Perfil de acesso">
        {(Object.keys(TEMAS) as DepartmentRole[]).map((r) => {
          const Icon = ROLE_ICON[r];
          return (
            <button
              key={r}
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={cx('flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-bold transition sm:flex-none', role === r ? ROLE_ATIVO[r] : 'text-muted hover:text-ink')}
            >
              <Icon size={16} />
              {r === 'admin' ? 'Admin' : TEMAS[r].nome}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
        {atalhos.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.view}
              onClick={() => abrir(a.view)}
              title={`Pendências: ${a.label}`}
              className={cx('flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition hover:brightness-95', a.n > 0 ? a.cls : 'bg-canvas text-slate-400')}
            >
              <Icon size={15} />
              <span className="font-mono">{a.n}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
