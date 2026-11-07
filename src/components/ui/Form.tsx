import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** A single <input>, <select> or <textarea>. It gets its id and aria wiring automatically. */
  children: ReactElement<Record<string, unknown>>;
}

/** Label + control + hint/error, correctly linked for screen readers. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': hint || error ? hintId : undefined,
      })
    : children;
  return (
    <div className="field">
      <label htmlFor={id} className="label">{label}</label>
      {control}
      {error ? (
        <span id={hintId} className="error-text">{error}</span>
      ) : (
        hint && <span id={hintId} className="hint">{hint}</span>
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

/** A labelled on/off row used in settings. */
export function ToggleRow({ title, hint, checked, onChange, disabled }: { title: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="toggle-row">
      <div className="stack" style={{ ['--gap' as string]: '3px' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}
