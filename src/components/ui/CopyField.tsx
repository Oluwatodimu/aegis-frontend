import { useState } from 'react';
import { Button } from './Button';

/** A read-only value with a Copy button. */
export function CopyField({ value, label, display }: { value: string; label: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the user can still select the text */
    }
  };
  return (
    <div className="copy-field">
      <span className="value" title={value}>{display ?? value}</span>
      <Button size="sm" onClick={copy} aria-label={`Copy ${label}`}>{copied ? 'Copied' : 'Copy'}</Button>
    </div>
  );
}
