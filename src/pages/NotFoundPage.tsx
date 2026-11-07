import { ButtonLink } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="state" style={{ minHeight: '60vh', justifyContent: 'center' }}>
      <strong style={{ fontSize: 18 }}>Page not found</strong>
      <span className="muted">The page you’re looking for doesn’t exist or you don’t have access to it.</span>
      <ButtonLink to="/" variant="primary">Back to dashboard</ButtonLink>
    </div>
  );
}
