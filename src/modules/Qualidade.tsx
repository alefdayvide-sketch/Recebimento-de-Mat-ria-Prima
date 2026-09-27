import { Check, FlaskConical, Microscope, Ruler, Send, Sigma, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { ART, ContainerArt } from '../components/Art';
import { Button, Card, CardHeader, cx, EmptyState, Field, inputCls, Meter, numCls, PageHeader, QueueItem, selectSmCls, StatusBadge, textareaCls, useToast } from '../components/ui';
import { analisarFardo, LIMITE_SEVERIDADE, maiorSeveridade } from '../lib/calc';
import { agoraISO, fmtData, fmtNum, fmtPct } from '../lib/format';
import type { DecisaoLaudo, FardoRecebido, Romaneio } from '../types';
import type { ModuleProps } from './shared';

const DEC_FARDO: { value: FardoRecebido['status']; label: string; icon: ReactNode; on: string }[] = [
  { value: 'Liberado', label: 'Liberar', icon: <Check size={13} strokeWidth={3} />, on: 'bg-emerald-700 text-white' },
  { value: 'Divergente confirmado', label: 'Divergente', icon: <TriangleAlert size={13} />, on: 'bg-orange-600 text-white' },
  { value: 'Reprovado', label: 'Reprovar', icon: <X size={13} strokeWidth={3} />, on: 'bg-red-700 text-white' },
];

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
      <PageHeader eyebrow="Qualidade" title="Auditoria técnica (≥ 20%)" subtitle="Perícia das cargas retidas pela Logística com fardos em severidade crítica." />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="flex h-fit flex-col gap-2 rounded-3xl bg-canvas p-3">
          <div className="flex items-center gap-2.5 px-1.5 pt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
            <h2 className="flex-1 font-display text-[15px] font-bold text-ink">Fila de perícia</h2>
            <span className="font-mono text-sm text-muted">{fila.length}</span>
          </div>
          {fila.length === 0 && <EmptyState art={<ContainerArt p={ART.slate} width={90} />} title="Nenhuma carga retida" text="Cargas com fardos ≥ 20% aparecem aqui." />}
          {fila.map((r) => {
            const criticos = r.fardos.filter((f) => analisarFardo(f, r.items.find((i) => i.id === f.produtoId)).critico).length;
            return (
              <QueueItem
                key={r.id}
                active={sel?.id === r.id}
                tone="rose"
                art={<ContainerArt p={ART.rose} width={40} />}
                title={r.fornecedor}
                aside={<span className="rounded-md bg-rose-700 px-1.5 py-0.5 font-mono text-[10px] text-white">{fmtPct(maiorSeveridade(r))}</span>}
                lines={[`NF ${r.nf} · ${criticos} fardo(s) crítico(s)`, `Recebida ${fmtData(r.dataEnvioLogistica)}`]}
                onClick={() => setSelId(r.id)}
              />
            );
          })}
        </div>
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
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
          <div className="relative grid h-32 shrink-0 place-items-center rounded-2xl md:w-56" style={{ background: ART.rose.bg }}>
            <ContainerArt p={ART.rose} width={170} />
            <span className="absolute right-2.5 top-2.5 rounded-lg bg-rose-700 px-2 py-0.5 font-mono text-xs text-white">{fmtPct(maiorSeveridade(romaneio))}</span>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-ink">{romaneio.fornecedor}</h2>
              <span className="font-mono text-sm text-muted">NF {romaneio.nf}</span>
              <StatusBadge status={romaneio.status} />
            </div>
            <div className="font-mono text-xs text-muted">
              {romaneio.codigoContainer || 'Carga solta'} · Conferente {romaneio.conferenteLogistica || '—'} · {romaneio.id}
            </div>
            <div className="max-w-md">
              <Meter value={maiorSeveridade(romaneio)} />
            </div>
            {romaneio.aprovacaoAdmin?.decisao === 'Devolvido' && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <b>Devolvida pelo Admin para reinspeção:</b> {romaneio.aprovacaoAdmin.observacao || 'sem observação.'}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={<Sigma size={20} />} label="Divergência média em peças" value={fmtPct(mediaPecas)} tone={mediaPecas >= LIMITE_SEVERIDADE ? 'text-red-700' : 'text-amber-700'} />
        <Metric icon={<Ruler size={20} />} label="Divergência média em volume (m³)" value={fmtPct(mediaM3)} tone={mediaM3 >= LIMITE_SEVERIDADE ? 'text-red-700' : 'text-amber-700'} />
        <Metric
          icon={<FlaskConical size={20} />}
          label="Impacto volumétrico total"
          value={`${impacto > 0 ? '+' : ''}${fmtNum(impacto, 4)} m³`}
          tone={impacto < 0 ? 'text-red-700' : impacto > 0 ? 'text-emerald-700' : 'text-ink-soft'}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">Reinspeção milimétrica fardo a fardo</h3>
            <p className="text-xs text-muted">Ajuste recontagem, amostra e variações (E/L/C) e decida cada fardo.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={somenteRetidos} onChange={(e) => setSomenteRetidos(e.target.checked)} className="h-4 w-4 accent-rose-600" />
            Somente fardos retidos (≥ {LIMITE_SEVERIDADE}%)
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-xs">
            <thead>
              <tr className="border-b border-line bg-canvas/70 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
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
            <tbody className="divide-y divide-line">
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
                  <tr key={f.id} className={cx(a.critico && 'bg-rose-50/60')}>
                    <td className="px-3 py-2 font-mono font-bold text-ink">
                      #{f.numeroFardo}
                      {originais.get(f.id) && <div className="text-[9px] font-semibold text-rose-700">RETIDO</div>}
                    </td>
                    <td className="px-2 py-2 text-ink-soft">
                      {item?.produto}
                      <div className="font-mono text-[10px] text-muted">
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
                      <div className={cx('font-bold', a.pctPecas >= LIMITE_SEVERIDADE ? 'text-rose-700' : 'text-ink-soft')}>{fmtPct(a.pctPecas)}</div>
                      <div className={cx(a.pctM3 >= LIMITE_SEVERIDADE ? 'text-rose-700' : 'text-muted')}>{fmtPct(a.pctM3)}</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1" role="group" aria-label={`Decisão do fardo ${f.numeroFardo}`}>
                        {DEC_FARDO.map((d) => (
                          <button
                            key={d.value}
                            title={d.value}
                            aria-pressed={f.status === d.value}
                            onClick={() => upd(f.id, { status: d.value })}
                            className={cx('flex h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition', f.status === d.value ? d.on : 'bg-canvas text-muted hover:text-ink')}
                          >
                            {d.icon}
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input className={cx(selectSmCls, 'min-w-[150px]')} defaultValue={f.motivoDivergencia ?? ''} onChange={(e) => upd(f.id, { motivoDivergencia: e.target.value })} placeholder="Ex: espessura média 22 mm" />
                    </td>
                  </tr>
                );
              })}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted">
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
            <textarea rows={4} className={textareaCls} value={parecer} onChange={(e) => setParecer(e.target.value)} placeholder="Descreva o método, as medições e a conclusão técnica…" />
          </Field>
          <Field label="Observações técnicas (instrumentos, calibração, lote)" className="md:col-span-2">
            <input className={inputCls} value={obsTec} onChange={(e) => setObsTec(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-line bg-white/95 p-3 pl-5 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[13px] text-ink-soft">
          Decisão do laudo: <b className="text-ink">{decisaoFinal}</b>
        </div>
        <Button size="lg" onClick={enviar} className="w-full sm:w-auto">
          <Send size={17} /> Transmitir laudo e enviar ao Administrador
        </Button>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700">{icon}</span>
      <div>
        <div className={cx('font-display text-2xl font-bold tabular-nums', tone)}>{value}</div>
        <div className="text-xs font-semibold text-muted">{label}</div>
      </div>
    </div>
  );
}
