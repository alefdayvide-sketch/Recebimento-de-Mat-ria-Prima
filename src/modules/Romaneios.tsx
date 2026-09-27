import { ClipboardCopy, FileSpreadsheet, Plus, Scale, Search, Trash2, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ART, artDoStatus, ContainerArt, TruckArt } from '../components/Art';
import { ActionButton, Button, Card, cx, EmptyState, Field, inputCls, Modal, PageHeader, StatusBadge, useToast } from '../components/ui';
import { calcM3, gerarIdRomaneio, totaisRomaneio, uid } from '../lib/calc';
import { copiarTexto, fmtData, fmtM3, fmtNum, hoje } from '../lib/format';
import { FORNECEDORES, LOCAIS, TIPOS_MADEIRA } from '../lib/mock';
import type { Romaneio, RomaneioItem } from '../types';
import { textoEmailFornecedor, type ModuleProps } from './shared';

export function Romaneios({ store, nav }: ModuleProps) {
  const [busca, setBusca] = useState('');
  const [novoOpen, setNovoOpen] = useState(nav.selectedId === 'novo');
  const [comparar, setComparar] = useState<Romaneio | null>(null);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return store.romaneios.filter(
      (r) => !q || r.nf.toLowerCase().includes(q) || r.fornecedor.toLowerCase().includes(q) || (r.codigoContainer ?? '').toLowerCase().includes(q) || r.id.toLowerCase().includes(q),
    );
  }, [store.romaneios, busca]);

  return (
    <div>
      <PageHeader
        eyebrow="Administrador"
        title="Romaneios"
        subtitle="Cadastro dos romaneios de compra com medidas nominais e m³ do fornecedor."
        actions={<ActionButton icon={<Plus size={20} strokeWidth={2.5} />} title="Emitir romaneio" subtitle="Gera a ficha cega" onClick={() => setNovoOpen(true)} />}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div className="relative w-full max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className={cx(inputCls, 'pl-9')} placeholder="Buscar por NF, fornecedor ou container…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-muted">{lista.length} romaneio(s)</span>
        </div>

        {lista.length === 0 ? (
          <EmptyState icon={<FileSpreadsheet size={20} />} title="Nenhum romaneio encontrado" text="Ajuste a busca ou emita um novo romaneio." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/70 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Protocolo / Fornecedor</th>
                  <th className="px-3 py-3 font-semibold">NF</th>
                  <th className="px-3 py-3 font-semibold">Container</th>
                  <th className="px-3 py-3 font-semibold">Previsto</th>
                  <th className="px-3 py-3 text-right font-semibold">m³ Fornecedor</th>
                  <th className="px-3 py-3 text-right font-semibold">m³ Icopallet</th>
                  <th className="px-3 py-3 text-right font-semibold">Diferença</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lista.map((r) => {
                  const t = totaisRomaneio(r);
                  const icopallet = t.conferido ? t.m3Corrigido : t.m3Calculado;
                  const dif = icopallet - t.m3Fornecedor;
                  return (
                    <tr key={r.id} className="hover:bg-canvas">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: artDoStatus(r.status).bg }}>
                            <ContainerArt p={artDoStatus(r.status)} width={34} />
                          </span>
                          <div>
                            <div className="font-display font-bold text-ink">{r.fornecedor}</div>
                            <div className="font-mono text-[11px] text-muted">{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-soft">{r.nf}</td>
                      <td className="px-3 py-3 font-mono text-xs text-ink-soft">{r.codigoContainer || '—'}</td>
                      <td className="px-3 py-3 text-muted">{fmtData(r.dataPrevista)}</td>
                      <td className="px-3 py-3 text-right font-mono text-ink-soft">{fmtM3(t.m3Fornecedor)}</td>
                      <td className="px-3 py-3 text-right font-mono text-ink">
                        {fmtM3(icopallet)}
                        <div className="text-[10px] text-muted">{t.conferido ? 'conferido' : 'nominal'}</div>
                      </td>
                      <td className={cx('px-3 py-3 text-right font-mono font-semibold', dif < -0.0005 ? 'text-rose-700' : dif > 0.0005 ? 'text-emerald-700' : 'text-muted')}>
                        {dif > 0 ? '+' : ''}
                        {fmtNum(dif, 3)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setComparar(r)} title="Comparativo com fornecedor">
                            <Scale size={14} /> Comparar
                          </Button>
                          {r.status === 'Aguardando Caminhão' && (
                            <Button size="sm" variant="ghost" onClick={() => nav.abrir('logistica', r.id)} title="Abrir ficha cega">
                              <Truck size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NovoRomaneioModal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        existentes={store.romaneios}
        onSave={(r, abrirFicha) => {
          store.emitirRomaneio(r);
          setNovoOpen(false);
          if (abrirFicha) nav.abrir('logistica', r.id);
        }}
      />
      <ComparativoFornecedorModal romaneio={comparar} onClose={() => setComparar(null)} />
    </div>
  );
}

/* ───────── Modal: Emitir novo romaneio ───────── */

const itemVazio = { produto: '', espessura: '', largura: '', comprimento: '', quantidade: '', m3Fornecedor: '' };

function NovoRomaneioModal({
  open,
  onClose,
  onSave,
  existentes,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (r: Romaneio, abrirFicha: boolean) => void;
  existentes: Romaneio[];
}) {
  const toast = useToast();
  const [cab, setCab] = useState({ fornecedor: FORNECEDORES[0], nf: '', dataPrevista: hoje(), tipoMadeira: TIPOS_MADEIRA[0], local: LOCAIS[0], codigoContainer: '', observacao: '' });
  const [novo, setNovo] = useState(itemVazio);
  const [items, setItems] = useState<RomaneioItem[]>([]);

  const reset = () => {
    setCab({ fornecedor: FORNECEDORES[0], nf: '', dataPrevista: hoje(), tipoMadeira: TIPOS_MADEIRA[0], local: LOCAIS[0], codigoContainer: '', observacao: '' });
    setNovo(itemVazio);
    setItems([]);
  };

  const num = (v: string) => Number(String(v).replace(',', '.')) || 0;
  const previewM3 = calcM3(num(novo.espessura), num(novo.largura), num(novo.comprimento), num(novo.quantidade));

  const adicionar = () => {
    const e = num(novo.espessura),
      l = num(novo.largura),
      c = num(novo.comprimento),
      q = num(novo.quantidade);
    if (!novo.produto.trim() || !e || !l || !c || !q) {
      toast('Preencha descrição, dimensões e quantidade do item.', 'warn');
      return;
    }
    const m3Calculado = calcM3(e, l, c, q);
    setItems((it) => [
      ...it,
      { id: uid('it'), produto: novo.produto.trim(), espessura: e, largura: l, comprimento: c, quantidade: q, m3Calculado, m3Fornecedor: novo.m3Fornecedor ? num(novo.m3Fornecedor) : m3Calculado },
    ]);
    setNovo(itemVazio);
  };

  const salvar = (abrirFicha: boolean) => {
    if (!cab.nf.trim()) return toast('Informe a Nota Fiscal.', 'warn');
    if (!cab.dataPrevista) return toast('Informe a data prevista.', 'warn');
    if (items.length === 0) return toast('Adicione ao menos um item ao romaneio.', 'warn');
    const r: Romaneio = {
      id: gerarIdRomaneio(cab.fornecedor, cab.nf, cab.dataPrevista, existentes),
      nf: cab.nf.trim(),
      fornecedor: cab.fornecedor,
      dataPrevista: cab.dataPrevista,
      tipoMadeira: cab.tipoMadeira,
      local: cab.local,
      observacao: cab.observacao,
      codigoContainer: cab.codigoContainer.trim() || undefined,
      status: 'Aguardando Caminhão',
      items,
      fardos: [],
      createdAt: Date.now(),
      fichaCegaGenerated: true,
    };
    onSave(r, abrirFicha);
    toast(`Romaneio ${r.id} emitido. Ficha cega enviada à Logística.`);
    reset();
  };

  const totCalc = items.reduce((s, i) => s + i.m3Calculado, 0);
  const totForn = items.reduce((s, i) => s + i.m3Fornecedor, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-5xl"
      title="Emitir novo romaneio"
      icon={<FileSpreadsheet size={22} />}
      subtitle="Ao salvar, uma Ficha Cega é gerada automaticamente na fila da Logística com status “Aguardando Caminhão”."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => salvar(true)}>
            <Truck size={16} /> Salvar e abrir ficha cega
          </Button>
          <Button onClick={() => salvar(false)}>
            <FileSpreadsheet size={16} /> Salvar romaneio e emitir ficha cega
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Fornecedor">
          <select className={inputCls} value={cab.fornecedor} onChange={(e) => setCab({ ...cab, fornecedor: e.target.value })}>
            {FORNECEDORES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Nota Fiscal (NF)">
          <input className={inputCls} value={cab.nf} onChange={(e) => setCab({ ...cab, nf: e.target.value })} placeholder="Ex: 48213" />
        </Field>
        <Field label="Data prevista">
          <input type="date" className={inputCls} value={cab.dataPrevista} onChange={(e) => setCab({ ...cab, dataPrevista: e.target.value })} />
        </Field>
        <Field label="Tipo de madeira">
          <select className={inputCls} value={cab.tipoMadeira} onChange={(e) => setCab({ ...cab, tipoMadeira: e.target.value })}>
            {TIPOS_MADEIRA.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Local de descarga">
          <select className={inputCls} value={cab.local} onChange={(e) => setCab({ ...cab, local: e.target.value })}>
            {LOCAIS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Código do container (opcional)" hint="Deixe vazio ou escreva “Carga solta”.">
          <input className={cx(inputCls, 'font-mono')} value={cab.codigoContainer} onChange={(e) => setCab({ ...cab, codigoContainer: e.target.value })} placeholder="MSKU 000000-0" />
        </Field>
        <Field label="Observações" className="sm:col-span-2">
          <input className={inputCls} value={cab.observacao} onChange={(e) => setCab({ ...cab, observacao: e.target.value })} placeholder="Informações para a equipe de pátio" />
        </Field>
      </div>

      <div className="mt-6 rounded-2xl bg-canvas p-4">
        <div className="mb-3 font-display text-sm font-bold text-ink">Adicionar item</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          <Field label="Descrição do produto" className="col-span-2">
            <input className={inputCls} value={novo.produto} onChange={(e) => setNovo({ ...novo, produto: e.target.value })} placeholder="Tábua Pinus Bruta" />
          </Field>
          {(
            [
              ['espessura', 'Espessura (mm)'],
              ['largura', 'Largura (mm)'],
              ['comprimento', 'Comprimento (mm)'],
              ['quantidade', 'Qtd. peças'],
              ['m3Fornecedor', 'm³ NF fornecedor'],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                inputMode="decimal"
                className={cx(inputCls, 'font-mono')}
                value={novo[k]}
                onChange={(e) => setNovo({ ...novo, [k]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && adicionar()}
                placeholder={k === 'm3Fornecedor' && previewM3 ? previewM3.toFixed(3) : '0'}
              />
            </Field>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            m³ calculado: <span className="font-mono text-ink-soft">{fmtM3(previewM3, 4)}</span>
          </span>
          <Button size="sm" onClick={adicionar}>
            <Plus size={14} /> Adicionar item
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5">Produto</th>
              <th className="px-3 py-2.5 text-right">E × L × C (mm)</th>
              <th className="px-3 py-2.5 text-right">Peças</th>
              <th className="px-3 py-2.5 text-right">m³ Calculado</th>
              <th className="px-3 py-2.5 text-right">m³ Fornecedor</th>
              <th className="px-3 py-2.5 text-right">Diferença</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted">
                  Nenhum item adicionado.
                </td>
              </tr>
            )}
            {items.map((i) => {
              const dif = i.m3Calculado - i.m3Fornecedor;
              return (
                <tr key={i.id}>
                  <td className="px-4 py-2.5 text-ink">{i.produto}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink-soft">
                    {i.espessura} × {i.largura} × {i.comprimento}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmtNum(i.quantidade)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink">{fmtNum(i.m3Calculado, 3)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmtNum(i.m3Fornecedor, 3)}</td>
                  <td className={cx('px-3 py-2.5 text-right font-mono', dif < -0.0005 ? 'text-rose-700' : dif > 0.0005 ? 'text-emerald-700' : 'text-muted')}>
                    {dif > 0 ? '+' : ''}
                    {fmtNum(dif, 3)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setItems((it) => it.filter((x) => x.id !== i.id))} className="rounded p-1 text-muted hover:bg-red-500/10 hover:text-red-400" title="Remover item">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t border-line bg-canvas font-semibold">
                <td className="px-4 py-2.5 text-ink-soft" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtNum(items.reduce((s, i) => s + i.quantidade, 0))}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtNum(totCalc, 3)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtNum(totForn, 3)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtNum(totCalc - totForn, 3)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Modal>
  );
}

/* ───────── Modal: Comparativo com fornecedor ───────── */

export function ComparativoFornecedorModal({ romaneio, onClose }: { romaneio: Romaneio | null; onClose: () => void }) {
  const toast = useToast();
  if (!romaneio) return null;
  const t = totaisRomaneio(romaneio);
  const texto = textoEmailFornecedor(romaneio);

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-3xl"
      title="Comparativo com o fornecedor"
      icon={<Scale size={22} />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={async () => {
              const ok = await copiarTexto(texto);
              toast(ok ? 'Texto copiado. Cole no e-mail ao fornecedor.' : 'Não foi possível copiar automaticamente. Selecione o texto manualmente.', ok ? 'ok' : 'warn');
            }}
          >
            <ClipboardCopy size={15} /> Copiar para e-mail
          </Button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-5 rounded-2xl bg-vinho-50 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-vinho">Fornecedor</div>
          <div className="font-display text-3xl font-extrabold text-ink">{romaneio.fornecedor}</div>
          <div className="mt-1 font-mono text-xl font-medium text-vinho">NF {romaneio.nf}</div>
          <div className="mt-2 font-mono text-xs text-muted">
            {romaneio.id} · {romaneio.codigoContainer || 'sem container'}
          </div>
        </div>
        <div className="hidden sm:block">
          <TruckArt p={ART.vinho} width={200} />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['m³ NF', fmtM3(t.m3Fornecedor)],
          ['m³ conferido', t.conferido ? fmtM3(t.m3Corrigido) : '—'],
          ['Peças NF', fmtNum(t.pecasRomaneio)],
          ['Peças recebidas', t.conferido ? fmtNum(t.pecasRecebidas) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-canvas px-3 py-2.5">
            <div className="text-xs font-bold text-muted">{k}</div>
            <div className="font-display text-base font-bold text-ink">{v}</div>
          </div>
        ))}
      </div>
      {!t.conferido && <p className="mb-3 text-xs text-amber-700">Esta carga ainda não foi conferida pela Logística: o texto mostra apenas os valores nominais.</p>}
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-canvas p-4 font-mono text-[11px] leading-relaxed text-ink-soft">{texto}</pre>
    </Modal>
  );
}

