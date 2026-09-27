/** Ilustrações vetoriais do pátio: caminhão com container (vista lateral) e container em perspectiva. */

export interface ArtPalette {
  body: string; // cor principal do container
  rib: string; // nervuras
  dark: string; // lateral escura / cabine
  bg: string; // fundo do quadro
  ground: string; // faixa do chão
}

export const ART: Record<'teal' | 'rose' | 'amber' | 'emerald' | 'vinho' | 'slate', ArtPalette> = {
  teal: { body: '#0e7c74', rib: '#12948a', dark: '#0a5c56', bg: '#e3f4f2', ground: '#c9e9e5' },
  rose: { body: '#be123c', rib: '#e11d48', dark: '#9f1239', bg: '#ffe8ec', ground: '#fecdd6' },
  amber: { body: '#c2690a', rib: '#e08a1e', dark: '#9a520a', bg: '#fdf1e1', ground: '#f7dcb5' },
  emerald: { body: '#0f7a4f', rib: '#14955f', dark: '#0b5c3b', bg: '#e2f5ec', ground: '#c3e8d6' },
  vinho: { body: '#8b1a1a', rib: '#a83232', dark: '#6e1414', bg: '#fbeeee', ground: '#f2d4d4' },
  slate: { body: '#475569', rib: '#64748b', dark: '#334155', bg: '#f1f5f9', ground: '#e2e8f0' },
};

/** Caminhão com container, vista lateral. */
export function TruckArt({ p = ART.teal, code, width = 220, className }: { p?: ArtPalette; code?: string; width?: number; className?: string }) {
  const ribs = Array.from({ length: 10 }, (_, i) => 30 + i * 12);
  return (
    <svg width={width} height={(width * 84) / 220} viewBox="0 0 220 84" className={className} role="img" aria-label="Caminhão com container">
      <rect x="0" y="74" width="220" height="10" fill={p.ground} />
      <ellipse cx="108" cy="75" rx="96" ry="3" fill="#141821" opacity="0.1" />
      <rect x="18" y="16" width="130" height="48" rx="3" fill={p.body} />
      <rect x="18" y="16" width="130" height="5" rx="2" fill={p.dark} />
      <g stroke={p.rib} strokeWidth="2">
        {ribs.map((x) => (
          <line key={x} x1={x} y1="23" x2={x} y2="60" />
        ))}
      </g>
      {code && (
        <>
          <rect x="48" y="33" width="70" height="15" rx="2" fill="#ffffff" />
          <text x="83" y="44" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="8" fontWeight="600" fill={p.body}>
            {code.slice(0, 13)}
          </text>
        </>
      )}
      <rect x="14" y="64" width="176" height="6" fill="#141821" />
      <path d="M152 28 h24 q6 0 9 5 l12 19 q2 3 2 7 v11 h-47 z" fill="#141821" />
      <path d="M158 33 h16 q4 0 6 3 l9 14 h-31 z" fill="#d9eef3" />
      <rect x="190" y="60" width="8" height="4" rx="1" fill="#f6c453" />
      {[40, 60, 130, 182].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="72" r="8" fill="#141821" />
          <circle cx={cx} cy="72" r="3" fill="#c7ccd4" />
        </g>
      ))}
    </svg>
  );
}

/** Container em perspectiva isométrica. */
export function ContainerArt({ p = ART.rose, width = 150, className }: { p?: ArtPalette; width?: number; className?: string }) {
  const ribs = [72, 84, 96, 108, 120, 132];
  return (
    <svg width={width} height={(width * 80) / 150} viewBox="0 0 150 80" className={className} role="img" aria-label="Container">
      <polygon points="10,62 60,76 140,56 140,60 60,80 10,66" fill="#141821" opacity="0.12" />
      <polygon points="10,26 90,6 140,20 60,40" fill={p.rib} />
      <polygon points="10,26 60,40 60,76 10,62" fill={p.dark} />
      <polygon points="60,40 140,20 140,56 60,76" fill={p.body} />
      <g stroke={p.dark} strokeWidth="2">
        {ribs.map((x, i) => (
          <line key={x} x1={x} y1={37 - i * 3} x2={x} y2={73 - i * 3} />
        ))}
      </g>
      <g stroke={p.body} strokeWidth="1.5" opacity="0.7">
        <line x1="27" y1="31" x2="27" y2="67" />
        <line x1="43" y1="35" x2="43" y2="71" />
      </g>
      <rect x="33" y="48" width="4" height="8" rx="1" fill="#f6c453" />
    </svg>
  );
}

/** Pilha de fardos de madeira (para estoque / finalizado). */
export function FardosArt({ p = ART.emerald, width = 150, className }: { p?: ArtPalette; width?: number; className?: string }) {
  const tabua = (x: number, y: number, w: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height="12" rx="2" fill="#d9a066" />
      <rect x={x} y={y} width="10" height="12" rx="2" fill="#b97a3f" />
    </g>
  );
  return (
    <svg width={width} height={(width * 80) / 150} viewBox="0 0 150 80" className={className} role="img" aria-label="Fardos de madeira">
      <rect x="0" y="70" width="150" height="10" fill={p.ground} />
      {tabua(20, 56, 110)}
      {tabua(20, 43, 110)}
      {tabua(30, 30, 90)}
      {tabua(40, 17, 70)}
      <rect x="60" y="14" width="4" height="56" fill={p.body} />
      <rect x="92" y="14" width="4" height="56" fill={p.body} />
    </svg>
  );
}

/** Paleta da ilustração conforme a etapa da carga. */
export function artDoStatus(status: string): ArtPalette {
  if (status === 'Aguardando Caminhão') return ART.teal;
  if (status === 'Ag. Qualidade') return ART.rose;
  if (status === 'Ag. Aprovação Admin') return ART.amber;
  return ART.emerald;
}
