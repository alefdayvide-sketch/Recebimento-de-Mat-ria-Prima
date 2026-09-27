import {
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  GitFork,
  Copy,
  Lock,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ART, ContainerArt, TruckArt } from '../components/Art';
import { ActionButton, Badge, Button, Card, cx, EmptyState, Field, inputCls, Modal, numCls, PageHeader, QueueItem, selectSmCls, StatusBadge, Steps, Tabs, useToast } from '../components/ui';
import { analisarFardo, exigeQualidade, LIMITE_SEVERIDADE, uid } from '../lib/calc';
import { agoraISO, fmtData, fmtNum, fmtPct } from '../lib/format';
import type { FardoRecebido, Romaneio } from '../types';
import type { ModuleProps } from './shared';

type Aba = 'aguardando' | 'enviadas';
type SubFiltro = 'todas' | 'qualidade' | 'admin' | 'finalizadas';

const foiEnviada = (r: Romaneio) => r.status !== 'Aguardando Caminhão' && r.status !== 'Ag. Recebimento' && r.status !== 'Em Recebimento';

export function Logistica({ store, nav }: ModuleProps) {
  const inicial = store.romaneios.find((r) => r.id === nav.selectedId);
  const [aba, setAba] = useState<Aba>(inicial && foiEnviada(inicial) ? 'enviadas' : 'aguardando');
  const [sub, setSub] = useState<SubFiltro>('todas');
  const [busca, setBusca] = useState('');
  const [selId, setSelId] = useState<string | undefined>(nav.selectedId);

  const fila = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return store.romaneios
      .filter((r) => (aba === 'aguardando' ? !foiEnviada(r) : foiEnviada(r)))
      .filter((r) => {
        if (aba === 'aguardando' || sub === 'todas') return true;
        if (sub === 'qualidade') return r.status === 'Ag. Qualidade';
        if (sub === 'admin') return r.status === 'Ag. Aprovação Admin';
        return r.status === 'Finalizado' || r.status === 'Reprovado';
      })
      .filter((r) => !q || [r.nf, r.fornecedor, r.codigoContainer ?? '', r.id].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => (aba === 'aguardando' ? a.dataPrevista.localeCompare(b.dataPrevista) : (b.dataEnvioLogistica ?? '').localeCompare(a.dataEnvioLogistica ?? '')));
  }, [store.romaneios, aba, sub, busca]);

  const sel = store.romaneios.find((r) => r.id === selId) ?? fila[0];

  return (
    <div>
      <PageHeader eyebrow="Logística" title="Fichas cegas & pátio" subtitle="Conferência física às cegas das cargas que chegam ao pátio." />

      <div className="mb-6">
        <Steps
          tone="teal"
          items={[
            { icon: <FileSpreadsheet size={19} />, title: 'Romaneio emitido', text: 'O Admin cadastra a carga. Imprima a folha cega para a prancheta.' },
            { icon: <ClipboardList size={19} />, title: 'Conferência no pátio', text: 'Conte os fardos, colete amostras e meça as variações em mm.' },
            { icon: <GitFork size={19} />, title: 'Roteamento automático', text: `Algum fardo ≥ ${LIMITE_SEVERIDADE}% vai para a Qualidade. Todos abaixo vão ao Admin.` },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="flex h-fit flex-col gap-3 rounded-3xl bg-canvas p-3">
          <Tabs
            value={aba}
            onChange={(v) => {
              setAba(v);
              setSelId(undefined);
            }}
            options={[
              { value: 'aguardando', label: `Aguardando caminhão · ${store.romaneios.filter((r) => !foiEnviada(r)).length}` },
              { value: 'enviadas', label: `Enviadas · ${store.romaneios.filter(foiEnviada).length}` },
            ]}
          />
          {aba === 'enviadas' && (
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['todas', 'Todas'],
                  ['qualidade', 'Na Qualidade'],
                  ['admin', 'No Admin'],
                  ['finalizadas', 'Finalizadas'],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSub(k)}
                  className={cx('rounded-full px-3 py-1.5 text-xs font-bold', sub === k ? 'bg-teal-700 text-white' : 'bg-white text-muted hover:text-ink')}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className={cx(inputCls, 'pl-9')} placeholder="Buscar NF, fornecedor, container" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex max-h-[640px] flex-col gap-1 overflow-y-auto">
            {fila.length === 0 && <EmptyState icon={<Truck size={20} />} title={aba === 'aguardando' ? 'Nenhum caminhão aguardando' : 'Nenhuma ficha enviada'} />}
            {fila.map((r) => (
              <QueueItem
                key={r.id}
                active={sel?.id === r.id}
                tone={foiEnviada(r) ? (r.status === 'Ag. Qualidade' ? 'rose' : r.status === 'Ag. Aprovação Admin' ? 'amber' : 'emerald') : 'teal'}
                art={foiEnviada(r) ? <ContainerArt p={r.status === 'Ag. Qualidade' ? ART.rose : r.status === 'Ag. Aprovação Admin' ? ART.amber : ART.emerald} width={40} /> : <Truck size={22} />}
                title={r.fornecedor}
                aside={foiEnviada(r) ? <StatusBadge status={r.status} /> : undefined}
                lines={[`NF ${r.nf} · ${r.codigoContainer || 'Carga solta'}`, foiEnviada(r) ? `Enviada ${fmtData(r.dataEnvioLogistica)}` : `Previsto ${fmtData(r.dataPrevista)}`]}
                onClick={() => setSelId(r.id)}
              />
            ))}
          </div>
        </div>

        {sel ? (
          <FichaCegaWorkspace key={sel.id} romaneio={sel} store={store} onEnviada={() => setSelId(undefined)} />
        ) : (
          <Card>
            <EmptyState icon={<ClipboardList size={20} />} title="Selecione uma ficha cega" text="Escolha uma carga na fila ao lado para iniciar a conferência." />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ───────── Área de trabalho da Ficha Cega ───────── */

function FichaCegaWorkspace({ romaneio, store, onEnviada }: { romaneio: Romaneio; store: ModuleProps['store']; onEnviada: () => void }) {
  const toast = useToast();
  const editavel = !foiEnviada(romaneio);
  const [dataChegada, setDataChegada] = useState(romaneio.dataChegada ?? agoraISO());
  const [conferente, setConferente] = useState(romaneio.conferenteLogistica ?? '');
  const [fardos, setFardos] = useState<FardoRecebido[]>(romaneio.fardos);
  const [folhaOpen, setFolhaOpen] = useState(false);

  const itemMap = useMemo(() => new Map(romaneio.items.map((i) => [i.id, i])), [romaneio.items]);
  const analises = fardos.map((f) => analisarFardo(f, itemMap.get(f.produtoId)));
  const critico = exigeQualidade({ ...romaneio, fardos });
  const qtdCriticos = analises.filter((a) => a.critico).length;

  const novoFardo = (): FardoRecebido => {
    const item = romaneio.items[0];
    return {
      id: uid('fd'),
      numeroFardo: String(fardos.length + 1).padStart(2, '0'),
      produtoId: item?.id ?? '',
      quantidadeRecebida: item?.pecasPorFardo ?? 0,
      amostraColetada: 20,
      quantidadeDivergente: 0,
      v_espessura: 0,
      v_largura: 0,
      v_comprimento: 0,
      observacao: '',
      status: 'OK',
      percentualDivergencia: 0,
    };
  };

  const upd = (id: string, patch: Partial<FardoRecebido>) => setFardos((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const duplicar = (f: FardoRecebido) =>
    setFardos((fs) => {
      const idx = fs.findIndex((x) => x.id === f.id);
      const copia = { ...f, id: uid('fd'), numeroFardo: String(fs.length + 1).padStart(2, '0') };
      return [...fs.slice(0, idx + 1), copia, ...fs.slice(idx + 1)];
    });

  const finalizar = () => {
    if (!dataChegada) return toast('Informe a data de recebimento no pátio.', 'warn');
    if (!conferente.trim()) return toast('Informe o conferente responsável.', 'warn');
    if (fardos.length === 0) return toast('Adicione ao menos um fardo conferido.', 'warn');
    const invalido = fardos.find((f) => f.quantidadeRecebida <= 0 || f.quantidadeDivergente > f.amostraColetada || f.amostraColetada > f.quantidadeRecebida || !f.produtoId);
    if (invalido)
      return toast(`Fardo ${invalido.numeroFardo}: verifique produto, quantidade recebida e amostra (divergentes ≤ amostra ≤ recebidas).`, 'err');
    const destino = store.finalizarConferencia(romaneio.id, { dataChegada, conferenteLogistica: conferente.trim(), fardos });
    toast(
      destino === 'Ag. Qualidade' ? `Ficha enviada. Carga RETIDA para a Qualidade (fardo ≥ ${LIMITE_SEVERIDADE}%).` : 'Ficha enviada. Carga seguiu direto para aprovação do Administrador.',
      destino === 'Ag. Qualidade' ? 'warn' : 'ok',
    );
    onEnviada();
  };

  const totalRecebido = fardos.reduce((s, f) => s + f.quantidadeRecebida, 0);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch">
          <div className="flex shrink-0 items-end justify-center rounded-2xl px-4 pt-6 lg:w-[300px]" style={{ background: ART.teal.bg }}>
            <TruckArt p={ART.teal} code={romaneio.codigoContainer && romaneio.codigoContainer !== 'Carga solta' ? romaneio.codigoContainer : undefined} width={270} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-ink">{romaneio.fornecedor}</h2>
                  <StatusBadge status={romaneio.status} />
                </div>
                <div className="font-mono text-xs text-muted">Ficha cega · {romaneio.id}</div>
              </div>
              <ActionButton tone="light" icon={<Printer size={19} />} title="Folha cega" subtitle="Imprimir prancheta" onClick={() => setFolhaOpen(true)} />
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Meta label="Nota fiscal" value={romaneio.nf} mono />
              <Meta label="Madeira" value={romaneio.tipoMadeira} />
              <Meta label="Local" value={romaneio.local} />
              <div className="rounded-xl bg-teal-50 px-3 py-2.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-teal-800">
                  <Lock size={11} /> Container (do romaneio)
                </div>
                <div className="truncate font-mono text-sm font-medium text-teal-900">{romaneio.codigoContainer || 'Não informado'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2">
          <Field label="Data de recebimento no pátio">
            <input type="datetime-local" disabled={!editavel} className={inputCls} value={dataChegada} onChange={(e) => setDataChegada(e.target.value)} />
          </Field>
          <Field label="Conferente logístico responsável">
            <input disabled={!editavel} className={inputCls} value={conferente} onChange={(e) => setConferente(e.target.value)} placeholder="Nome do conferente" />
          </Field>
        </div>
      </Card>

      {fardos.length > 0 && (
        <div
          className={cx(
            'flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm',
            critico ? 'bg-rose-50 text-rose-900' : 'bg-teal-50 text-teal-900',
          )}
        >
          <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white', critico ? 'bg-rose-700' : 'bg-teal-700')}>{critico ? <AlertOctagon size={20} /> : <ShieldCheck size={20} />}</span>
          <div>
            <div className="font-semibold">
              {editavel ? (critico ? 'Esta carga seguirá para a QUALIDADE' : 'Esta carga seguirá direto para o ADMINISTRADOR') : critico ? 'Carga retida para a Qualidade' : 'Carga enviada ao Administrador'}
            </div>
            <div className="text-xs opacity-80">
              {critico
                ? `${qtdCriticos} fardo(s) com divergência ≥ ${LIMITE_SEVERIDADE}%. A carga será retida para perícia técnica.`
                : `Todos os fardos abaixo de ${LIMITE_SEVERIDADE}% de divergência.`}
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">Fardos físicos</h3>
            <p className="text-xs text-muted">
              {fardos.length} fardo(s) · {fmtNum(totalRecebido)} peças recebidas
            </p>
          </div>
          {editavel && (
            <Button size="sm" onClick={() => setFardos((fs) => [...fs, novoFardo()])} disabled={romaneio.items.length === 0}>
              <Plus size={14} /> Adicionar fardo
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-xs">
            <thead>
              <tr className="border-b border-line bg-canvas/70 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5">Fardo #</th>
                <th className="px-2 py-2.5">Produto nominal</th>
                <th className="px-2 py-2.5 text-right">Qtd recebida</th>
                <th className="px-2 py-2.5 text-right">Amostra (pçs)</th>
                <th className="px-2 py-2.5 text-right">Divergentes</th>
                <th className="px-2 py-2.5 text-right">Δ Esp. (mm)</th>
                <th className="px-2 py-2.5 text-right">Δ Larg. (mm)</th>
                <th className="px-2 py-2.5 text-right">Δ Comp. (mm)</th>
                <th className="px-2 py-2.5 text-right">% Pçs / % m³</th>
                <th className="px-2 py-2.5">Destino</th>
                {editavel && <th className="px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {fardos.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted">
                    Nenhum fardo conferido ainda. {editavel && 'Clique em “Adicionar fardo” para começar.'}
                  </td>
                </tr>
              )}
              {fardos.map((f, idx) => {
                const a = analises[idx];
                return (
                  <tr key={f.id} className={cx(a.critico && 'bg-rose-50/60')}>
                    <td className="px-3 py-2">
                      <input disabled={!editavel} className={cx(numCls, 'w-14 text-center')} value={f.numeroFardo} onChange={(e) => upd(f.id, { numeroFardo: e.target.value })} />
                    </td>
                    <td className="px-2 py-2">
                      <select disabled={!editavel} className={selectSmCls} value={f.produtoId} onChange={(e) => upd(f.id, { produtoId: e.target.value })}>
                        {romaneio.items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.produto} · {i.espessura}×{i.largura}×{i.comprimento}
                          </option>
                        ))}
                      </select>
                    </td>
                    <NumCell v={f.quantidadeRecebida} disabled={!editavel} onChange={(v) => upd(f.id, { quantidadeRecebida: Math.max(0, Math.round(v)) })} />
                    <NumCell v={f.amostraColetada} disabled={!editavel} onChange={(v) => upd(f.id, { amostraColetada: Math.max(0, Math.round(v)) })} />
                    <NumCell v={f.quantidadeDivergente} disabled={!editavel} onChange={(v) => upd(f.id, { quantidadeDivergente: Math.max(0, Math.round(v)) })} warn={f.quantidadeDivergente > f.amostraColetada} />
                    <NumCell v={f.v_espessura} disabled={!editavel} signed onChange={(v) => upd(f.id, { v_espessura: v })} />
                    <NumCell v={f.v_largura} disabled={!editavel} signed onChange={(v) => upd(f.id, { v_largura: v })} />
                    <NumCell v={f.v_comprimento} disabled={!editavel} signed onChange={(v) => upd(f.id, { v_comprimento: v })} />
                    <td className="px-2 py-2 text-right font-mono">
                      <div className={cx('font-bold', a.pctPecas >= LIMITE_SEVERIDADE ? 'text-rose-700' : a.pctPecas > 0 ? 'text-amber-700' : 'text-muted')}>{fmtPct(a.pctPecas)}</div>
                      <div className={cx(a.pctM3 >= LIMITE_SEVERIDADE ? 'text-rose-700' : a.pctM3 > 0 ? 'text-amber-600' : 'text-slate-400')}>{fmtPct(a.pctM3)}</div>
                    </td>
                    <td className="px-2 py-2">
                      {a.critico ? (
                        <Badge className="bg-rose-700 text-white">Qualidade</Badge>
                      ) : (
                        <Badge className="bg-teal-50 text-teal-800">Admin</Badge>
                      )}
                    </td>
                    {editavel && (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => duplicar(f)} className="rounded p-1.5 text-muted hover:bg-canvas hover:text-ink" title="Duplicar fardo">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => setFardos((fs) => fs.filter((x) => x.id !== f.id))} className="rounded p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400" title="Remover fardo">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editavel ? (
        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-line bg-white/95 p-3 pl-5 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[13px] text-ink-soft">
            Ao finalizar, contagens, data e conferente são salvos. Destino:{' '}
            <b className={critico ? 'text-rose-700' : 'text-teal-800'}>{fardos.length === 0 ? '—' : critico ? 'Qualidade' : 'Administrador'}</b>
          </div>
          <Button size="lg" onClick={finalizar} className="w-full sm:w-auto">
            <Send size={17} /> Finalizar conferência e enviar ficha cega
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-[13px] text-ink-soft">
          <CheckCircle2 size={16} className="text-emerald-700" />
          Ficha enviada em {fmtData(romaneio.dataEnvioLogistica)} por {romaneio.conferenteLogistica || '—'}. Somente leitura.
        </div>
      )}

      <FolhaCegaModal open={folhaOpen} onClose={() => setFolhaOpen(false)} romaneio={romaneio} />
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-2.5">
      <div className="text-[11px] font-bold text-muted">{label}</div>
      <div className={cx('truncate text-sm font-semibold text-ink', mono && 'font-mono font-medium')}>{value}</div>
    </div>
  );
}

function NumCell({ v, onChange, disabled, signed, warn }: { v: number; onChange: (v: number) => void; disabled?: boolean; signed?: boolean; warn?: boolean }) {
  const [txt, setTxt] = useState(String(v));
  // mantém texto local para permitir digitar "-" e decimais com vírgula
  const shown = Number(txt.replace(',', '.')) === v ? txt : String(v);
  return (
    <td className="px-2 py-2">
      <input
        disabled={disabled}
        inputMode="decimal"
        className={cx(numCls, warn && 'ring-2 ring-red-300 text-red-700', signed && v > 0 && 'text-amber-700', signed && v < 0 && 'text-sky-700')}
        value={shown}
        onChange={(e) => {
          setTxt(e.target.value);
          const n = Number(e.target.value.replace(',', '.'));
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
    </td>
  );
}

/* ───────── Folha de prancheta (impressão) ───────── */

function FolhaCegaModal({ open, onClose, romaneio }: { open: boolean; onClose: () => void; romaneio: Romaneio }) {
  const linhas = Math.max(15, romaneio.items.reduce((s, i) => s + (i.fardos ?? 0), 0) + 4);
  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-4xl"
      title="Folha cega · prancheta de pátio"
      icon={<Printer size={22} />}
      subtitle="As quantidades nominais de peças e m³ NÃO aparecem nesta folha."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={15} /> Imprimir
          </Button>
        </>
      }
    >
      <div className="print-area mx-auto max-w-[794px] bg-white p-8 text-black shadow-xl" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <div className="text-2xl font-black tracking-[0.2em]">ICOPALLET</div>
            <div className="text-[10px] uppercase tracking-widest">Ficha Cega de Conferência · Recebimento de Matéria-Prima</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase">Protocolo</div>
            <div className="font-mono text-sm font-bold">{romaneio.id}</div>
          </div>
        </div>
        <table className="mt-4 w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="w-1/4 border border-black px-2 py-1.5 font-bold">Fornecedor</td>
              <td className="border border-black px-2 py-1.5">{romaneio.fornecedor}</td>
              <td className="w-1/4 border border-black px-2 py-1.5 font-bold">Nota Fiscal</td>
              <td className="border border-black px-2 py-1.5 font-mono">{romaneio.nf}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">Container</td>
              <td className="border border-black px-2 py-1.5 font-mono">{romaneio.codigoContainer || 'Não informado'}</td>
              <td className="border border-black px-2 py-1.5 font-bold">Madeira / Local</td>
              <td className="border border-black px-2 py-1.5">
                {romaneio.tipoMadeira} · {romaneio.local}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">Data / hora chegada</td>
              <td className="border border-black px-2 py-1.5">____/____/______ ____:____</td>
              <td className="border border-black px-2 py-1.5 font-bold">Conferente</td>
              <td className="border border-black px-2 py-1.5" />
            </tr>
          </tbody>
        </table>

        <div className="mt-4 text-[10px] font-bold uppercase">Produtos esperados (sem quantidades)</div>
        <ul className="mt-1 text-[11px]">
          {romaneio.items.map((i) => (
            <li key={i.id}>
              • {i.produto} — nominal {i.espessura} × {i.largura} × {i.comprimento} mm
            </li>
          ))}
        </ul>

        <table className="mt-4 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-200">
              {['Fardo #', 'Produto', 'Qtd peças', 'Amostra', 'Diverg.', 'Δ Esp.', 'Δ Larg.', 'Δ Comp.', 'Observação'].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1.5 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: linhas }).map((_, i) => (
              <tr key={i}>
                <td className="h-7 border border-black px-1.5 font-mono text-gray-400">{String(i + 1).padStart(2, '0')}</td>
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="border border-black" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 grid grid-cols-2 gap-10 text-center text-[10px]">
          <div className="border-t border-black pt-1">Assinatura do conferente</div>
          <div className="border-t border-black pt-1">Assinatura do motorista</div>
        </div>
      </div>
    </Modal>
  );
}
