import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
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
import { Badge, Button, Card, cx, EmptyState, Field, inputCls, Modal, numCls, PageHeader, StatusBadge, Tabs, useToast } from '../components/ui';
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
      <PageHeader title="Logística · Fichas Cegas & Pátio" subtitle="Conferência física às cegas das cargas recebidas no pátio." />

      <div className="mb-6 grid gap-2 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 sm:grid-cols-3">
        {[
          ['1', 'Aguardando Caminhão', 'Romaneio emitido pelo Admin. Imprima a folha cega para a prancheta.'],
          ['2', 'Conferência no pátio', 'Conte os fardos, colete amostras e meça as variações em mm.'],
          ['3', 'Roteamento automático', `Qualquer fardo ≥ ${LIMITE_SEVERIDADE}% → Qualidade. Todos < ${LIMITE_SEVERIDADE}% → Admin.`],
        ].map(([n, t, d], i) => (
          <div key={n} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">{n}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-teal-100">{t}</div>
              <div className="text-xs text-zinc-400">{d}</div>
            </div>
            {i < 2 && <ArrowRight size={16} className="mt-1.5 hidden text-teal-500/60 sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <div className="space-y-3 border-b border-zinc-800 p-4">
            <Tabs
              value={aba}
              onChange={(v) => {
                setAba(v);
                setSelId(undefined);
              }}
              options={[
                { value: 'aguardando', label: `Aguardando Caminhão (${store.romaneios.filter((r) => !foiEnviada(r)).length})` },
                { value: 'enviadas', label: `Enviadas (${store.romaneios.filter(foiEnviada).length})` },
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
                    className={cx('rounded-full border px-2.5 py-1 text-[11px] font-medium', sub === k ? 'border-teal-500/60 bg-teal-500/15 text-teal-200' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200')}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className={cx(inputCls, 'pl-8 text-xs')} placeholder="Buscar NF, fornecedor, container…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="max-h-[640px] divide-y divide-zinc-800/70 overflow-y-auto">
            {fila.length === 0 && <EmptyState icon={<Truck size={20} />} title={aba === 'aguardando' ? 'Nenhum caminhão aguardando' : 'Nenhuma ficha enviada'} />}
            {fila.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelId(r.id)}
                className={cx('block w-full border-l-2 px-4 py-3 text-left transition', sel?.id === r.id ? 'border-l-teal-400 bg-teal-500/10' : 'border-l-transparent hover:bg-zinc-800/40')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-100">{r.fornecedor}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-zinc-500">
                  <span>NF {r.nf}</span>
                  <span>{r.codigoContainer || 'sem container'}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">{foiEnviada(r) ? `Enviada ${fmtData(r.dataEnvioLogistica)}` : `Previsto ${fmtData(r.dataPrevista)} · ${r.local}`}</div>
              </button>
            ))}
          </div>
        </Card>

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
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-50">Ficha Cega</h2>
              <StatusBadge status={romaneio.status} />
            </div>
            <div className="font-mono text-xs text-zinc-500">{romaneio.id}</div>
          </div>
          <Button variant="outline" onClick={() => setFolhaOpen(true)}>
            <Printer size={15} /> Imprimir Folha Cega
          </Button>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Fornecedor" value={romaneio.fornecedor} />
          <Meta label="Nota Fiscal" value={romaneio.nf} mono />
          <Meta label="Tipo de madeira" value={romaneio.tipoMadeira} />
          <div className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
              <Lock size={10} /> Container · origem romaneio
            </div>
            <div className="font-mono text-sm font-bold text-teal-50">{romaneio.codigoContainer || 'Não informado'}</div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-zinc-800 px-5 py-4 sm:grid-cols-2">
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
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
            critico ? 'border-red-500/50 bg-red-500/10 text-red-100' : 'border-teal-500/40 bg-teal-500/10 text-teal-100',
          )}
        >
          {critico ? <AlertOctagon size={18} className="mt-0.5 shrink-0 text-red-400" /> : <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal-300" />}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Fardos físicos</h3>
            <p className="text-xs text-zinc-500">
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
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-500">
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
            <tbody className="divide-y divide-zinc-800/70">
              {fardos.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-zinc-500">
                    Nenhum fardo conferido ainda. {editavel && 'Clique em “Adicionar fardo” para começar.'}
                  </td>
                </tr>
              )}
              {fardos.map((f, idx) => {
                const a = analises[idx];
                return (
                  <tr key={f.id} className={cx(a.critico && 'bg-red-500/5')}>
                    <td className="px-3 py-2">
                      <input disabled={!editavel} className={cx(numCls, 'w-14 text-center')} value={f.numeroFardo} onChange={(e) => upd(f.id, { numeroFardo: e.target.value })} />
                    </td>
                    <td className="px-2 py-2">
                      <select disabled={!editavel} className={cx(inputCls, 'py-1.5 text-xs')} value={f.produtoId} onChange={(e) => upd(f.id, { produtoId: e.target.value })}>
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
                      <div className={cx('font-bold', a.pctPecas >= LIMITE_SEVERIDADE ? 'text-red-400' : a.pctPecas > 0 ? 'text-amber-300' : 'text-zinc-400')}>{fmtPct(a.pctPecas)}</div>
                      <div className={cx(a.pctM3 >= LIMITE_SEVERIDADE ? 'text-red-400' : a.pctM3 > 0 ? 'text-amber-300/80' : 'text-zinc-600')}>{fmtPct(a.pctM3)}</div>
                    </td>
                    <td className="px-2 py-2">
                      {a.critico ? (
                        <Badge className="border-red-500/50 bg-red-500/15 text-red-300">Qualidade</Badge>
                      ) : (
                        <Badge className="border-teal-500/40 bg-teal-500/10 text-teal-300">Admin</Badge>
                      )}
                    </td>
                    {editavel && (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => duplicar(f)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" title="Duplicar fardo">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => setFardos((fs) => fs.filter((x) => x.id !== f.id))} className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400" title="Remover fardo">
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
        <div className="flex justify-end">
          <Button size="lg" onClick={finalizar} className="w-full sm:w-auto">
            <Send size={16} /> Finalizar Conferência e Enviar Ficha Cega
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-400">
          <CheckCircle2 size={15} className="text-emerald-400" />
          Ficha enviada em {fmtData(romaneio.dataEnvioLogistica)} por {romaneio.conferenteLogistica || '—'}. Somente leitura.
        </div>
      )}

      <FolhaCegaModal open={folhaOpen} onClose={() => setFolhaOpen(false)} romaneio={romaneio} />
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cx('text-sm font-semibold text-zinc-100', mono && 'font-mono')}>{value}</div>
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
        className={cx(numCls, warn && 'border-red-500 text-red-300', signed && v > 0 && 'text-amber-300', signed && v < 0 && 'text-sky-300')}
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
      title="Folha Cega · Prancheta de Pátio"
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
