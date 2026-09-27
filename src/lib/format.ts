export const fmtM3 = (n: number, casas = 3) =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })} m³`;

export const fmtNum = (n: number, casas = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const fmtPct = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export const fmtSigned = (n: number, casas = 0) => `${n > 0 ? '+' : ''}${fmtNum(n, casas)}`;

export function fmtData(iso?: string) {
  if (!iso) return '—';
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return iso;
  return timePart ? `${d}/${m}/${y} ${timePart.slice(0, 5)}` : `${d}/${m}/${y}`;
}

export const hoje = () => new Date().toISOString().slice(0, 10);
export const agoraISO = () => new Date().toISOString().slice(0, 16);

/** Copia texto com fallback para ambientes sem Clipboard API. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
