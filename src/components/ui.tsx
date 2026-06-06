import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/* =========================================================================
   Primitives UI VulgaRuRale — présentationnel, on-brand, server-safe.
   Tokens sémantiques uniquement (aucune couleur en dur). Un seul rayon
   (--radius), focus visible accent, motion-reduce respecté. Labels au-dessus
   des champs, erreurs sous le champ (cf. frontend-craft).
   ========================================================================= */

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const pressable =
  'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'border border-border text-foreground hover:bg-surface',
  ghost: 'text-muted hover:text-foreground hover:bg-surface',
  danger:
    'border border-danger-border bg-danger-surface text-danger hover:opacity-90',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5',
};

/** Classes d'un bouton — réutilisables sur <button> ET sur <Link>. */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition disabled:pointer-events-none disabled:opacity-50',
    focusRing,
    pressable,
    variantClass[variant],
    sizeClass[size],
    className,
  ].join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass({ variant, size, className })} {...props} />;
}

/* ---- Champs de formulaire ---- */

const controlBase =
  `w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted transition focus-visible:border-accent ${focusRing}`;

function FieldShell({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <input
        id={name}
        name={name}
        aria-describedby={hint ? `${name}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className={`${controlBase} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function TextareaField({
  name,
  label,
  hint,
  error,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <textarea
        id={name}
        name={name}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className={`${controlBase} resize-y ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <select
        id={name}
        name={name}
        className={`${controlBase} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/** Case à cocher native (a11y/clavier gratuits), teintée accent. */
export function CheckboxField({
  name,
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { name: string; label: ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-foreground">
      <input
        id={name}
        name={name}
        type="checkbox"
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border-border accent-accent ${focusRing} ${className}`}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

/* ---- Bannières d'état ---- */

type BannerTone = 'success' | 'warning' | 'danger' | 'info';

const bannerClass: Record<BannerTone, string> = {
  success: 'border-success-border bg-success-surface text-success',
  warning: 'border-warning-border bg-warning-surface text-warning',
  danger: 'border-danger-border bg-danger-surface text-danger',
  info: 'border-border bg-surface text-muted',
};

export function Banner({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: BannerTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-[var(--radius)] border px-4 py-3 text-sm ${bannerClass[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---- En-tête de page éditorial ---- */

export function PageHeader({
  title,
  lead,
  eyebrow,
  actions,
}: {
  title: string;
  lead?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {lead && <p className="mt-2 max-w-[55ch] text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 gap-3">{actions}</div>}
    </div>
  );
}
