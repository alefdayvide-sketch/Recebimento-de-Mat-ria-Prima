import { ArrowUpRight, FolderSearch, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
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
      <PageHeader title="Consulta Avançada & Histórico" subtitle="Pesquisa global em todos os romaneios, fichas cegas e laudos." />
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className={cx(inputCls, 'pl-9')} placeholder="NF, fornecedor, container, produto, conferente, auditor…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTRO.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cx('rounded-full border px-3 py-1.5 text-xs font-medium', status === s ? 'border-zinc-400 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

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
                <div className="flex items-start justify-between gap-2 px-4 pt-4">
                  <div>
                    <div className="text-base font-bold text-zinc-50">{r.fornecedor}</div>
                    <div className="font-mono text-[11px] text-zinc-500">{r.id}</div>
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
                <div className="mt-auto flex flex-wrap gap-1.5 border-t border-zinc-800 px-4 py-3">
                  {r.departamentoOrigem && <Tag>{`via ${r.departamentoOrigem}`}</Tag>}
                  {r.aprovacaoAdmin && <Tag>{`Admin: ${r.aprovacaoAdmin.decisao}`}</Tag>}
                  <button onClick={() => abrirDossie(r)} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-zinc-200 hover:text-white">
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
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
      <dd className="font-mono text-zinc-200">{v}</dd>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-400">{children}</span>;
}
