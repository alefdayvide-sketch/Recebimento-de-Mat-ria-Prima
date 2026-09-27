import type { FardoRecebido, Romaneio, RomaneioItem } from '../types';
import { analisarFardo, calcM3 } from './calc';

const dia = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const diaHora = (offset: number, hora: string) => `${dia(offset)}T${hora}`;
const ts = (offset: number) => new Date(`${dia(offset)}T08:00:00`).getTime();

function item(id: string, produto: string, e: number, l: number, c: number, qtd: number, fatorForn = 1, pecasPorFardo?: number): RomaneioItem {
  const m3Calculado = calcM3(e, l, c, qtd);
  return {
    id,
    produto,
    espessura: e,
    largura: l,
    comprimento: c,
    quantidade: qtd,
    pecasPorFardo,
    fardos: pecasPorFardo ? Math.ceil(qtd / pecasPorFardo) : undefined,
    m3Calculado,
    m3Fornecedor: Math.round(m3Calculado * fatorForn * 1000) / 1000,
  };
}

function fardo(
  produto: RomaneioItem,
  numero: string,
  qtd: number,
  amostra: number,
  div: number,
  ve = 0,
  vl = 0,
  vc = 0,
  observacao = '',
  statusOverride?: FardoRecebido['status'],
): FardoRecebido {
  const base: FardoRecebido = {
    id: `fd_${produto.id}_${numero}`,
    numeroFardo: numero,
    produtoId: produto.id,
    quantidadeRecebida: qtd,
    amostraColetada: amostra,
    quantidadeDivergente: div,
    v_espessura: ve,
    v_largura: vl,
    v_comprimento: vc,
    observacao,
    status: 'OK',
    percentualDivergencia: 0,
  };
  const a = analisarFardo(base, produto);
  return {
    ...base,
    percentualDivergencia: a.severidade,
    status: statusOverride ?? (a.critico ? 'Enviar para Qualidade' : 'OK'),
  };
}

export function gerarMock(): Romaneio[] {
  // 1) Aguardando Caminhão — emitido pelo Admin, sem conferência
  const i1a = item('it_vmad_1', 'Tábua Pinus Bruta', 22, 100, 1200, 1200, 1.02, 200);
  const i1b = item('it_vmad_2', 'Sarrafo Pinus', 22, 70, 1000, 800, 1.0, 200);
  const r1: Romaneio = {
    id: `VMAD_48213_${dia(1).replace(/-/g, '')}_001`,
    nf: '48213',
    fornecedor: 'VMAD',
    dataPrevista: dia(1),
    tipoMadeira: 'Pinus',
    local: 'Pátio 1 · Doca A',
    observacao: 'Carga programada para o turno da manhã.',
    codigoContainer: 'MSKU 482193-0',
    status: 'Aguardando Caminhão',
    items: [i1a, i1b],
    fardos: [],
    createdAt: ts(-1),
    fichaCegaGenerated: true,
  };

  // 2) Ag. Qualidade — fardo com 25% de divergência e +2 mm na espessura
  const i2a = item('it_jb_1', 'Tábua Eucalipto', 20, 100, 1100, 1000, 1.03, 250);
  const i2b = item('it_jb_2', 'Bloco Eucalipto', 90, 90, 100, 2000, 1.0, 500);
  const r2: Romaneio = {
    id: `JUNIORBAHI_30577_${dia(-1).replace(/-/g, '')}_001`,
    nf: '30577',
    fornecedor: 'Junior Bahia',
    dataPrevista: dia(-1),
    dataChegada: diaHora(-1, '09:40'),
    horaChegada: '09:40',
    tipoMadeira: 'Eucalipto',
    local: 'Pátio 2 · Doca C',
    observacao: '',
    codigoContainer: 'Carga solta',
    placaVeiculo: 'PEX-4J21',
    motorista: 'Edvaldo Santos',
    conferenteLogistica: 'Marcos Lima',
    status: 'Ag. Qualidade',
    items: [i2a, i2b],
    fardos: [
      fardo(i2a, '01', 250, 20, 5, 2, 0, 0, 'Peças visivelmente mais grossas.'),
      fardo(i2a, '02', 250, 20, 1, 0, 0, 0),
      fardo(i2a, '03', 250, 20, 0),
      fardo(i2a, '04', 248, 20, 0),
      fardo(i2b, '05', 500, 25, 0),
      fardo(i2b, '06', 500, 25, 1, 0, 0, -2),
      fardo(i2b, '07', 500, 25, 0),
      fardo(i2b, '08', 500, 25, 0),
    ],
    createdAt: ts(-3),
    fichaCegaGenerated: true,
    departamentoOrigem: 'Logística',
    dataEnvioLogistica: diaHora(-1, '11:15'),
  };

  // 3) Ag. Aprovação Admin — direto da Logística, divergência leve de 8%
  const i3 = item('it_fortis_1', 'Tábua Pinus Aparelhada', 18, 95, 1000, 1500, 1.01, 300);
  const r3: Romaneio = {
    id: `FORTIS_77120_${dia(0).replace(/-/g, '')}_001`,
    nf: '77120',
    fornecedor: 'Fortis',
    dataPrevista: dia(0),
    dataChegada: diaHora(0, '07:20'),
    horaChegada: '07:20',
    tipoMadeira: 'Pinus',
    local: 'Pátio 1 · Doca B',
    observacao: '',
    codigoContainer: 'TGHU 771204-5',
    conferenteLogistica: 'Ana Paula Rocha',
    status: 'Ag. Aprovação Admin',
    items: [i3],
    fardos: [
      fardo(i3, '01', 300, 25, 2, 0, 0, -5, 'Pontas levemente curtas.'),
      fardo(i3, '02', 300, 25, 1, 0, 0, -5),
      fardo(i3, '03', 300, 25, 0),
      fardo(i3, '04', 300, 25, 0),
      fardo(i3, '05', 296, 25, 1, 0, -1, 0),
    ],
    createdAt: ts(-2),
    fichaCegaGenerated: true,
    departamentoOrigem: 'Logística',
    dataEnvioLogistica: diaHora(0, '09:05'),
  };

  // 4) Ag. Aprovação Admin — periciada pela Qualidade, com laudo
  const i4 = item('it_cav_1', 'Tábua Pinus Bruta', 25, 120, 1200, 1000, 1.0, 250);
  const r4: Romaneio = {
    id: `CAVACOS_12004_${dia(-2).replace(/-/g, '')}_001`,
    nf: '12004',
    fornecedor: 'Cavacos',
    dataPrevista: dia(-2),
    dataChegada: diaHora(-2, '14:10'),
    horaChegada: '14:10',
    tipoMadeira: 'Pinus',
    local: 'Pátio 2 · Doca D',
    observacao: 'Fornecedor informou lote de serraria nova.',
    codigoContainer: 'CAIU 120045-8',
    conferenteLogistica: 'Marcos Lima',
    status: 'Ag. Aprovação Admin',
    items: [i4],
    fardos: [
      { ...fardo(i4, '01', 250, 20, 6, -3, 0, 0, 'Espessura abaixo do nominal.', 'Divergente confirmado'), reinspecionadoQualidade: true, motivoDivergencia: 'Espessura média 22 mm' },
      { ...fardo(i4, '02', 250, 20, 1, 0, 0, 0, '', 'Liberado'), reinspecionadoQualidade: true },
      { ...fardo(i4, '03', 248, 20, 0, 0, 0, 0, '', 'Liberado'), reinspecionadoQualidade: true },
      { ...fardo(i4, '04', 250, 20, 0, 0, 0, 0, '', 'Liberado'), reinspecionadoQualidade: true },
    ],
    createdAt: ts(-4),
    fichaCegaGenerated: true,
    departamentoOrigem: 'Qualidade',
    dataEnvioLogistica: diaHora(-2, '16:30'),
    dataEnvioQualidade: diaHora(-1, '10:00'),
    laudoQualidade: {
      auditor: 'Eng. Renata Albuquerque',
      data: diaHora(-1, '10:00'),
      parecer:
        'Reinspeção milimétrica confirmou espessura média de 22 mm em 30% das peças do fardo 01. Demais fardos dentro da tolerância. Recomenda-se ajuste de cubagem e contestação junto ao fornecedor.',
      decisao: 'Divergente confirmado',
      observacaoTecnica: 'Paquímetro digital calibrado em 09/2026.',
    },
  };

  // 5) Finalizado — 100% conforme e aprovado
  const i5a = item('it_vmad_3', 'Tábua Pinus Bruta', 22, 100, 1200, 600, 1.0, 300);
  const i5b = item('it_vmad_4', 'Bloco Pinus', 90, 90, 100, 1000, 1.0, 500);
  const r5: Romaneio = {
    id: `VMAD_47990_${dia(0).replace(/-/g, '')}_001`,
    nf: '47990',
    fornecedor: 'VMAD',
    dataPrevista: dia(0),
    dataChegada: diaHora(0, '06:50'),
    horaChegada: '06:50',
    tipoMadeira: 'Pinus',
    local: 'Pátio 1 · Doca A',
    observacao: '',
    codigoContainer: 'MSKU 479903-2',
    conferenteLogistica: 'Ana Paula Rocha',
    status: 'Finalizado',
    items: [i5a, i5b],
    fardos: [fardo(i5a, '01', 300, 20, 0), fardo(i5a, '02', 300, 20, 0), fardo(i5b, '03', 500, 25, 0), fardo(i5b, '04', 500, 25, 0)],
    createdAt: ts(-2),
    fichaCegaGenerated: true,
    departamentoOrigem: 'Logística',
    dataEnvioLogistica: diaHora(0, '08:10'),
    aprovacaoAdmin: {
      aprovador: 'Administrador',
      data: diaHora(0, '08:45'),
      decisao: 'Aprovado',
      observacao: 'Carga conforme. Liberada para estoque.',
    },
  };

  return [r1, r2, r3, r4, r5];
}

export const FORNECEDORES = ['VMAD', 'Junior Bahia', 'Fortis', 'Cavacos', 'Madeireira Norte', 'Serraria Sul', 'Outro'];
export const TIPOS_MADEIRA = ['Pinus', 'Eucalipto', 'Mista', 'Tropical'];
export const LOCAIS = ['Pátio 1 · Doca A', 'Pátio 1 · Doca B', 'Pátio 2 · Doca C', 'Pátio 2 · Doca D'];
