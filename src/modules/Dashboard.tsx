import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileText, Plus, Printer, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { ART, ContainerArt, FardosArt, TruckArt } from '../components/Art';
import { ActionButton, Badge, cx, Meter, PageHeader, TONE, type Tone } from '../components/ui';
import { comparativo, maiorSeveridade, totaisRomaneio } from '../lib/calc';
import { fmtData, fmtM3, fmtNum, fmtPct, hoje } from '../lib/format';
import type { Romaneio, ViewKey } from '../types';
import type { ModuleProps } from './shared';

interface Coluna {
  key: string;
  titulo: string;
  tone: Tone;
  filtro: (r: Romaneio) => boolean;
  vazio: string;
}

const COLUNAS: Coluna[] = [
  { key: 'patio', titulo: 'Aguardando caminhão', tone: 'teal', filtro: (r) => r.status === 'Aguardando Caminhão', vazio: 'Nenhum caminhão esperado.' },
  { key: 'qual', titulo: 'Na Qualidade', tone: 'rose', filtro: (r) => r.status === 'Ag. Qualidade', vazio: 'Nenhuma carga retida.' },
  { key: 'admin', titulo: 'Decisão do Admin', tone: 'amber', filtro: (r) => r.status === 'Ag. Aprovação Admin', vazio: 'Nenhum dossiê pendente.' },
  { key: 'fim', titulo: 'No estoque', tone: 'emerald', filtro: (r) => r.status === 'Finalizado' || r.status === 'Reprovado', vazio: 'Nada finalizado ainda.' },
];

export function Dashboard({ store, nav }: ModuleProps) {
  const { romaneios } = store;

  const alertas: { id: string; texto: string; view: ViewKey }[] = [];
  for (const r of romaneios) {
    if (r.status === 'Aguardando Caminhão' && r.dataPrevista < hoje()) alertas.push({ id: r.id, view: 'logistica', texto: `${r.fornecedor} atrasado (previsto ${fmtData(r.dataPrevista)})` });
    if (r.status === 'Ag. Aprovação Admin' && r.laudoQualidade?.decisao === 'Reprovado') alertas.push({ id: r.id, view: 'analise', texto: `${r.fornecedor}: laudo reprovou a carga` });
    if (r.status === 'Aguardando Caminhão' && r.aprovacaoAdmin?.decisao === 'Devolvido') alertas.push({ id: r.id, view: 'logistica', texto: `${r.fornecedor}: devolvida para recontagem` });
  }

  let perdaM3 = 0;
  let divergentes = 0;
  let conferidas = 0;
  for (const r of romaneios) {
    if (!r.fardos.length) continue;
    conferidas++;
    divergentes += r.fardos.reduce((s, f) => s + f.quantidadeDivergente, 0);
    perdaM3 += comparativo(r).reduce((s, l) => s + l.difM3, 0);
  }

  const titulo = nav.role === 'admin' ? 'Administrador' : nav.role === 'logistica' ? 'Logística' : 'Qualidade';

  return (
    <div>
      <PageHeader
        eyebrow={`Olá, ${titulo}`}
        title="Fluxo de recebimento"
        actions={
          <>
            <ActionButton tone="light" icon={<Printer size={19} />} title="Folha cega" subtitle="Imprimir prancheta" onClick={() => nav.abrir('logistica')} />
            <ActionButton icon={<Plus size={20} strokeWidth={2.5} />} title="Emitir romaneio" subtitle="Gera a ficha cega" onClick={() => nav.abrir('romaneios', 'novo')} />
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <span className="rounded-full bg-canvas px-3 py-1.5 font-semibold text-ink">Cada carga avança sozinha pelas etapas</span>
        <span>Clique em um card para agir.</span>
        {alertas.map((a, i) => (
          <button
            key={`${a.id}-${i}`}
            onClick={() => nav.abrir(a.view, a.id)}
            className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100"
          >
            <AlertTriangle size={14} />
            {a.texto}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {COLUNAS.map((c) => {
          const itens = romaneios.filter(c.filtro).sort((a, b) => b.createdAt - a.createdAt);
          return (
            <section key={c.key} className="flex min-h-[320px] flex-col gap-3 rounded-3xl bg-canvas p-3.5">
              <div className="flex items-center gap-2.5 px-1.5 pt-1">
                <span className={cx('h-2.5 w-2.5 rounded-full', TONE[c.tone].dot)} />
                <h2 className="flex-1 font-display text-[15px] font-bold text-ink">{c.titulo}</h2>
                <span className="font-mono text-sm text-muted">{itens.length}</span>
              </div>
              {itens.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-muted">{c.vazio}</p>}
              {itens.map((r) =>
                c.key === 'patio' ? (
                  <CardPatio key={r.id} r={r} onOpen={() => nav.abrir('logistica', r.id)} />
                ) : c.key === 'qual' ? (
                  <CardQualidade key={r.id} r={r} onOpen={() => nav.abrir('qualidade', r.id)} />
                ) : c.key === 'admin' ? (
                  <CardAdmin key={r.id} r={r} onOpen={() => nav.abrir('analise', r.id)} />
                ) : (
                  <CardEstoque key={r.id} r={r} onOpen={() => nav.abrir(r.fardos.length ? 'comparativo' : 'consulta', r.id)} />
                ),
              )}
              {c.key === 'fim' && conferidas > 0 && (
                <div className="mt-auto rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                  <div className="text-xs font-semibold text-muted">Balanço das cargas conferidas</div>
                  <div className={cx('font-display text-2xl font-bold', perdaM3 < 0 ? 'text-rose-700' : 'text-emerald-700')}>
                    {perdaM3 > 0 ? '+' : ''}
                    {fmtNum(perdaM3, 3)} m³
                  </div>
                  <div className="text-xs text-muted">
                    {fmtNum(divergentes)} peças divergentes em {conferidas} cargas
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Shell({ children, onOpen, destaque }: { children: ReactNode; onOpen: () => void; destaque?: string }) {
  return (
    <div
      className={cx('flex cursor-pointer flex-col gap-3 rounded-2xl bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift', destaque)}
      onClick={onOpen}
    >
      {children}
    </div>
  );
}

function Cabecalho({ r, extra }: { r: Romaneio; extra?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-base font-bold text-ink">{r.fornecedor}</span>
        <span className="font-mono text-xs text-muted">NF {r.nf}</span>
      </div>
      <div className="mt-0.5 font-mono text-xs text-muted">{extra ?? `${r.codigoContainer || 'Carga solta'} · ${r.local.split('·')[1]?.trim() ?? r.local}`}</div>
    </div>
  );
}

function Acao({ tone, children, onClick }: { tone: Tone; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cx('flex h-10 items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition', TONE[tone].solid)}
    >
      {children}
      <ArrowRight size={15} strokeWidth={2.5} />
    </button>
  );
}

function CardPatio({ r, onOpen }: { r: Romaneio; onOpen: () => void }) {
  const devolvida = r.aprovacaoAdmin?.decisao === 'Devolvido';
  const atraso = r.dataPrevista < hoje();
  return (
    <Shell onOpen={onOpen}>
      <div className="flex h-24 items-end justify-center overflow-hidden rounded-xl" style={{ background: ART.teal.bg }}>
        <TruckArt p={ART.teal} code={r.codigoContainer && r.codigoContainer !== 'Carga solta' ? r.codigoContainer : undefined} width={230} />
      </div>
      <Cabecalho r={r} />
      <div className={cx('flex items-center gap-2 text-[13px] font-semibold', devolvida || atraso ? 'text-amber-700' : 'text-teal-700')}>
        {devolvida ? <RotateCcw size={15} /> : <Clock size={15} />}
        {devolvida ? 'Devolvida para recontagem' : atraso ? `Atrasado · previsto ${fmtData(r.dataPrevista)}` : r.dataPrevista === hoje() ? 'Chega hoje' : `Chega em ${fmtData(r.dataPrevista)}`}
      </div>
      <Acao tone="teal" onClick={onOpen}>
        {devolvida ? 'Recontar carga' : 'Iniciar conferência'}
      </Acao>
    </Shell>
  );
}

function CardQualidade({ r, onOpen }: { r: Romaneio; onOpen: () => void }) {
  const sev = maiorSeveridade(r);
  return (
    <Shell onOpen={onOpen} destaque="ring-2 ring-rose-200">
      <div className="relative flex h-24 items-center justify-center rounded-xl" style={{ background: ART.rose.bg }}>
        <ContainerArt p={ART.rose} width={140} />
        <span className="absolute right-2 top-2 rounded-lg bg-rose-700 px-2 py-0.5 font-mono text-xs font-medium text-white">{fmtPct(sev)}</span>
      </div>
      <Cabecalho r={r} extra={`${r.codigoContainer || 'Carga solta'} · ${r.fardos.length} fardos`} />
      <Meter value={sev} />
      <Acao tone="rose" onClick={onOpen}>
        Emitir laudo
      </Acao>
    </Shell>
  );
}

function CardAdmin({ r, onOpen }: { r: Romaneio; onOpen: () => void }) {
  const t = totaisRomaneio(r);
  const dif = t.m3Corrigido - t.m3Fornecedor;
  const viaQualidade = r.departamentoOrigem === 'Qualidade';
  return (
    <Shell onOpen={onOpen}>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: ART.amber.bg }}>
          <ContainerArt p={ART.amber} width={44} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-bold text-ink">{r.fornecedor}</div>
          <div className="font-mono text-xs text-muted">NF {r.nf}</div>
        </div>
        {viaQualidade ? <Badge className="bg-rose-50 text-rose-700">Com laudo</Badge> : <Badge className="bg-teal-50 text-teal-800">Direto · {fmtPct(maiorSeveridade(r))}</Badge>}
      </div>
      <p className="text-[13px] leading-snug text-ink-soft">
        {viaQualidade && r.laudoQualidade ? `Laudo: ${r.laudoQualidade.decisao}. ` : ''}
        {fmtNum(t.pecasRecebidas)} de {fmtNum(t.pecasRomaneio)} peças · diferença de{' '}
        <b className={dif < -0.0005 ? 'text-rose-700' : 'text-ink'}>
          {dif > 0 ? '+' : ''}
          {fmtNum(dif, 3)} m³
        </b>
      </p>
      <Acao tone="amber" onClick={onOpen}>
        Abrir dossiê
      </Acao>
    </Shell>
  );
}

function CardEstoque({ r, onOpen }: { r: Romaneio; onOpen: () => void }) {
  const t = totaisRomaneio(r);
  const reprovado = r.status === 'Reprovado';
  return (
    <Shell onOpen={onOpen}>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: ART.emerald.bg }}>
          <FardosArt p={ART.emerald} width={46} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-bold text-ink">{r.fornecedor}</div>
          <div className="font-mono text-xs text-muted">
            NF {r.nf} · {fmtM3(t.m3Corrigido)}
          </div>
        </div>
        {reprovado ? <FileText size={20} className="text-red-700" /> : <CheckCircle2 size={20} className="text-emerald-700" />}
      </div>
    </Shell>
  );
}
