import { X } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DepartmentRole, Status } from '../types';

/* ───────── Tema por perfil ───────── */

export interface Tema {
  nome: string;
  primario: string; // botão principal
  texto: string; // texto de destaque
  suave: string; // fundo suave
  ponto: string; // indicador sólido
}

export const TEMAS: Record<DepartmentRole, Tema> = {
  admin: { nome: 'Administrador', primario: 'bg-vinho hover:bg-vinho-600 text-white', texto: 'text-vinho', suave: 'bg-vinho-50', ponto: 'bg-vinho' },
  logistica: { nome: 'Logística', primario: 'bg-teal-700 hover:bg-teal-800 text-white', texto: 'text-teal-700', suave: 'bg-teal-50', ponto: 'bg-teal-600' },
  qualidade: { nome: 'Qualidade', primario: 'bg-rose-700 hover:bg-rose-800 text-white', texto: 'text-rose-700', suave: 'bg-rose-50', ponto: 'bg-rose-600' },
};

export const TemaContext = createContext<Tema>(TEMAS.admin);
export const useTema = () => useContext(TemaContext);

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ───────── Primitivos ───────── */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-line bg-white shadow-card', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, icon, actions }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && <div className="grid h-9 w-9 place-items-center rounded-xl bg-canvas text-ink">{icon}</div>}
        <div>
          <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning' | 'dark';

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  type = 'button',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const tema = useTema();
  const variants: Record<BtnVariant, string> = {
    primary: tema.primario,
    ghost: 'text-ink-soft hover:bg-canvas',
    outline: 'border border-line bg-white text-ink hover:bg-canvas',
    danger: 'bg-red-700 hover:bg-red-800 text-white',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    dark: 'bg-ink hover:bg-black text-white',
  };
  const sizes = { sm: 'h-9 px-3 text-xs rounded-lg', md: 'h-11 px-4 text-sm rounded-xl', lg: 'h-12 px-5 text-sm rounded-xl' };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Botão grande com ícone em caixa + título + subtítulo (ações principais). */
export function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
  tone = 'dark',
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  tone?: 'dark' | 'light';
}) {
  const tema = useTema();
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex h-14 items-center gap-3 rounded-2xl pl-2.5 pr-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        tone === 'dark' ? 'bg-ink text-white hover:bg-black' : 'border border-line bg-white text-ink hover:bg-canvas',
      )}
    >
      <span className={cx('grid h-9 w-9 place-items-center rounded-xl', tone === 'dark' ? tema.primario : cx(tema.suave, tema.texto))}>{icon}</span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        {subtitle && <span className={cx('block text-xs', tone === 'dark' ? 'text-slate-300' : 'text-muted')}>{subtitle}</span>}
      </span>
    </button>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:bg-canvas disabled:text-muted';

export const textareaCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200';

export const numCls =
  'w-full min-w-[64px] h-9 rounded-lg border border-line bg-white px-2 text-right font-mono text-xs text-ink focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-canvas disabled:text-ink-soft';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-bold', className)}>{children}</span>;
}

const STATUS_CLS: Partial<Record<Status, string>> = {
  'Aguardando Caminhão': 'bg-teal-50 text-teal-800',
  'Ag. Recebimento': 'bg-teal-50 text-teal-800',
  'Em Recebimento': 'bg-cyan-50 text-cyan-800',
  'Ag. Qualidade': 'bg-rose-50 text-rose-700',
  'Ag. Aprovação Admin': 'bg-amber-50 text-amber-800',
  Finalizado: 'bg-emerald-50 text-emerald-800',
  OK: 'bg-emerald-50 text-emerald-800',
  Liberado: 'bg-emerald-50 text-emerald-800',
  Divergente: 'bg-orange-50 text-orange-800',
  'Divergente confirmado': 'bg-orange-50 text-orange-800',
  'Enviar para Qualidade': 'bg-rose-50 text-rose-700',
  Reprovado: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Partial<Record<Status, string>> = {
  'Aguardando Caminhão': 'Aguardando caminhão',
  'Ag. Qualidade': 'Na Qualidade',
  'Ag. Aprovação Admin': 'Decisão do Admin',
  Finalizado: 'No estoque',
};

export function StatusBadge({ status }: { status: Status | string }) {
  return <Badge className={STATUS_CLS[status as Status] ?? 'bg-slate-100 text-slate-700'}>{STATUS_LABEL[status as Status] ?? status}</Badge>;
}

export type Tone = 'teal' | 'rose' | 'amber' | 'emerald' | 'slate' | 'vinho';

export const TONE: Record<Tone, { dot: string; tile: string; text: string; solid: string }> = {
  teal: { dot: 'bg-teal-600', tile: 'bg-teal-50 text-teal-700', text: 'text-teal-700', solid: 'bg-teal-700 hover:bg-teal-800 text-white' },
  rose: { dot: 'bg-rose-600', tile: 'bg-rose-50 text-rose-700', text: 'text-rose-700', solid: 'bg-rose-700 hover:bg-rose-800 text-white' },
  amber: { dot: 'bg-amber-600', tile: 'bg-amber-50 text-amber-700', text: 'text-amber-700', solid: 'bg-amber-600 hover:bg-amber-700 text-white' },
  emerald: { dot: 'bg-emerald-600', tile: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', solid: 'bg-emerald-700 hover:bg-emerald-800 text-white' },
  slate: { dot: 'bg-slate-500', tile: 'bg-slate-100 text-slate-700', text: 'text-slate-700', solid: 'bg-ink hover:bg-black text-white' },
  vinho: { dot: 'bg-vinho', tile: 'bg-vinho-50 text-vinho', text: 'text-vinho', solid: 'bg-vinho hover:bg-vinho-600 text-white' },
};

export function KpiCard({
  label,
  value,
  icon,
  tone,
  hint,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: Tone;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lift disabled:cursor-default"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cx('grid h-11 w-11 place-items-center rounded-xl', TONE[tone].tile)}>{icon}</span>
        {hint && <span className="text-[11px] font-semibold text-muted">{hint}</span>}
      </div>
      <div>
        <div className="font-display text-3xl font-bold tabular-nums text-ink">{value}</div>
        <div className="text-[13px] font-semibold text-ink-soft">{label}</div>
      </div>
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-4xl',
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  icon?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-3 backdrop-blur-sm sm:p-6" onMouseDown={onClose}>
      <div className={cx('my-4 w-full rounded-3xl bg-white shadow-2xl', width)} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            {icon && <div className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink">{icon}</div>}
            <div>
              <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-canvas hover:text-ink" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas/60 px-6 py-4 rounded-b-3xl">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, art }: { icon?: ReactNode; title: string; text?: string; art?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {art ?? <div className="grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-muted">{icon}</div>}
      <p className="mt-1 font-display text-sm font-bold text-ink">{title}</p>
      {text && <p className="max-w-sm text-xs text-muted">{text}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-sm font-medium text-muted">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[32px] sm:leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx('rounded-lg px-3 py-2 text-xs font-bold transition', value === o.value ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Barra de divergência com marcação do teto de 20% (escala 0–40%). */
export function Meter({ value, teto = 20, max = 40 }: { value: number; teto?: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const cor = value >= teto ? 'bg-rose-600' : value > 0 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cx('absolute inset-y-0 left-0 rounded-full', cor)} style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }} />
        <div className="absolute -bottom-0.5 -top-0.5 w-0.5 bg-ink" style={{ left: `${(teto / max) * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
        <span>0%</span>
        <span>teto {teto}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

/* ───────── Toast ───────── */

type ToastMsg = { id: number; text: string; tone: 'ok' | 'warn' | 'err' };
const ToastContext = createContext<(text: string, tone?: ToastMsg['tone']) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);
  const push = (text: string, tone: ToastMsg['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setMsgs((m) => [...m, { id, text, tone }]);
    setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 4200);
  };
  const tones = {
    ok: 'bg-emerald-600',
    warn: 'bg-amber-500',
    err: 'bg-red-600',
  };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
        {msgs.map((m) => (
          <div key={m.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink shadow-lift">
            <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', tones[m.tone])} />
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const selectSmCls =
  'w-full h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-canvas disabled:text-ink-soft';

/** Item de fila (lista lateral) com miniatura ilustrada. */
export function QueueItem({
  active,
  tone,
  art,
  title,
  aside,
  lines,
  onClick,
}: {
  active: boolean;
  tone: Tone;
  art: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  lines: ReactNode[];
  onClick: () => void;
}) {
  const ring: Record<Tone, string> = {
    teal: 'ring-teal-300',
    rose: 'ring-rose-300',
    amber: 'ring-amber-300',
    emerald: 'ring-emerald-300',
    slate: 'ring-slate-300',
    vinho: 'ring-vinho-100',
  };
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink',
        active ? cx('bg-white shadow-card ring-2', ring[tone]) : 'hover:bg-white',
      )}
    >
      <span className={cx('grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl', TONE[tone].tile)}>{art}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-display text-sm font-bold text-ink">{title}</span>
          {aside}
        </span>
        {lines.map((l, i) => (
          <span key={i} className="mt-0.5 block truncate font-mono text-[11px] text-muted">
            {l}
          </span>
        ))}
      </span>
    </button>
  );
}

/** Etapas numeradas horizontais com ícone. */
export function Steps({ tone, items }: { tone: Tone; items: { icon: ReactNode; title: string; text: string }[] }) {
  return (
    <ol className="grid gap-3 rounded-3xl bg-canvas p-3 md:grid-cols-3">
      {items.map((it, i) => (
        <li key={it.title} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-card">
          <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TONE[tone].tile)}>{it.icon}</span>
          <span>
            <span className="block text-[11px] font-bold text-muted">Etapa {i + 1}</span>
            <span className="block font-display text-sm font-bold text-ink">{it.title}</span>
            <span className="mt-0.5 block text-xs leading-snug text-muted">{it.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
