import { X } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DepartmentRole, Status } from '../types';

/* ───────── Tema por perfil ───────── */

export interface Tema {
  nome: string;
  primario: string; // botão principal
  texto: string; // texto de destaque
  borda: string;
  suave: string; // fundo suave
  anel: string; // focus ring
  ponto: string; // indicador sólido
}

export const TEMAS: Record<DepartmentRole, Tema> = {
  admin: {
    nome: 'Administrador',
    primario: 'bg-vinho hover:bg-vinho-400 text-white',
    texto: 'text-red-300',
    borda: 'border-vinho/60',
    suave: 'bg-vinho/15',
    anel: 'focus:ring-vinho-400/60',
    ponto: 'bg-vinho-400',
  },
  logistica: {
    nome: 'Logística',
    primario: 'bg-teal-600 hover:bg-teal-500 text-white',
    texto: 'text-teal-300',
    borda: 'border-teal-500/50',
    suave: 'bg-teal-500/10',
    anel: 'focus:ring-teal-400/60',
    ponto: 'bg-teal-400',
  },
  qualidade: {
    nome: 'Qualidade',
    primario: 'bg-rose-600 hover:bg-rose-500 text-white',
    texto: 'text-rose-300',
    borda: 'border-rose-500/50',
    suave: 'bg-rose-500/10',
    anel: 'focus:ring-rose-400/60',
    ponto: 'bg-rose-400',
  },
};

export const TemaContext = createContext<Tema>(TEMAS.admin);
export const useTema = () => useContext(TemaContext);

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ───────── Primitivos ───────── */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-lg shadow-black/20', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, icon, actions }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-zinc-400">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';

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
    ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
    outline: 'border border-zinc-700 text-zinc-200 hover:bg-zinc-800',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-3 text-sm' };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600/40 disabled:opacity-60';

export const numCls =
  'w-full min-w-[64px] rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-right font-mono text-xs text-zinc-100 focus:border-zinc-500 focus:outline-none';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold', className)}>{children}</span>;
}

const STATUS_CLS: Partial<Record<Status, string>> = {
  'Aguardando Caminhão': 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  'Ag. Recebimento': 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  'Em Recebimento': 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  'Ag. Qualidade': 'border-red-500/50 bg-red-500/10 text-red-300',
  'Ag. Aprovação Admin': 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  Finalizado: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  OK: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Liberado: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Divergente: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  'Divergente confirmado': 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  'Enviar para Qualidade': 'border-red-500/50 bg-red-500/10 text-red-300',
  Reprovado: 'border-red-600/60 bg-red-600/15 text-red-300',
};

export function StatusBadge({ status }: { status: Status | string }) {
  return <Badge className={STATUS_CLS[status as Status] ?? 'border-zinc-600 bg-zinc-800 text-zinc-300'}>{status}</Badge>;
}

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
  tone: 'sky' | 'red' | 'amber' | 'emerald' | 'zinc';
  hint?: string;
  onClick?: () => void;
}) {
  const tones = {
    sky: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    red: 'text-red-300 bg-red-500/10 border-red-500/30',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    zinc: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/30',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="group rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-left transition enabled:hover:border-zinc-600 disabled:cursor-default"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className={cx('rounded-lg border p-1.5', tones[tone])}>{icon}</span>
      </div>
      <div className="mt-3 font-mono text-3xl font-bold tabular-nums text-zinc-50">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-zinc-500">{hint}</div>}
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
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={onClose}>
      <div className={cx('my-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl', width)} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-800 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="rounded-full border border-zinc-800 bg-zinc-900 p-3 text-zinc-500">{icon}</div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {text && <p className="max-w-sm text-xs text-zinc-500">{text}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md px-3 py-1.5 text-xs font-medium transition',
            value === o.value ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          {o.label}
        </button>
      ))}
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
    ok: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
    warn: 'border-amber-500/40 bg-amber-950/90 text-amber-100',
    err: 'border-red-500/40 bg-red-950/90 text-red-100',
  };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
        {msgs.map((m) => (
          <div key={m.id} className={cx('pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur', tones[m.tone])}>
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
