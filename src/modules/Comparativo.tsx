import { ClipboardCopy, Scale, Search } from 'lucide-react';
import { useState } from 'react';
import { ComparativoTable } from '../components/ComparativoTable';
import { ART, ContainerArt } from '../components/Art';
import { Button, Card, CardHeader, cx, EmptyState, inputCls, PageHeader, QueueItem, StatusBadge, useToast } from '../components/ui';
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
      <PageHeader eyebrow="Auditoria" title="Comparativo auditado" subtitle="Item a item: romaneio do fornecedor contra o recebimento físico corrigido." />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div className="flex h-fit flex-col gap-2 rounded-3xl bg-canvas p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className={cx(inputCls, 'pl-9')} placeholder="Filtrar romaneios" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex max-h-[600px] flex-col gap-1 overflow-y-auto">
            {lista.length === 0 && <EmptyState icon={<Scale size={20} />} title="Nenhum romaneio conferido" />}
            {lista.map((r) => (
              <QueueItem
                key={r.id}
                active={sel?.id === r.id}
                tone="slate"
                art={<ContainerArt p={ART.slate} width={40} />}
                title={r.fornecedor}
                lines={[`NF ${r.nf} · ${fmtData(r.dataChegada?.slice(0, 10))}`]}
                onClick={() => setSelId(r.id)}
              />
            ))}
          </div>
        </div>
        {sel ? (
          <Card>
            <CardHeader
              title={
                <span>
                  {sel.fornecedor} <span className="font-mono text-muted">· NF {sel.nf}</span>
                </span>
              }
              subtitle={`${sel.id} · Container ${sel.codigoContainer || '—'}`}
              icon={<Scale size={18} />}
              actions={
                <>
                  <StatusBadge status={sel.status} />
                  <Button
                    size="sm"
                    variant="dark"
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
              <div className="border-t border-line px-5 py-4 text-xs text-muted">
                <span className="font-semibold text-ink">Laudo ({sel.laudoQualidade.auditor}):</span> {sel.laudoQualidade.decisao}. {sel.laudoQualidade.parecer}
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
