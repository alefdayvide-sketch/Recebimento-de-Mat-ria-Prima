import { CheckCircle2, FileText, FlaskConical, Gavel, Mail, Microscope, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import { useState } from 'react';
import { ComparativoTable } from '../components/ComparativoTable';
import { Badge, Button, Card, CardHeader, cx, EmptyState, Field, inputCls, PageHeader, StatusBadge, Tabs, useToast } from '../components/ui';
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
      <PageHeader title="Análise Admin · Aprovação Executiva" subtitle="Deliberação final das cargas conferidas pela Logística ou periciadas pela Qualidade." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <div className="border-b border-zinc-800 p-4">
            <Tabs
              value={origem}
              onChange={(v) => {
                setOrigem(v);
                setSelId(undefined);
              }}
              options={[
                { value: 'todas', label: `Todas (${pendentes.length})` },
                { value: 'logistica', label: `Direto da Logística (< ${LIMITE_SEVERIDADE}%)` },
                { value: 'qualidade', label: `Via Qualidade (≥ ${LIMITE_SEVERIDADE}%)` },
              ]}
            />
          </div>
          <div className="divide-y divide-zinc-800/70">
            {fila.length === 0 && <EmptyState icon={<Gavel size={20} />} title="Nenhum dossiê pendente" text="Cargas aguardando aprovação aparecerão aqui." />}
            {fila.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelId(r.id)}
                className={cx('block w-full border-l-2 px-4 py-3 text-left', sel?.id === r.id ? 'border-l-vinho-400 bg-vinho/15' : 'border-l-transparent hover:bg-zinc-800/40')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-100">{r.fornecedor}</span>
                  {r.departamentoOrigem === 'Qualidade' ? (
                    <Badge className="border-rose-500/40 bg-rose-500/10 text-rose-300">
                      <Microscope size={11} /> Qualidade
                    </Badge>
                  ) : (
                    <Badge className="border-teal-500/40 bg-teal-500/10 text-teal-300">
                      <Truck size={11} /> Logística
                    </Badge>
                  )}
                </div>
                <div className="mt-1 font-mono text-[11px] text-zinc-500">
                  NF {r.nf} · maior diverg. {fmtPct(maiorSeveridade(r))}
                </div>
              </button>
            ))}
          </div>
        </Card>

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
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Dossiê de recebimento</div>
            <h2 className="text-xl font-bold text-zinc-50">
              {romaneio.fornecedor} <span className="font-mono text-lg text-zinc-400">· NF {romaneio.nf}</span>
            </h2>
            <div className="font-mono text-xs text-zinc-500">
              {romaneio.id} · Container {romaneio.codigoContainer || '—'} · Recebido {fmtData(romaneio.dataChegada)} · Conferente {romaneio.conferenteLogistica || '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={romaneio.status} />
            <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
              <Mail size={14} /> Comparativo p/ fornecedor
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 px-5 py-4 lg:grid-cols-4">
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
                  <span className="font-semibold text-zinc-100">{laudo.auditor}</span>
                  <StatusBadge status={laudo.decisao} />
                </div>
                <p className="whitespace-pre-wrap text-zinc-300">{laudo.parecer}</p>
                {laudo.observacaoTecnica && <p className="text-xs text-zinc-500">Obs. técnica: {laudo.observacaoTecnica}</p>}
                <p className="text-xs text-zinc-500">Emitido em {fmtData(laudo.data)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {romaneio.fardos
                    .filter((f) => f.reinspecionadoQualidade)
                    .map((f) => (
                      <span key={f.id} className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-300">
                        #{f.numeroFardo} · <span className={f.status === 'Liberado' ? 'text-emerald-400' : f.status === 'Reprovado' ? 'text-red-400' : 'text-orange-300'}>{f.status}</span>
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-zinc-500">Carga enviada direto pela Logística: todos os fardos abaixo de {LIMITE_SEVERIDADE}%. Sem perícia técnica.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Observações da Logística" icon={<Truck size={18} />} />
          <div className="space-y-2 p-5 text-sm">
            {obsLogistica.length === 0 && <p className="text-zinc-500">Nenhuma observação registrada nos fardos.</p>}
            {obsLogistica.map((f) => {
              const a = analisarFardo(f, romaneio.items.find((i) => i.id === f.produtoId));
              return (
                <div key={f.id} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                  <div className="flex justify-between font-mono text-[11px] text-zinc-500">
                    <span>Fardo #{f.numeroFardo}</span>
                    <span className={a.critico ? 'text-red-400' : 'text-amber-300'}>{fmtPct(a.severidade)}</span>
                  </div>
                  <div className="text-zinc-300">{f.observacao}</div>
                </div>
              );
            })}
            {romaneio.observacao && <p className="text-xs text-zinc-500">Obs. do romaneio: {romaneio.observacao}</p>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Deliberação do Administrador" icon={<Gavel size={18} />} />
        <div className="space-y-4 p-5">
          <Field label="Notas do Administrador" hint="Obrigatório para devoluções.">
            <textarea rows={3} className={inputCls} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Justificativa da decisão, orientações para recontagem ou reinspeção…" />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => agir('devolverLogistica')}>
              <RotateCcw size={15} /> Devolver para Logística (Recontagem)
            </Button>
            <Button variant="warning" onClick={() => agir('devolverQualidade')}>
              <Microscope size={15} /> Devolver para Qualidade (Reinspeção)
            </Button>
            <Button variant="success" onClick={() => agir('aprovar')}>
              <PackageCheck size={15} /> Aprovar Entrada e Liberar para Estoque
            </Button>
          </div>
        </div>
      </Card>

      {emailOpen && <ComparativoFornecedorModal romaneio={romaneio} onClose={() => setEmailOpen(false)} />}
    </div>
  );
}

function Stat({ label, value, delta, casas = 0 }: { label: string; value: string; delta?: number; casas?: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="font-mono text-lg font-bold text-zinc-100">{value}</div>
      {delta !== undefined && (
        <div className={cx('font-mono text-xs', delta < -0.0005 ? 'text-red-400' : delta > 0.0005 ? 'text-emerald-400' : 'text-zinc-500')}>
          {delta > 0.0005 ? '+' : ''}
          {fmtNum(delta, casas)}
        </div>
      )}
    </div>
  );
}
