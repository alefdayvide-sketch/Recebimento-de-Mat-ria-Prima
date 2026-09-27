import { FlaskConical, Microscope, Ruler, Send, Sigma } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button, Card, CardHeader, cx, EmptyState, Field, inputCls, numCls, PageHeader, StatusBadge, useToast } from '../components/ui';
import { analisarFardo, LIMITE_SEVERIDADE } from '../lib/calc';
import { agoraISO, fmtData, fmtNum, fmtPct } from '../lib/format';
import type { DecisaoLaudo, FardoRecebido, Romaneio } from '../types';
import type { ModuleProps } from './shared';

const DECISOES: { value: DecisaoLaudo; label: string }[] = [
  { value: 'Liberado', label: 'Liberado' },
  { value: 'Divergente confirmado', label: 'Divergente confirmado com ajuste de cubagem' },
  { value: 'Reprovado', label: 'Reprovado' },
];

export function Qualidade({ store, nav }: ModuleProps) {
  const fila = store.romaneios.filter((r) => r.status === 'Ag. Qualidade').sort((a, b) => (a.dataEnvioLogistica ?? '').localeCompare(b.dataEnvioLogistica ?? ''));
  const [selId, setSelId] = useState<string | undefined>(nav.selectedId);
  const sel = fila.find((r) => r.id === selId) ?? fila[0];

  return (
    <div>
      <PageHeader title="Qualidade · Auditoria Técnica (≥20%)" subtitle="Perícia das cargas retidas pela Logística com fardos em severidade crítica." />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Fila de perícia" subtitle={`${fila.length} carga(s) aguardando`} icon={<Microscope size={18} />} />
          <div className="divide-y divide-zinc-800/70">
            {fila.length === 0 && <EmptyState icon={<FlaskConical size={20} />} title="Nenhuma carga retida" text="Cargas com fardos ≥ 20% aparecerão aqui." />}
            {fila.map((r) => {
              const criticos = r.fardos.filter((f) => analisarFardo(f, r.items.find((i) => i.id === f.produtoId)).critico).length;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelId(r.id)}
                  className={cx('block w-full border-l-2 px-4 py-3 text-left', sel?.id === r.id ? 'border-l-rose-400 bg-rose-500/10' : 'border-l-transparent hover:bg-zinc-800/40')}
                >
                  <div className="text-sm font-semibold text-zinc-100">{r.fornecedor}</div>
                  <div className="font-mono text-[11px] text-zinc-500">
                    NF {r.nf} · {r.codigoContainer || 'sem container'}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-red-300">{criticos} fardo(s) crítico(s)</span>
                    <span className="text-zinc-500">{fmtData(r.dataEnvioLogistica)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
        {sel ? (
          <Pericia key={sel.id} romaneio={sel} store={store} />
        ) : (
          <Card>
            <EmptyState icon={<Microscope size={20} />} title="Fila de perícia vazia" text="Não há cargas aguardando auditoria técnica." />
          </Card>
        )}
      </div>
    </div>
  );
}

function sugerirDecisao(fardos: FardoRecebido[]): DecisaoLaudo {
  if (fardos.some((f) => f.status === 'Reprovado')) return 'Reprovado';
  if (fardos.some((f) => f.status === 'Divergente confirmado')) return 'Divergente confirmado';
  return 'Liberado';
}

function Pericia({ romaneio, store }: { romaneio: Romaneio; store: ModuleProps['store'] }) {
  const toast = useToast();
  const itemMap = useMemo(() => new Map(romaneio.items.map((i) => [i.id, i])), [romaneio.items]);
  const [fardos, setFardos] = useState<FardoRecebido[]>(() =>
    romaneio.fardos.map((f) => {
      const critico = analisarFardo(f, itemMap.get(f.produtoId)).critico;
      if (f.status === 'Liberado' || f.status === 'Divergente confirmado' || f.status === 'Reprovado') return f;
      return { ...f, status: critico ? 'Divergente confirmado' : 'Liberado' };
    }),
  );
  const [somenteRetidos, setSomenteRetidos] = useState(true);
  const [auditor, setAuditor] = useState(romaneio.laudoQualidade?.auditor ?? '');
  const [parecer, setParecer] = useState(romaneio.laudoQualidade?.parecer ?? '');
  const [obsTec, setObsTec] = useState(romaneio.laudoQualidade?.observacaoTecnica ?? '');
  const [decisao, setDecisao] = useState<DecisaoLaudo | ''>(romaneio.laudoQualidade?.decisao ?? '');

  const originais = useMemo(() => new Map(romaneio.fardos.map((f) => [f.id, analisarFardo(f, itemMap.get(f.produtoId)).critico])), [romaneio.fardos, itemMap]);
  const analises = fardos.map((f) => analisarFardo(f, itemMap.get(f.produtoId)));
  const visiveis = fardos.map((f, i) => ({ f, a: analises[i] })).filter(({ f }) => !somenteRetidos || originais.get(f.id));

  const mediaPecas = analises.length ? analises.reduce((s, a) => s + a.pctPecas, 0) / analises.length : 0;
  const mediaM3 = analises.length ? analises.reduce((s, a) => s + a.pctM3, 0) / analises.length : 0;
  const impacto = analises.reduce((s, a) => s + (a.m3Real - a.m3Nominal), 0);

  const decisaoFinal = decisao || sugerirDecisao(fardos);
  const upd = (id: string, patch: Partial<FardoRecebido>) => setFardos((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch, reinspecionadoQualidade: true } : f)));

  const enviar = () => {
    if (!auditor.trim()) return toast('Informe o nome do auditor pericial.', 'warn');
    if (parecer.trim().length < 15) return toast('Escreva o parecer técnico circunstanciado (mín. 15 caracteres).', 'warn');
    store.enviarLaudo(
      romaneio.id,
      fardos.map((f) => (originais.get(f.id) ? { ...f, reinspecionadoQualidade: true } : f)),
      { auditor: auditor.trim(), parecer: parecer.trim(), observacaoTecnica: obsTec.trim() || undefined, decisao: decisaoFinal, data: agoraISO() },
    );
    toast(`Laudo transmitido (${decisaoFinal}). Carga enviada para aprovação do Administrador.`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-50">
                {romaneio.fornecedor} <span className="font-mono text-base text-zinc-400">· NF {romaneio.nf}</span>
              </h2>
              <StatusBadge status={romaneio.status} />
            </div>
            <div className="font-mono text-xs text-zinc-500">
              {romaneio.id} · Container {romaneio.codigoContainer || '—'} · Conferente {romaneio.conferenteLogistica || '—'}
            </div>
          </div>
          {romaneio.aprovacaoAdmin?.decisao === 'Devolvido' && (
            <div className="max-w-sm rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <b>Devolvida pelo Admin para reinspeção:</b> {romaneio.aprovacaoAdmin.observacao || 'sem observação.'}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={<Sigma size={16} />} label="Divergência média em peças" value={fmtPct(mediaPecas)} tone={mediaPecas >= LIMITE_SEVERIDADE ? 'text-red-300' : 'text-amber-300'} />
        <Metric icon={<Ruler size={16} />} label="Divergência média em volume (m³)" value={fmtPct(mediaM3)} tone={mediaM3 >= LIMITE_SEVERIDADE ? 'text-red-300' : 'text-amber-300'} />
        <Metric
          icon={<FlaskConical size={16} />}
          label="Impacto volumétrico total"
          value={`${impacto > 0 ? '+' : ''}${fmtNum(impacto, 4)} m³`}
          tone={impacto < 0 ? 'text-red-300' : impacto > 0 ? 'text-emerald-300' : 'text-zinc-300'}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Reinspeção milimétrica fardo a fardo</h3>
            <p className="text-xs text-zinc-500">Ajuste recontagem, amostra e variações (E/L/C) e decida cada fardo.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={somenteRetidos} onChange={(e) => setSomenteRetidos(e.target.checked)} className="accent-rose-500" />
            Somente fardos retidos (≥ {LIMITE_SEVERIDADE}%)
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5">Fardo</th>
                <th className="px-2 py-2.5">Produto</th>
                <th className="px-2 py-2.5 text-right">Recontagem</th>
                <th className="px-2 py-2.5 text-right">Amostra</th>
                <th className="px-2 py-2.5 text-right">Diverg.</th>
                <th className="px-2 py-2.5 text-right">Δ E</th>
                <th className="px-2 py-2.5 text-right">Δ L</th>
                <th className="px-2 py-2.5 text-right">Δ C</th>
                <th className="px-2 py-2.5 text-right">% Pçs / % m³</th>
                <th className="px-2 py-2.5">Decisão do fardo</th>
                <th className="px-3 py-2.5">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {visiveis.map(({ f, a }) => {
                const item = itemMap.get(f.produtoId);
                const num = (k: keyof FardoRecebido, inteiro = false) => (
                  <td className="px-2 py-2">
                    <input
                      inputMode="decimal"
                      className={numCls}
                      defaultValue={String(f[k] ?? 0)}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(',', '.'));
                        if (!Number.isNaN(n)) upd(f.id, { [k]: inteiro ? Math.max(0, Math.round(n)) : n } as Partial<FardoRecebido>);
                      }}
                    />
                  </td>
                );
                return (
                  <tr key={f.id} className={cx(a.critico && 'bg-red-500/5')}>
                    <td className="px-3 py-2 font-mono font-bold text-zinc-200">
                      #{f.numeroFardo}
                      {originais.get(f.id) && <div className="text-[9px] font-semibold text-red-400">RETIDO</div>}
                    </td>
                    <td className="px-2 py-2 text-zinc-300">
                      {item?.produto}
                      <div className="font-mono text-[10px] text-zinc-500">
                        {item?.espessura}×{item?.largura}×{item?.comprimento} mm
                      </div>
                    </td>
                    {num('quantidadeRecebida', true)}
                    {num('amostraColetada', true)}
                    {num('quantidadeDivergente', true)}
                    {num('v_espessura')}
                    {num('v_largura')}
                    {num('v_comprimento')}
                    <td className="px-2 py-2 text-right font-mono">
                      <div className={cx('font-bold', a.pctPecas >= LIMITE_SEVERIDADE ? 'text-red-400' : 'text-zinc-300')}>{fmtPct(a.pctPecas)}</div>
                      <div className={cx(a.pctM3 >= LIMITE_SEVERIDADE ? 'text-red-400' : 'text-zinc-500')}>{fmtPct(a.pctM3)}</div>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className={cx(
                          inputCls,
                          'py-1.5 text-xs',
                          f.status === 'Liberado' && 'border-emerald-600/60 text-emerald-300',
                          f.status === 'Divergente confirmado' && 'border-orange-600/60 text-orange-300',
                          f.status === 'Reprovado' && 'border-red-600/70 text-red-300',
                        )}
                        value={f.status}
                        onChange={(e) => upd(f.id, { status: e.target.value as FardoRecebido['status'] })}
                      >
                        <option value="Liberado">Liberado</option>
                        <option value="Divergente confirmado">Divergente confirmado</option>
                        <option value="Reprovado">Reprovado</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input className={cx(inputCls, 'min-w-[150px] py-1.5 text-xs')} defaultValue={f.motivoDivergencia ?? ''} onChange={(e) => upd(f.id, { motivoDivergencia: e.target.value })} placeholder="Ex: espessura média 22 mm" />
                    </td>
                  </tr>
                );
              })}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum fardo para exibir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Parecer técnico do auditor" subtitle="O laudo segue anexado ao dossiê do Administrador." icon={<FlaskConical size={18} />} />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Auditor pericial">
            <input className={inputCls} value={auditor} onChange={(e) => setAuditor(e.target.value)} placeholder="Nome e registro do auditor" />
          </Field>
          <Field label="Decisão do laudo" hint={!decisao ? `Sugestão pelas decisões dos fardos: ${sugerirDecisao(fardos)}` : undefined}>
            <select className={inputCls} value={decisao} onChange={(e) => setDecisao(e.target.value as DecisaoLaudo | '')}>
              <option value="">Automática ({sugerirDecisao(fardos)})</option>
              {DECISOES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Parecer técnico circunstanciado" className="md:col-span-2">
            <textarea rows={4} className={inputCls} value={parecer} onChange={(e) => setParecer(e.target.value)} placeholder="Descreva o método, as medições e a conclusão técnica…" />
          </Field>
          <Field label="Observações técnicas (instrumentos, calibração, lote)" className="md:col-span-2">
            <input className={inputCls} value={obsTec} onChange={(e) => setObsTec(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={enviar} className="w-full sm:w-auto">
          <Send size={16} /> Transmitir Laudo e Enviar para Aprovação do Administrador
        </Button>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        {icon}
        {label}
      </div>
      <div className={cx('mt-2 font-mono text-2xl font-bold', tone)}>{value}</div>
    </div>
  );
}
