import type { Nav } from '../App';
import { comparativo, totaisRomaneio } from '../lib/calc';
import { fmtData, fmtNum } from '../lib/format';
import type { Store } from '../lib/store';
import type { Romaneio, ViewKey } from '../types';

export interface ModuleProps {
  store: Store;
  nav: Nav;
}

/** Para onde levar o usuário ao clicar numa carga, conforme o status. */
export function destinoDoStatus(status: string): ViewKey {
  if (status === 'Ag. Qualidade') return 'qualidade';
  if (status === 'Ag. Aprovação Admin') return 'analise';
  if (status === 'Aguardando Caminhão') return 'logistica';
  return 'consulta';
}

const n3 = (n: number) => fmtNum(n, 3);

/** Texto estruturado pronto para colar no e-mail de contestação ao fornecedor. */
export function textoEmailFornecedor(r: Romaneio): string {
  const linhas = comparativo(r);
  const t = totaisRomaneio(r);
  const partes = [
    `À ${r.fornecedor},`,
    '',
    'Prezados,',
    '',
    `Segue o comparativo de recebimento referente à NF ${r.nf} (protocolo ${r.id}).`,
    `Container: ${r.codigoContainer || 'não informado'} · Recebido em: ${fmtData(r.dataChegada)} · Madeira: ${r.tipoMadeira}`,
    '',
    'ITEM | QTD NF | QTD RECEBIDA | DIF. PÇS | M³ NF | M³ CONFERIDO | DIF. M³',
    ...linhas.map(
      (l) =>
        `${l.item.produto} (${l.item.espessura}x${l.item.largura}x${l.item.comprimento} mm) | ${fmtNum(l.qtdRomaneio)} | ${fmtNum(l.qtdRecebida)} | ${
          l.difPecas > 0 ? '+' : ''
        }${fmtNum(l.difPecas)} | ${n3(l.m3Romaneio)} | ${n3(l.m3Corrigido)} | ${l.difM3 > 0 ? '+' : ''}${n3(l.difM3)}${l.cotasAlteradas ? ' [COTAS ALTERADAS]' : ''}`,
    ),
    '',
    `TOTAL: ${fmtNum(t.pecasRomaneio)} pçs na NF / ${fmtNum(t.pecasRecebidas)} pçs recebidas · ${n3(t.m3Fornecedor)} m³ na NF / ${n3(t.m3Corrigido)} m³ conferidos`,
    `DIFERENÇA VOLUMÉTRICA: ${t.m3Corrigido - t.m3Fornecedor > 0 ? '+' : ''}${n3(t.m3Corrigido - t.m3Fornecedor)} m³`,
  ];
  if (r.laudoQualidade) {
    partes.push('', `Laudo técnico (${r.laudoQualidade.auditor}): ${r.laudoQualidade.decisao}.`, r.laudoQualidade.parecer);
  }
  partes.push('', 'Solicitamos análise e posicionamento quanto às divergências apontadas.', '', 'Atenciosamente,', 'Icopallet · Recebimento de Matéria-Prima');
  return partes.join('\n');
}
