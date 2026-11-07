import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="row spread" style={{ alignItems: 'flex-end', ['--gap' as string]: '16px' }}>
      <div className="stack" style={{ ['--gap' as string]: '6px' }}>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-sub">{description}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
