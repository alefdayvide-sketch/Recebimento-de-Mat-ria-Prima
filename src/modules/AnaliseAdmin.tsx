import { CheckCircle2, FileText, FlaskConical, Gavel, Mail, Microscope, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ComparativoTable } from '../components/ComparativoTable';
import { ART, ContainerArt } from '../components/Art';
import { ActionButton, Badge, Card, CardHeader, cx, EmptyState, Field, PageHeader, QueueItem, StatusBadge, Tabs, textareaCls, useToast } from '../components/ui';
import { analisarFardo, LIMITE_SEVERIDADE, maiorSeveridade, totaisRomaneio } from '../lib/calc';
import { fmtData, fmtM3, fmtNum, fmtPct } from '../lib/format';
import type { Romaneio } from '../types';
import { ComparativoFornecedorModal } from './Romaneios';
import type { ModuleProps } from './shared';

type Origem = 'todas' | 'logistica' | 'qualidade';

export function AnaliseAdmin({ store, nav }: ModuleProps) {
  const [origem, setOrigem] = useState<Origem>('todas');
  const pendentes = store.romaneios.filter((r) => r.status === 'Ag. Aprovação Admin');
  const fila = pendentes.filter((r) => origem === 'todas' || (origem === 'logistica' ? r.departamentoOrigem !== 'Qualidade' : r.departamentoOrigem === 'Qualidade'));
  const [selId, setSelId] = useState<string | undefined>(nav.selectedId);
  const sel = fila.find((r) => r.id === selId) ?? fila[0];

  return (
    <div>
      <PageHeader eyebrow="Administrador" title="Decisão executiva" subtitle="Aprove ou devolva as cargas conferidas pela Logística ou periciadas pela Qualidade." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="flex h-fit flex-col gap-2 rounded-3xl bg-canvas p-3">
          <Tabs
            value={origem}
            onChange={(v) => {
              setOrigem(v);
              setSelId(undefined);
            }}
            options={[
              { value: 'todas', label: `Todas · ${pendentes.length}` },
              { value: 'logistica', label: `Direto (< ${LIMITE_SEVERIDADE}%)` },
              { value: 'qualidade', label: `Com laudo (≥ ${LIMITE_SEVERIDADE}%)` },
            ]}
          />
          {fila.length === 0 && <EmptyState art={<ContainerArt p={ART.slate} width={90} />} title="Nenhum dossiê pendente" text="Cargas aguardando aprovação aparecem aqui." />}
          {fila.map((r) => (
            <QueueItem
              key={r.id}
              active={sel?.id === r.id}
              tone="amber"
              art={<ContainerArt p={ART.amber} width={40} />}
              title={r.fornecedor}
              aside={
                r.departamentoOrigem === 'Qualidade' ? (
                  <Badge className="bg-rose-50 text-rose-700">
                    <Microscope size={11} /> Laudo
                  </Badge>
                ) : (
                  <Badge className="bg-teal-50 text-teal-800">
                    <Truck size={11} /> Direto
                  </Badge>
                )
              }
              lines={[`NF ${r.nf} · maior diverg. ${fmtPct(maiorSeveridade(r))}`]}
              onClick={() => setSelId(r.id)}
            />
          ))}
        </div>

        {sel ? (
          <Dossie key={sel.id} romaneio={sel} store={store} />
        ) : (
          <Card>
            <EmptyState icon={<CheckCircle2 size={20} />} title="Tudo em dia" text="Não há cargas aguardando aprovação executiva." />
          </Card>
        )}
      </div>
    </div>
  );
}

function Dossie({ romaneio, store }: { romaneio: Romaneio; store: ModuleProps['store'] }) {
  const toast = useToast();
  const [nota, setNota] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const t = totaisRomaneio(romaneio);
  const laudo = romaneio.laudoQualidade;
  const obsLogistica = romaneio.fardos.filter((f) => f.observacao);

  const agir = (acao: 'aprovar' | 'devolverLogistica' | 'devolverQualidade') => {
    if (acao !== 'aprovar' && !nota.trim()) return toast('Explique o motivo da devolução nas notas do Administrador.', 'warn');
    store.decisaoAdmin(romaneio.id, acao, nota.trim());
    toast(
      acao === 'aprovar' ? 'Entrada aprovada e liberada para estoque.' : acao === 'devolverLogistica' ? 'Carga devolvida à Logística para recontagem.' : 'Carga devolvida à Qualidade para reinspeção.',
      acao === 'aprovar' ? 'ok' : 'warn',
    );
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
          <div className="grid h-28 shrink-0 place-items-center rounded-2xl md:w-48" style={{ background: ART.amber.bg }}>
            <ContainerArt p={ART.amber} width={150} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-muted">Dossiê de recebimento</div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-ink">{romaneio.fornecedor}</h2>
              <span className="font-mono text-sm text-muted">NF {romaneio.nf}</span>
              <StatusBadge status={romaneio.status} />
            </div>
            <div className="mt-1 font-mono text-xs text-muted">
              {romaneio.codigoContainer || 'Carga solta'} · Recebido {fmtData(romaneio.dataChegada)} · Conferente {romaneio.conferenteLogistica || '—'}
            </div>
          </div>
          <ActionButton tone="light" icon={<Mail size={19} />} title="E-mail ao fornecedor" subtitle="Comparativo pronto" onClick={() => setEmailOpen(true)} />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line px-5 py-4 lg:grid-cols-4">
          <Stat label="Peças nominais" value={fmtNum(t.pecasRomaneio)} />
          <Stat label="Peças físicas" value={fmtNum(t.pecasRecebidas)} delta={t.pecasRecebidas - t.pecasRomaneio} />
          <Stat label="m³ original (NF)" value={fmtM3(t.m3Fornecedor)} />
          <Stat label="m³ corrigido" value={fmtM3(t.m3Corrigido)} delta={t.m3Corrigido - t.m3Fornecedor} casas={3} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Nominal × físico por item" icon={<FileText size={18} />} />
        <ComparativoTable romaneio={romaneio} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Laudo da Qualidade" icon={<FlaskConical size={18} />} />
          <div className="p-5 text-sm">
            {laudo ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{laudo.auditor}</span>
                  <StatusBadge status={laudo.decisao} />
                </div>
                <p className="whitespace-pre-wrap text-ink-soft">{laudo.parecer}</p>
                {laudo.observacaoTecnica && <p className="text-xs text-muted">Obs. técnica: {laudo.observacaoTecnica}</p>}
                <p className="text-xs text-muted">Emitido em {fmtData(laudo.data)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {romaneio.fardos
                    .filter((f) => f.reinspecionadoQualidade)
                    .map((f) => (
                      <span key={f.id} className="rounded-lg bg-canvas px-2 py-1 font-mono text-[11px] text-ink-soft">
                        #{f.numeroFardo} · <span className={f.status === 'Liberado' ? 'text-emerald-700' : f.status === 'Reprovado' ? 'text-rose-700' : 'text-orange-700'}>{f.status}</span>
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-muted">Carga enviada direto pela Logística: todos os fardos abaixo de {LIMITE_SEVERIDADE}%. Sem perícia técnica.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Observações da Logística" icon={<Truck size={18} />} />
          <div className="space-y-2 p-5 text-sm">
            {obsLogistica.length === 0 && <p className="text-muted">Nenhuma observação registrada nos fardos.</p>}
            {obsLogistica.map((f) => {
              const a = analisarFardo(f, romaneio.items.find((i) => i.id === f.produtoId));
              return (
                <div key={f.id} className="rounded-lg border border-line bg-canvas px-3 py-2">
                  <div className="flex justify-between font-mono text-[11px] text-muted">
                    <span>Fardo #{f.numeroFardo}</span>
                    <span className={a.critico ? 'text-rose-700' : 'text-amber-700'}>{fmtPct(a.severidade)}</span>
                  </div>
                  <div className="text-ink-soft">{f.observacao}</div>
                </div>
              );
            })}
            {romaneio.observacao && <p className="text-xs text-muted">Obs. do romaneio: {romaneio.observacao}</p>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Deliberação do Administrador" icon={<Gavel size={18} />} />
        <div className="space-y-4 p-5">
          <Field label="Notas do Administrador" hint="Obrigatório para devoluções.">
            <textarea rows={3} className={textareaCls} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Justificativa da decisão, orientações para recontagem ou reinspeção…" />
          </Field>
          <div className="grid gap-3 md:grid-cols-3">
            <DecisaoTile tone="teal" icon={<RotateCcw size={20} />} title="Devolver à Logística" text="Recontagem no pátio" onClick={() => agir('devolverLogistica')} />
            <DecisaoTile tone="rose" icon={<Microscope size={20} />} title="Devolver à Qualidade" text="Nova reinspeção técnica" onClick={() => agir('devolverQualidade')} />
            <DecisaoTile tone="emerald" solid icon={<PackageCheck size={20} />} title="Aprovar entrada" text="Liberar para o estoque" onClick={() => agir('aprovar')} />
          </div>
        </div>
      </Card>

      {emailOpen && <ComparativoFornecedorModal romaneio={romaneio} onClose={() => setEmailOpen(false)} />}
    </div>
  );
}

function Stat({ label, value, delta, casas = 0 }: { label: string; value: string; delta?: number; casas?: number }) {
  return (
    <div className="rounded-xl bg-canvas px-3.5 py-3">
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className="font-display text-xl font-bold tabular-nums text-ink">{value}</div>
      {delta !== undefined && (
        <div className={cx('font-mono text-xs', delta < -0.0005 ? 'text-rose-700' : delta > 0.0005 ? 'text-emerald-700' : 'text-muted')}>
          {delta > 0.0005 ? '+' : ''}
          {fmtNum(delta, casas)}
        </div>
      )}
    </div>
  );
}

function DecisaoTile({ tone, icon, title, text, onClick, solid }: { tone: 'teal' | 'rose' | 'emerald'; icon: ReactNode; title: string; text: string; onClick: () => void; solid?: boolean }) {
  const tile = { teal: 'bg-teal-50 text-teal-700', rose: 'bg-rose-50 text-rose-700', emerald: 'bg-emerald-50 text-emerald-700' }[tone];
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-3 rounded-2xl p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        solid ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'border border-line bg-white text-ink hover:bg-canvas',
      )}
    >
      <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', solid ? 'bg-white/15 text-white' : tile)}>{icon}</span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className={cx('block text-xs', solid ? 'text-emerald-100' : 'text-muted')}>{text}</span>
      </span>
    </button>
  );
}
