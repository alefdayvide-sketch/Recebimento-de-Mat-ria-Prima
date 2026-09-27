import { useCallback, useState, type ReactElement } from 'react';
import { Header } from './components/Header';
import { NAV, Sidebar } from './components/Sidebar';
import { TemaContext, TEMAS, ToastProvider } from './components/ui';
import { useIcopalletStore } from './lib/store';
import { AnaliseAdmin } from './modules/AnaliseAdmin';
import { Comparativo } from './modules/Comparativo';
import { Consulta } from './modules/Consulta';
import { Dashboard } from './modules/Dashboard';
import { Indicadores } from './modules/Indicadores';
import { Logistica } from './modules/Logistica';
import { Qualidade } from './modules/Qualidade';
import { Romaneios } from './modules/Romaneios';
import type { DepartmentRole, ViewKey } from './types';

export interface Nav {
  abrir: (view: ViewKey, id?: string) => void;
  selectedId?: string;
  role: DepartmentRole;
}

export default function App() {
  const store = useIcopalletStore();
  const [role, setRoleState] = useState<DepartmentRole>('admin');
  const [view, setView] = useState<ViewKey>('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);

  const abrir = useCallback(
    (v: ViewKey, id?: string) => {
      // se o perfil atual não acessa a tela, mantém o usuário onde está
      if (!NAV[role].some((n) => n.key === v)) return;
      setView(v);
      setSelectedId(id);
      window.scrollTo({ top: 0 });
    },
    [role],
  );

  const setRole = (r: DepartmentRole) => {
    setRoleState(r);
    setView(NAV[r][0].key);
    setSelectedId(undefined);
  };

  const nav: Nav = { abrir, selectedId, role };
  const props = { store, nav };

  const telas: Record<ViewKey, ReactElement> = {
    dashboard: <Dashboard {...props} />,
    analise: <AnaliseAdmin {...props} />,
    romaneios: <Romaneios {...props} />,
    logistica: <Logistica {...props} />,
    qualidade: <Qualidade {...props} />,
    comparativo: <Comparativo {...props} />,
    indicadores: <Indicadores {...props} />,
    consulta: <Consulta {...props} />,
  };

  return (
    <TemaContext.Provider value={TEMAS[role]}>
      <ToastProvider>
        <div className="min-h-screen bg-white font-sans text-ink">
          <Sidebar
            role={role}
            view={view}
            setView={(v) => abrir(v)}
            romaneios={store.romaneios}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onReset={store.restaurarDemo}
          />
          <div className="lg:pl-24">
            <Header role={role} setRole={setRole} romaneios={store.romaneios} onMenu={() => setMenuOpen(true)} abrir={(v) => abrir(v)} />
            <main key={`${role}-${view}-${selectedId ?? ""}`} className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 lg:py-8">
              {telas[view]}
            </main>
          </div>
        </div>
      </ToastProvider>
    </TemaContext.Provider>
  );
}
