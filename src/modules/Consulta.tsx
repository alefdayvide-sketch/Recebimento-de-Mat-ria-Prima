import { ArrowUpRight, FolderSearch, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { artDoStatus, ContainerArt, TruckArt } from '../components/Art';
import { Card, cx, EmptyState, inputCls, PageHeader, StatusBadge } from '../components/ui';
import { maiorSeveridade, totaisRomaneio } from '../lib/calc';
import { fmtData, fmtM3, fmtNum, fmtPct } from '../lib/format';
import type { Status } from '../types';
import { ComparativoFornecedorModal } from './Romaneios';
import { destinoDoStatus, type ModuleProps } from './shared';
import type { Romaneio } from '../types';
import { NAV } from '../components/Sidebar';

const STATUS_FILTRO: (Status | 'Todos')[] = ['Todos', 'Aguardando Caminhão', 'Ag. Qualidade', 'Ag. Aprovação Admin', 'Finalizado'];

export function Consulta({ store, nav }: ModuleProps) {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<Status | 'Todos'>('Todos');
  const [detalhe, setDetalhe] = useState<Romaneio | null>(null);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return store.romaneios
      .filter((r) => status === 'Todos' || r.status === status)
      .filter(
        (r) =>
          !q ||
          [r.nf, r.fornecedor, r.codigoContainer ?? '', r.id, r.tipoMadeira, r.conferenteLogistica ?? '', r.laudoQualidade?.auditor ?? '', ...r.items.map((i) => i.produto)].some((v) =>
            v.toLowerCase().includes(q),
          ),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [store.romaneios, busca, status]);

  const abrirDossie = (r: Romaneio) => {
    const destino = destinoDoStatus(r.status);
    const pode = (v: string) => NAV[nav.role].some((n) => n.key === v);
    if (destino !== 'consulta' && pode(destino)) nav.abrir(destino, r.id);
    else if (r.fardos.length > 0 && pode('comparativo')) nav.abrir('comparativo', r.id);
    else setDetalhe(r);
  };

  return (
    <div>
      <PageHeader eyebrow="Histórico" title="Consulta" subtitle="Pesquise em todos os romaneios, fichas cegas e laudos." />
      <div className="mb-6 rounded-3xl bg-canvas p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className={cx(inputCls, 'pl-9')} placeholder="NF, fornecedor, container, produto, conferente, auditor…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTRO.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cx('h-9 rounded-full px-3.5 text-xs font-bold', status === s ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}
              >
                {s === 'Todos' ? 'Todos' : s === 'Aguardando Caminhão' ? 'Aguardando caminhão' : s === 'Ag. Qualidade' ? 'Na Qualidade' : s === 'Ag. Aprovação Admin' ? 'Decisão do Admin' : 'No estoque'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyState icon={<FolderSearch size={20} />} title="Nenhum resultado" text="Tente outro termo ou filtro de status." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {lista.map((r) => {
            const t = totaisRomaneio(r);
            const sev = maiorSeveridade(r);
            return (
              <Card key={r.id} className="flex flex-col">
                <div className="m-3 mb-0 flex h-24 items-end justify-center overflow-hidden rounded-xl" style={{ background: artDoStatus(r.status).bg }}>
                  {r.status === 'Aguardando Caminhão' ? <TruckArt p={artDoStatus(r.status)} width={210} /> : <ContainerArt p={artDoStatus(r.status)} width={130} className="mb-2" />}
                </div>
                <div className="flex items-start justify-between gap-2 px-4 pt-3">
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-ink">{r.fornecedor}</div>
                    <div className="truncate font-mono text-[11px] text-muted">{r.id}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-xs">
                  <Info k="NF" v={r.nf} />
                  <Info k="Container" v={r.codigoContainer || '—'} />
                  <Info k="Previsto / chegada" v={`${fmtData(r.dataPrevista)} / ${r.dataChegada ? fmtData(r.dataChegada.slice(0, 10)) : '—'}`} />
                  <Info k="Maior divergência" v={r.fardos.length ? fmtPct(sev) : '—'} />
                  <Info k="m³ NF" v={fmtM3(t.m3Fornecedor)} />
                  <Info k="m³ conferido" v={t.conferido ? fmtM3(t.m3Corrigido) : '—'} />
                  <Info k="Peças NF / recebidas" v={`${fmtNum(t.pecasRomaneio)} / ${t.conferido ? fmtNum(t.pecasRecebidas) : '—'}`} />
                  <Info k="Laudo" v={r.laudoQualidade?.decisao ?? '—'} />
                </dl>
                <div className="mt-auto flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
                  {r.departamentoOrigem && <Tag>{`via ${r.departamentoOrigem}`}</Tag>}
                  {r.aprovacaoAdmin && <Tag>{`Admin: ${r.aprovacaoAdmin.decisao}`}</Tag>}
                  <button onClick={() => abrirDossie(r)} className="ml-auto inline-flex h-9 items-center gap-1 rounded-lg bg-ink px-3 text-xs font-bold text-white hover:bg-black">
                    Abrir dossiê <ArrowUpRight size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <ComparativoFornecedorModal romaneio={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-muted">{k}</dt>
      <dd className="font-mono text-ink">{v}</dd>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-lg bg-canvas px-2 py-1 text-[11px] font-semibold text-muted">{children}</span>;
}

