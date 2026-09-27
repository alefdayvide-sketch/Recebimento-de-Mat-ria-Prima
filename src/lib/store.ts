import { useCallback, useEffect, useState } from 'react';
import type { AprovacaoAdmin, FardoRecebido, LaudoQualidade, Romaneio } from '../types';
import { analisarFardo, exigeQualidade } from './calc';
import { agoraISO } from './format';
import { gerarMock } from './mock';

export const STORAGE_KEY = 'icopallet_data_v4';

function carregar(): Romaneio[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Romaneio[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* storage indisponível: segue com mock */
  }
  return gerarMock();
}

function salvar(data: Romaneio[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* sem persistência neste ambiente */
  }
}

/** Recalcula % e status de cada fardo conforme o teto de 20%. */
export function recalcularFardos(r: Romaneio): FardoRecebido[] {
  return r.fardos.map((f) => {
    const a = analisarFardo(f, r.items.find((i) => i.id === f.produtoId));
    return { ...f, percentualDivergencia: a.severidade, status: a.critico ? 'Enviar para Qualidade' : 'OK' };
  });
}

export interface ConferenciaPayload {
  dataChegada: string;
  conferenteLogistica: string;
  placaVeiculo?: string;
  motorista?: string;
  fardos: FardoRecebido[];
}

export function useIcopalletStore() {
  const [romaneios, setRomaneios] = useState<Romaneio[]>(carregar);

  useEffect(() => salvar(romaneios), [romaneios]);

  const patch = useCallback((id: string, fn: (r: Romaneio) => Romaneio) => {
    setRomaneios((prev) => prev.map((r) => (r.id === id ? fn(r) : r)));
  }, []);

  /** Admin emite romaneio → ficha cega entra na fila da Logística. */
  const emitirRomaneio = useCallback((r: Romaneio) => {
    setRomaneios((prev) => [{ ...r, status: 'Aguardando Caminhão', fichaCegaGenerated: true, fardos: [] }, ...prev]);
  }, []);

  /** Logística finaliza a conferência: salva tudo e roteia pelo gatilho de 20%. */
  const finalizarConferencia = useCallback(
    (id: string, p: ConferenciaPayload): 'Ag. Qualidade' | 'Ag. Aprovação Admin' => {
      const atual = romaneios.find((x) => x.id === id);
      if (!atual) return 'Ag. Aprovação Admin';
      const base: Romaneio = { ...atual, ...p, horaChegada: p.dataChegada.split('T')[1]?.slice(0, 5) };
      const fardos = recalcularFardos(base);
      const destino = exigeQualidade({ ...base, fardos }) ? 'Ag. Qualidade' : 'Ag. Aprovação Admin';
      const atualizado: Romaneio = {
        ...base,
        fardos,
        status: destino,
        departamentoOrigem: 'Logística',
        dataEnvioLogistica: agoraISO(),
        laudoQualidade: undefined,
        aprovacaoAdmin: undefined,
      };
      setRomaneios((prev) => prev.map((r) => (r.id === id ? atualizado : r)));
      return destino;
    },
    [romaneios],
  );

  /** Qualidade transmite o laudo técnico para o Admin. */
  const enviarLaudo = useCallback(
    (id: string, fardos: FardoRecebido[], laudo: LaudoQualidade) => {
      patch(id, (r) => ({
        ...r,
        fardos: fardos.map((f) => {
          const a = analisarFardo(f, r.items.find((i) => i.id === f.produtoId));
          return { ...f, percentualDivergencia: a.severidade };
        }),
        laudoQualidade: laudo,
        status: 'Ag. Aprovação Admin',
        departamentoOrigem: 'Qualidade',
        dataEnvioQualidade: laudo.data,
      }));
    },
    [patch],
  );

  type AcaoAdmin = 'aprovar' | 'devolverLogistica' | 'devolverQualidade';

  const decisaoAdmin = useCallback(
    (id: string, acao: AcaoAdmin, observacao: string) => {
      const aprovacao: AprovacaoAdmin = {
        aprovador: 'Administrador',
        data: agoraISO(),
        decisao: acao === 'aprovar' ? 'Aprovado' : 'Devolvido',
        observacao,
      };
      patch(id, (r) => ({
        ...r,
        aprovacaoAdmin: aprovacao,
        status: acao === 'aprovar' ? 'Finalizado' : acao === 'devolverLogistica' ? 'Aguardando Caminhão' : 'Ag. Qualidade',
      }));
    },
    [patch],
  );

  const restaurarDemo = useCallback(() => setRomaneios(gerarMock()), []);

  return { romaneios, emitirRomaneio, finalizarConferencia, enviarLaudo, decisaoAdmin, restaurarDemo };
}

export type Store = ReturnType<typeof useIcopalletStore>;
