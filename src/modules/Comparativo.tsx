import { ClipboardCopy, Scale, Search } from 'lucide-react';
import { useState } from 'react';
import { ComparativoTable } from '../components/ComparativoTable';
import { Button, Card, CardHeader, cx, EmptyState, inputCls, PageHeader, StatusBadge, useToast } from '../components/ui';
import { copiarTexto, fmtData } from '../lib/format';
import { textoEmailFornecedor, type ModuleProps } from './shared';

export function Comparativo({ store, nav }: ModuleProps) {
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const conferidos = store.romaneios.filter((r) => r.fardos.length > 0);
  const q = busca.trim().toLowerCase();
  const lista = conferidos.filter((r) => !q || [r.nf, r.fornecedor, r.codigoContainer ?? '', r.id].some((v) => v.toLowerCase().includes(q)));
  const [selId, setSelId] = useState<string | undefined>(nav.selectedId);
  const sel = lista.find((r) => r.id === selId) ?? lista[0];

  return (
    <div>
      <PageHeader title="Comparativo Auditado" subtitle="Análise item a item entre o romaneio do fornecedor e o recebimento físico corrigido." />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="h-fit">
          <div className="border-b border-zinc-800 p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className={cx(inputCls, 'pl-8 text-xs')} placeholder="Filtrar romaneios…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="max-h-[600px] divide-y divide-zinc-800/70 overflow-y-auto">
            {lista.length === 0 && <EmptyState icon={<Scale size={20} />} title="Nenhum romaneio conferido" />}
            {lista.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelId(r.id)}
                className={cx('block w-full border-l-2 px-4 py-3 text-left', sel?.id === r.id ? 'border-l-zinc-300 bg-zinc-800/60' : 'border-l-transparent hover:bg-zinc-800/40')}
              >
                <div className="text-sm font-semibold text-zinc-100">{r.fornecedor}</div>
                <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
                  <span>NF {r.nf}</span>
                  <span>{fmtData(r.dataChegada?.slice(0, 10))}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
        {sel ? (
          <Card>
            <CardHeader
              title={
                <span>
                  {sel.fornecedor} <span className="font-mono text-zinc-400">· NF {sel.nf}</span>
                </span>
              }
              subtitle={`${sel.id} · Container ${sel.codigoContainer || '—'}`}
              icon={<Scale size={18} />}
              actions={
                <>
                  <StatusBadge status={sel.status} />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ok = await copiarTexto(textoEmailFornecedor(sel));
                      toast(ok ? 'Resumo copiado para a área de transferência.' : 'Não foi possível copiar automaticamente.', ok ? 'ok' : 'warn');
                    }}
                  >
                    <ClipboardCopy size={14} /> Copiar resumo para e-mail
                  </Button>
                </>
              }
            />
            <ComparativoTable romaneio={sel} />
            {sel.laudoQualidade && (
              <div className="border-t border-zinc-800 px-5 py-4 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">Laudo ({sel.laudoQualidade.auditor}):</span> {sel.laudoQualidade.decisao}. {sel.laudoQualidade.parecer}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <EmptyState icon={<Scale size={20} />} title="Selecione um romaneio" />
          </Card>
        )}
      </div>
    </div>
  );
}
