import type { DashboardStats, FardoRecebido, Romaneio, RomaneioItem } from '../types';

/** Teto de severidade: a partir deste percentual o fardo é retido para a Qualidade. */
export const LIMITE_SEVERIDADE = 20;

export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

const round = (n: number, casas = 4) => {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
};

/** m³ de N peças a partir das dimensões em milímetros. */
export function calcM3(espessura: number, largura: number, comprimento: number, quantidade: number): number {
  if (!espessura || !largura || !comprimento || !quantidade) return 0;
  return round((espessura * largura * comprimento * quantidade) / 1_000_000_000);
}

export function itemM3(item: Pick<RomaneioItem, 'espessura' | 'largura' | 'comprimento' | 'quantidade'>) {
  return calcM3(item.espessura, item.largura, item.comprimento, item.quantidade);
}

export interface AnaliseFardo {
  pctPecas: number; // % de peças divergentes na amostra
  pctM3: number; // % de variação volumétrica do fardo
  severidade: number; // maior dos dois
  critico: boolean; // severidade >= 20%
  m3Nominal: number; // m³ do fardo nas medidas do romaneio
  m3Real: number; // m³ do fardo corrigido pelas variações medidas
  cotasAlteradas: boolean;
}

/**
 * Regra de cálculo da divergência de um fardo:
 * - % peças = peças divergentes / amostra coletada.
 * - Cada peça divergente tem as medidas nominais somadas às variações (mm).
 *   A proporção de divergentes da amostra é extrapolada para o fardo inteiro,
 *   gerando o m³ real. % m³ = |m³ real − m³ nominal| / m³ nominal.
 * - Severidade = maior entre % peças e % m³.
 */
export function analisarFardo(fardo: FardoRecebido, item?: RomaneioItem): AnaliseFardo {
  const pctPecas =
    fardo.amostraColetada > 0 ? Math.min(100, (fardo.quantidadeDivergente / fardo.amostraColetada) * 100) : 0;

  if (!item) {
    return { pctPecas, pctM3: 0, severidade: pctPecas, critico: pctPecas >= LIMITE_SEVERIDADE, m3Nominal: 0, m3Real: 0, cotasAlteradas: false };
  }

  const volPeca = item.espessura * item.largura * item.comprimento;
  const volPecaDiv =
    Math.max(0, item.espessura + fardo.v_espessura) *
    Math.max(0, item.largura + fardo.v_largura) *
    Math.max(0, item.comprimento + fardo.v_comprimento);

  const cotasAlteradas = fardo.v_espessura !== 0 || fardo.v_largura !== 0 || fardo.v_comprimento !== 0;
  const fracDiv = pctPecas / 100;
  const m3Nominal = (volPeca * fardo.quantidadeRecebida) / 1e9;
  const m3Real = ((volPeca * (1 - fracDiv) + volPecaDiv * fracDiv) * fardo.quantidadeRecebida) / 1e9;
  const pctM3 = m3Nominal > 0 ? (Math.abs(m3Real - m3Nominal) / m3Nominal) * 100 : 0;
  const severidade = Math.max(pctPecas, pctM3);

  return {
    pctPecas: round(pctPecas, 2),
    pctM3: round(pctM3, 2),
    severidade: round(severidade, 2),
    critico: severidade >= LIMITE_SEVERIDADE,
    m3Nominal: round(m3Nominal),
    m3Real: round(m3Real),
    cotasAlteradas,
  };
}

export function itemDoFardo(r: Romaneio, f: FardoRecebido) {
  return r.items.find((i) => i.id === f.produtoId);
}

/** Algum fardo acima do teto? Define o roteamento automático da Logística. */
export function exigeQualidade(r: Romaneio): boolean {
  return r.fardos.some((f) => analisarFardo(f, itemDoFardo(r, f)).critico);
}

export function maiorSeveridade(r: Romaneio): number {
  return r.fardos.reduce((max, f) => Math.max(max, analisarFardo(f, itemDoFardo(r, f)).severidade), 0);
}

export interface LinhaComparativa {
  item: RomaneioItem;
  qtdRomaneio: number;
  qtdRecebida: number;
  difPecas: number;
  m3Romaneio: number; // m³ da NF do fornecedor
  m3Calculado: number; // m³ nominal calculado pelo sistema
  m3Corrigido: number; // m³ físico corrigido pela conferência
  difM3: number;
  cotasAlteradas: boolean;
}

export function comparativo(r: Romaneio): LinhaComparativa[] {
  return r.items.map((item) => {
    const fardos = r.fardos.filter((f) => f.produtoId === item.id);
    const analises = fardos.map((f) => analisarFardo(f, item));
    const qtdRecebida = fardos.reduce((s, f) => s + f.quantidadeRecebida, 0);
    const m3Corrigido = round(analises.reduce((s, a) => s + a.m3Real, 0));
    return {
      item,
      qtdRomaneio: item.quantidade,
      qtdRecebida,
      difPecas: qtdRecebida - item.quantidade,
      m3Romaneio: item.m3Fornecedor,
      m3Calculado: item.m3Calculado,
      m3Corrigido,
      difM3: round(m3Corrigido - item.m3Fornecedor),
      cotasAlteradas: analises.some((a) => a.cotasAlteradas),
    };
  });
}

export function totaisRomaneio(r: Romaneio) {
  const linhas = comparativo(r);
  return {
    pecasRomaneio: linhas.reduce((s, l) => s + l.qtdRomaneio, 0),
    pecasRecebidas: linhas.reduce((s, l) => s + l.qtdRecebida, 0),
    m3Fornecedor: round(linhas.reduce((s, l) => s + l.m3Romaneio, 0)),
    m3Calculado: round(linhas.reduce((s, l) => s + l.m3Calculado, 0)),
    m3Corrigido: round(linhas.reduce((s, l) => s + l.m3Corrigido, 0)),
    conferido: r.fardos.length > 0,
  };
}

export type Prioridade = 'CRITICO' | 'ATENCAO' | 'OK';

export function prioridade(r: Romaneio): Prioridade {
  const sev = maiorSeveridade(r);
  if (r.status === 'Ag. Qualidade' || sev >= LIMITE_SEVERIDADE) return 'CRITICO';
  if (r.status === 'Ag. Aprovação Admin' || sev > 0) return 'ATENCAO';
  return 'OK';
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

export function dashboardStats(romaneios: Romaneio[]): DashboardStats {
  let totalM3Perdido = 0;
  let totalPecasDivergentes = 0;
  for (const r of romaneios) {
    for (const l of comparativo(r)) {
      if (r.fardos.length && l.difM3 < 0) totalM3Perdido += -l.difM3;
    }
    totalPecasDivergentes += r.fardos.reduce((s, f) => s + f.quantidadeDivergente, 0);
  }
  return {
    aguardandoRecebimento: romaneios.filter((r) => r.status === 'Aguardando Caminhão' || r.status === 'Ag. Recebimento').length,
    recebimentoEmAndamento: romaneios.filter((r) => r.status === 'Em Recebimento').length,
    aguardandoQualidade: romaneios.filter((r) => r.status === 'Ag. Qualidade').length,
    aguardandoAdmin: romaneios.filter((r) => r.status === 'Ag. Aprovação Admin').length,
    finalizadosHoje: romaneios.filter((r) => r.status === 'Finalizado' && r.aprovacaoAdmin?.data?.slice(0, 10) === hojeISO()).length,
    totalM3Perdido: round(totalM3Perdido),
    totalPecasDivergentes,
  };
}

/** Gera o protocolo no formato FORNECEDOR_NF_DATA_SEQ. */
export function gerarIdRomaneio(fornecedor: string, nf: string, data: string, existentes: Romaneio[]): string {
  const forn = fornecedor.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10) || 'FORN';
  const d = (data || hojeISO()).replace(/-/g, '');
  const base = `${forn}_${nf.replace(/\s/g, '') || 'SN'}_${d}`;
  const seq = existentes.filter((r) => r.id.startsWith(base)).length + 1;
  return `${base}_${String(seq).padStart(3, '0')}`;
}
