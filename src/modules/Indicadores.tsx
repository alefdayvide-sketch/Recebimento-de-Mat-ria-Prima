import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, KpiCard, PageHeader } from '../components/ui';
import { comparativo } from '../lib/calc';
import { fmtNum } from '../lib/format';
import type { ModuleProps } from './shared';

export function Indicadores({ store }: ModuleProps) {
  const conferidos = store.romaneios.filter((r) => r.fardos.length > 0);
  let ganhoPcs = 0,
    perdaPcs = 0,
    ganhoM3 = 0,
    perdaM3 = 0;
  const porFornecedor = new Map<string, { pecas: number; m3: number }>();

  for (const r of conferidos) {
    const acc = porFornecedor.get(r.fornecedor) ?? { pecas: 0, m3: 0 };
    for (const l of comparativo(r)) {
      if (l.difPecas > 0) ganhoPcs += l.difPecas;
      else perdaPcs += -l.difPecas;
      if (l.difM3 > 0) ganhoM3 += l.difM3;
      else perdaM3 += -l.difM3;
      acc.pecas += l.difPecas;
      acc.m3 += l.difM3;
    }
    porFornecedor.set(r.fornecedor, acc);
  }

  const balanco = [
    { nome: 'Ganho físico', pecas: ganhoPcs, volume: +(ganhoM3 * 10).toFixed(3) },
    { nome: 'Perda física', pecas: -perdaPcs, volume: -+(perdaM3 * 10).toFixed(3) },
    { nome: 'Saldo', pecas: ganhoPcs - perdaPcs, volume: +((ganhoM3 - perdaM3) * 10).toFixed(3) },
  ];
  const fornecedores = [...porFornecedor.entries()].map(([nome, v]) => ({ nome, pecas: v.pecas, volume: +(v.m3 * 10).toFixed(3) }));

  const tooltipStyle = { background: '#ffffff', border: '1px solid #e6e8ee', borderRadius: 12, fontSize: 12, color: '#141821', boxShadow: '0 14px 32px rgba(20,24,33,0.10)' };
  const eixo = { fill: '#69707d', fontSize: 11 };

  return (
    <div>
      <PageHeader eyebrow="Administrador" title="Indicadores" subtitle={`Balanço de variações logísticas de ${conferidos.length} carga(s) conferida(s).`} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Ganho físico" value={`+${fmtNum(ganhoPcs)}`} hint="peças" icon={<TrendingUp size={20} />} tone="emerald" />
        <KpiCard label="Perda física" value={`-${fmtNum(perdaPcs)}`} hint="peças" icon={<TrendingDown size={20} />} tone="rose" />
        <KpiCard label="Ganho volumétrico" value={`+${fmtNum(ganhoM3, 3)}`} hint="m³" icon={<TrendingUp size={20} />} tone="emerald" />
        <KpiCard label="Perda volumétrica" value={`-${fmtNum(perdaM3, 3)}`} hint="m³" icon={<TrendingDown size={20} />} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Balanço geral de variações logísticas" subtitle="Peças vs volume (m³ × 10 para escala comparável)" icon={<BarChart3 size={18} />} />
          <div className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanco} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="nome" tick={eixo} axisLine={{ stroke: '#e6e8ee' }} tickLine={false} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(20,24,33,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pecas" name="Peças" radius={[4, 4, 0, 0]}>
                  {balanco.map((b) => (
                    <Cell key={b.nome} fill={b.pecas < 0 ? '#be123c' : '#0e7c74'} />
                  ))}
                </Bar>
                <Bar dataKey="volume" name="Volume (m³ × 10)" radius={[4, 4, 0, 0]}>
                  {balanco.map((b) => (
                    <Cell key={b.nome} fill={b.volume < 0 ? '#fda4af' : '#7fcdc4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Saldo por fornecedor" subtitle="Diferença acumulada recebido − romaneio" icon={<BarChart3 size={18} />} />
          <div className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fornecedores} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="nome" tick={eixo} axisLine={{ stroke: '#e6e8ee' }} tickLine={false} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(20,24,33,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pecas" name="Peças" fill="#0e7c74" radius={[4, 4, 0, 0]} />
                <Bar dataKey="volume" name="Volume (m³ × 10)" fill="#c2690a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
