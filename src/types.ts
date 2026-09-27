export type DepartmentRole = 'admin' | 'logistica' | 'qualidade';

export type Status =
  | 'Aguardando Caminhão'
  | 'Ag. Recebimento'
  | 'Em Recebimento'
  | 'Ag. Qualidade'
  | 'Ag. Aprovação Admin'
  | 'Finalizado'
  | 'Divergente'
  | 'Reprovado'
  | 'OK'
  | 'Enviar para Qualidade'
  | 'Liberado'
  | 'Divergente confirmado';

export interface RomaneioItem {
  id: string;
  produto: string;
  espessura: number; // em mm
  largura: number; // em mm
  comprimento: number; // em mm
  quantidade: number;
  fardos?: number;
  pecasPorFardo?: number;
  m3Fornecedor: number;
  m3Calculado: number;
}

export type FardoStatus = 'OK' | 'Enviar para Qualidade' | 'Liberado' | 'Divergente confirmado' | 'Reprovado';

export interface FardoRecebido {
  id: string;
  numeroFardo: string;
  produtoId: string; // Vínculo ao RomaneioItem
  quantidadeRecebida: number;
  amostraColetada: number;
  quantidadeDivergente: number;
  v_espessura: number; // Variação em mm (- ou +)
  v_largura: number; // Variação em mm (- ou +)
  v_comprimento: number; // Variação em mm (- ou +)
  observacao: string;
  status: FardoStatus;
  percentualDivergencia: number;
  motivoDivergencia?: string;
  reinspecionadoQualidade?: boolean;
}

export type DecisaoLaudo = 'Liberado' | 'Divergente confirmado' | 'Reprovado';

export interface LaudoQualidade {
  auditor: string;
  data: string;
  parecer: string;
  decisao: DecisaoLaudo;
  observacaoTecnica?: string;
}

export interface AprovacaoAdmin {
  aprovador: string;
  data: string;
  decisao: 'Aprovado' | 'Rejeitado' | 'Devolvido';
  observacao?: string;
}

export interface Romaneio {
  id: string; // Ex: FORNECEDOR_NF_DATA_SEQ
  nf: string;
  fornecedor: string;
  dataPrevista: string;
  dataChegada?: string;
  horaChegada?: string;
  tipoMadeira: string;
  local: string;
  observacao: string;
  codigoContainer?: string; // Definido pelo Admin no cadastro
  placaVeiculo?: string;
  motorista?: string;
  conferenteLogistica?: string;
  status: Status;
  items: RomaneioItem[];
  fardos: FardoRecebido[];
  createdAt: number;
  fichaCegaGenerated?: boolean;
  departamentoOrigem?: 'Logística' | 'Qualidade';
  dataEnvioLogistica?: string;
  dataEnvioQualidade?: string;
  laudoQualidade?: LaudoQualidade;
  aprovacaoAdmin?: AprovacaoAdmin;
}

export interface DashboardStats {
  aguardandoRecebimento: number;
  recebimentoEmAndamento: number;
  aguardandoQualidade: number;
  aguardandoAdmin: number;
  finalizadosHoje: number;
  totalM3Perdido: number;
  totalPecasDivergentes: number;
}

export type ViewKey =
  | 'dashboard'
  | 'analise'
  | 'romaneios'
  | 'logistica'
  | 'qualidade'
  | 'comparativo'
  | 'indicadores'
  | 'consulta';
