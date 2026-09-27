import { AlertOctagon, AlertTriangle, CheckCircle2, Gavel, Info, Microscope, ShieldAlert, Truck } from 'lucide-react';
import { Card, CardHeader, cx, EmptyState, KpiCard, PageHeader, StatusBadge } from '../components/ui';
import { LIMITE_SEVERIDADE, maiorSeveridade, prioridade, totaisRomaneio, type Prioridade } from '../lib/calc';
import { fmtData, fmtM3, fmtNum, fmtPct } from '../lib/format';
import type { ViewKey } from '../types';
import { destinoDoStatus, type ModuleProps } from './shared';

const PRIO: Record<Prioridade, { label: string; borda: string; tag: string }> = {
  CRITICO: { label: 'CRÍTICO', borda: 'border-l-red-500 border-red-500/30', tag: 'bg-red-600 text-white' },
  ATENCAO: { label: 'ATENÇÃO', borda: 'border-l-amber-500 border-amber-500/20', tag: 'bg-amber-500 text-black' },
  OK: { label: 'OK', borda: 'border-l-emerald-500/70 border-zinc-800', tag: 'bg-emerald-600/80 text-white' },
};

export function Dashboard({ store, nav }: ModuleProps) {
  const { romaneios } = store;
  const count = (s: string) => romaneios.filter((r) => r.status === s).length;

  const ordem: Record<Prioridade, number> = { CRITICO: 0, ATENCAO: 1, OK: 2 };
  const monitor = [...romaneios].sort((a, b) => ordem[prioridade(a)] - ordem[prioridade(b)] || b.createdAt - a.createdAt);

  const alertas = romaneios
    .filter((r) => r.status !== 'Finalizado')
    .flatMap((r) => {
      const out: { id: string; texto: string; nivel: 'crit' | 'warn'; view: ViewKey }[] = [];
      const sev = maiorSeveridade(r);
      if (r.status === 'Ag. Qualidade')
        out.push({ id: r.id, nivel: 'crit', view: 'qualidade', texto: `${r.fornecedor} · NF ${r.nf}: fardo com ${fmtPct(sev)} de divergência retido na Qualidade.` });
      if (r.status === 'Ag. Aprovação Admin' && r.laudoQualidade?.decisao === 'Reprovado')
        out.push({ id: r.id, nivel: 'crit', view: 'analise', texto: `${r.fornecedor} · NF ${r.nf}: laudo técnico REPROVOU a carga.` });
      if (r.status === 'Ag. Aprovação Admin' && r.laudoQualidade?.decisao === 'Divergente confirmado')
        out.push({ id: r.id, nivel: 'warn', view: 'analise', texto: `${r.fornecedor} · NF ${r.nf}: divergência confirmada, requer ajuste de cubagem.` });
      if (r.status === 'Aguardando Caminhão' && r.dataPrevista < new Date().toISOString().slice(0, 10))
        out.push({ id: r.id, nivel: 'warn', view: 'logistica', texto: `${r.fornecedor} · NF ${r.nf}: caminhão atrasado (previsto ${fmtData(r.dataPrevista)}).` });
      return out;
    });

  return (
    <div>
      <PageHeader title="Dashboard Geral" subtitle="Visão consolidada do recebimento de matéria-prima em tempo real." />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Aguardando Caminhão" value={count('Aguardando Caminhão')} icon={<Truck size={16} />} tone="sky" hint="Fichas cegas na fila do pátio" onClick={() => nav.abrir('logistica')} />
        <KpiCard label="Aguardando Qualidade (≥20%)" value={count('Ag. Qualidade')} icon={<Microscope size={16} />} tone="red" hint="Cargas retidas para perícia" onClick={() => nav.abrir('qualidade')} />
        <KpiCard label="Aguardando Aprovação Admin" value={count('Ag. Aprovação Admin')} icon={<Gavel size={16} />} tone="amber" hint="Dossiês para deliberar" onClick={() => nav.abrir('analise')} />
        <KpiCard label="Finalizados" value={count('Finalizado')} icon={<CheckCircle2 size={16} />} tone="emerald" hint="Entradas liberadas para estoque" onClick={() => nav.abrir('consulta')} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Monitor Geral de Cargas" subtitle="Ordenado por prioridade: crítico, atenção e conforme." icon={<ShieldAlert size={18} />} />
          <div className="divide-y divide-zinc-800/70">
            {monitor.length === 0 && <EmptyState icon={<Truck size={20} />} title="Nenhuma carga cadastrada" />}
            {monitor.map((r) => {
              const p = prioridade(r);
              const t = totaisRomaneio(r);
              const sev = maiorSeveridade(r);
              return (
                <button
                  key={r.id}
                  onClick={() => nav.abrir(destinoDoStatus(r.status), r.id)}
                  className={cx('flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-l-4 px-5 py-3.5 text-left transition hover:bg-zinc-800/40', PRIO[p].borda)}
                >
                  <span className={cx('rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider', PRIO[p].tag)}>{PRIO[p].label}</span>
                  <div className="min-w-[180px] flex-1">
                    <div className="text-sm font-semibold text-zinc-100">
                      {r.fornecedor} <span className="font-normal text-zinc-500">· NF {r.nf}</span>
                    </div>
                    <div className="font-mono text-[11px] text-zinc-500">
                      {r.id} · {r.codigoContainer || 'sem container'}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono text-zinc-300">{t.conferido ? fmtM3(t.m3Corrigido) : fmtM3(t.m3Fornecedor)}</div>
                    <div className="text-zinc-500">{t.conferido ? `${fmtNum(t.pecasRecebidas)} pçs conferidas` : `${fmtNum(t.pecasRomaneio)} pçs nominais`}</div>
                  </div>
                  <div className="w-20 text-right">
                    <div className={cx('font-mono text-sm font-bold', sev >= LIMITE_SEVERIDADE ? 'text-red-400' : sev > 0 ? 'text-amber-300' : 'text-zinc-500')}>
                      {r.fardos.length ? fmtPct(sev) : '—'}
                    </div>
                    <div className="text-[10px] text-zinc-500">maior diverg.</div>
                  </div>
                  <StatusBadge status={r.status} />
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Regras dos 3 módulos" icon={<Info size={18} />} />
            <ol className="space-y-4 px-5 py-4 text-sm">
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vinho text-xs font-bold text-white">1</span>
                <div>
                  <div className="font-semibold text-zinc-100">Administrador emite o romaneio</div>
                  <p className="text-xs text-zinc-400">Define container e medidas nominais. A ficha cega entra na fila da Logística como “Aguardando Caminhão”.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">2</span>
                <div>
                  <div className="font-semibold text-zinc-100">Logística confere às cegas</div>
                  <p className="text-xs text-zinc-400">
                    Conta fardos e mede amostras. Qualquer fardo com divergência <b className="text-red-300">≥ {LIMITE_SEVERIDADE}%</b> envia a carga à Qualidade; abaixo disso, direto ao Admin.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-600 text-xs font-bold text-white">3</span>
                <div>
                  <div className="font-semibold text-zinc-100">Qualidade emite o laudo</div>
                  <p className="text-xs text-zinc-400">Reinspeção milimétrica fardo a fardo e parecer técnico. O Admin aprova ou devolve a carga.</p>
                </div>
              </li>
            </ol>
          </Card>

          <Card>
            <CardHeader title="Alertas operacionais" subtitle={`${alertas.length} ativo(s)`} icon={<AlertOctagon size={18} />} />
            <div className="space-y-2 p-4">
              {alertas.length === 0 && <p className="py-6 text-center text-xs text-zinc-500">Sem alertas críticos no momento.</p>}
              {alertas.map((a, i) => (
                <button
                  key={`${a.id}-${i}`}
                  onClick={() => nav.abrir(a.view, a.id)}
                  className={cx(
                    'flex w-full gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition hover:brightness-125',
                    a.nivel === 'crit' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200',
                  )}
                >
                  {a.nivel === 'crit' ? <AlertOctagon size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                  {a.texto}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
