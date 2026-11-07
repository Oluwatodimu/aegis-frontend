import { useState } from 'react';
import { Button, CopyField, WarningIcon } from './ui';

/**
 * Shows a newly issued client secret exactly once.
 *
 * The secret lives only in React state for this screen. It is never written
 * to localStorage, the URL or logs, and disappears when the user clicks Done
 * or leaves the page.
 */
export function SecretReveal({ secret, onDone }: { secret: string; onDone: () => void }) {
  const [stored, setStored] = useState(false);
  return (
    <section className="alert alert-warn" style={{ flexDirection: 'column', gap: 12, padding: '18px 20px' }} aria-labelledby="secret-title">
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', ['--gap' as string]: '10px' }}>
        <WarningIcon />
        <div className="stack" style={{ ['--gap' as string]: '4px' }}>
          <h2 id="secret-title" className="section-title">Copy your client secret now</h2>
          <p style={{ color: '#5C4200' }}>
            Aegis stores only a hash. Once you leave this page the secret can’t be shown again — if it’s lost, rotate it.
            Store it in a secrets manager, never in browser code or a repository.
          </p>
        </div>
      </div>
      <CopyField value={secret} label="client secret" />
      <div className="row spread">
        <label className="check">
          <input type="checkbox" checked={stored} onChange={(e) => setStored(e.target.checked)} /> I’ve stored this secret securely
        </label>
        <Button variant="primary" disabled={!stored} onClick={onDone}>Done</Button>
      </div>
    </section>
  );
}
