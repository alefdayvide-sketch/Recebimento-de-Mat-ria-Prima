import { AlertTriangle } from 'lucide-react';
import { comparativo, totaisRomaneio } from '../lib/calc';
import { fmtNum } from '../lib/format';
import type { Romaneio } from '../types';
import { Badge, cx } from './ui';

const sinal = (n: number, casas = 0) => `${n > 0.00049 ? '+' : ''}${fmtNum(n, casas)}`;
const tom = (n: number) => (n < -0.00049 ? 'text-rose-700' : n > 0.00049 ? 'text-emerald-700' : 'text-muted');

/** Tabela analítica item a item: romaneio × recebido × corrigido. */
export function ComparativoTable({ romaneio }: { romaneio: Romaneio }) {
  const linhas = comparativo(romaneio);
  const t = totaisRomaneio(romaneio);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/70 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
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
        <tbody className="divide-y divide-line">
          {linhas.map((l) => (
            <tr key={l.item.id}>
              <td className="px-4 py-2.5">
                <div className="text-ink">{l.item.produto}</div>
                <div className="font-mono text-[11px] text-muted">
                  {l.item.espessura} × {l.item.largura} × {l.item.comprimento} mm
                </div>
              </td>
              <td className="px-3 py-2.5 text-right font-mono">{fmtNum(l.qtdRomaneio)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-ink">{t.conferido ? fmtNum(l.qtdRecebida) : '—'}</td>
              <td className={cx('px-3 py-2.5 text-right font-mono font-semibold', t.conferido ? tom(l.difPecas) : 'text-slate-400')}>{t.conferido ? sinal(l.difPecas) : '—'}</td>
              <td className="px-3 py-2.5 text-right font-mono">{fmtNum(l.m3Romaneio, 3)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-ink">{t.conferido ? fmtNum(l.m3Corrigido, 3) : '—'}</td>
              <td className={cx('px-3 py-2.5 text-right font-mono font-semibold', t.conferido ? tom(l.difM3) : 'text-slate-400')}>{t.conferido ? sinal(l.difM3, 3) : '—'}</td>
              <td className="px-4 py-2.5 text-right">
                {l.cotasAlteradas && (
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                    <AlertTriangle size={11} /> Cotas Alteradas
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line bg-canvas font-semibold">
            <td className="px-4 py-2.5 text-ink-soft">Total</td>
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
