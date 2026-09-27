import { Gavel, Menu, Microscope, Truck } from 'lucide-react';
import type { DepartmentRole, Romaneio, ViewKey } from '../types';
import { NAV } from './Sidebar';
import { cx, TEMAS } from './ui';

export function Header({
  role,
  romaneios,
  onMenu,
  abrir,
}: {
  role: DepartmentRole;
  romaneios: Romaneio[];
  onMenu: () => void;
  abrir: (v: ViewKey) => void;
}) {
  const permitido = (v: ViewKey) => NAV[role].some((n) => n.key === v);
  const atalhos = [
    { view: 'logistica' as ViewKey, label: 'Caminhão', icon: Truck, n: romaneios.filter((r) => r.status === 'Aguardando Caminhão').length, cls: 'text-sky-300' },
    { view: 'qualidade' as ViewKey, label: 'Qualidade', icon: Microscope, n: romaneios.filter((r) => r.status === 'Ag. Qualidade').length, cls: 'text-red-300' },
    { view: 'analise' as ViewKey, label: 'Admin', icon: Gavel, n: romaneios.filter((r) => r.status === 'Ag. Aprovação Admin').length, cls: 'text-amber-300' },
  ].filter((a) => permitido(a.view));

  const tema = TEMAS[role];

  return (
    <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/85 px-4 py-3 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 lg:hidden" aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <span className={cx('h-2 w-2 rounded-full', tema.ponto)} />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Perfil: <span className={tema.texto}>{tema.nome}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 p-1">
        {atalhos.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.view}
              onClick={() => abrir(a.view)}
              title={`Ir para pendências: ${a.label}`}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <Icon size={14} className={a.cls} />
              <span className="hidden sm:inline">{a.label}</span>
              <span className={cx('font-mono font-bold', a.n > 0 ? a.cls : 'text-zinc-600')}>{a.n}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
