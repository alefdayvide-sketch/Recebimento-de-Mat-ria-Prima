import { AlertTriangle } from 'lucide-react';
import { comparativo, totaisRomaneio } from '../lib/calc';
import { fmtNum } from '../lib/format';
import type { Romaneio } from '../types';
import { Badge, cx } from './ui';

const sinal = (n: number, casas = 0) => `${n > 0.00049 ? '+' : ''}${fmtNum(n, casas)}`;
const tom = (n: number) => (n < -0.00049 ? 'text-red-400' : n > 0.00049 ? 'text-emerald-400' : 'text-zinc-500');

/** Tabela analítica item a item: romaneio × recebido × corrigido. */
export function ComparativoTable({ romaneio }: { romaneio: Romaneio }) {
  const linhas = comparativo(romaneio);
  const t = totaisRomaneio(romaneio);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-2.5">Produto</th>
            <th className="px-3 py-2.5 text-right">Qtd romaneio</th>
            <th className="px-3 py-2.5 text-right">Qtd recebida</th>
            <th className="px-3 py-2.5 text-right">Dif. pçs</th>
            <th className="px-3 py-2.5 text-right">m³ romaneio</th>
            <th className="px-3 py-2.5 text-right">m³ corrigido</th>
            <th className="px-3 py-2.5 text-right">Diferença m³</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {linhas.map((l) => (
            <tr key={l.item.id}>
              <td className="px-4 py-2.5">
                <div className="text-zinc-100">{l.item.produto}</div>
                <div className="font-mono text-[11px] text-zinc-500">
                  {l.item.espessura} × {l.item.largura} × {l.item.comprimento} mm
                </div>
              </td>
              <td className="px-3 py-2.5 text-right font-mono">{fmtNum(l.qtdRomaneio)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-zinc-100">{t.conferido ? fmtNum(l.qtdRecebida) : '—'}</td>
              <td className={cx('px-3 py-2.5 text-right font-mono font-semibold', t.conferido ? tom(l.difPecas) : 'text-zinc-600')}>{t.conferido ? sinal(l.difPecas) : '—'}</td>
              <td className="px-3 py-2.5 text-right font-mono">{fmtNum(l.m3Romaneio, 3)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-zinc-100">{t.conferido ? fmtNum(l.m3Corrigido, 3) : '—'}</td>
              <td className={cx('px-3 py-2.5 text-right font-mono font-semibold', t.conferido ? tom(l.difM3) : 'text-zinc-600')}>{t.conferido ? sinal(l.difM3, 3) : '—'}</td>
              <td className="px-4 py-2.5 text-right">
                {l.cotasAlteradas && (
                  <Badge className="border-amber-500/50 bg-amber-500/10 text-amber-300">
                    <AlertTriangle size={11} /> Cotas Alteradas
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-700 bg-zinc-950/60 font-semibold">
            <td className="px-4 py-2.5 text-zinc-300">Total</td>
            <td className="px-3 py-2.5 text-right font-mono">{fmtNum(t.pecasRomaneio)}</td>
            <td className="px-3 py-2.5 text-right font-mono">{t.conferido ? fmtNum(t.pecasRecebidas) : '—'}</td>
            <td className={cx('px-3 py-2.5 text-right font-mono', tom(t.pecasRecebidas - t.pecasRomaneio))}>{t.conferido ? sinal(t.pecasRecebidas - t.pecasRomaneio) : '—'}</td>
            <td className="px-3 py-2.5 text-right font-mono">{fmtNum(t.m3Fornecedor, 3)}</td>
            <td className="px-3 py-2.5 text-right font-mono">{t.conferido ? fmtNum(t.m3Corrigido, 3) : '—'}</td>
            <td className={cx('px-3 py-2.5 text-right font-mono', tom(t.m3Corrigido - t.m3Fornecedor))}>{t.conferido ? sinal(t.m3Corrigido - t.m3Fornecedor, 3) : '—'}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
