import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Catches any path outside this app's 6 Phase-1 routes — most usefully, it
// turns an accidental navigate()-instead-of-window.location.href mistake
// into an obvious "not part of this app yet" screen instead of a blank page.
export default function NotFoundPage() {
  useDocumentTitle('Page not found — Retalla');

  return (
    <main className="container">
      <div className="policy-page">
        <h1>This page isn't part of the new site yet</h1>
        <p>
          This part of Retalla hasn't been migrated to the new build yet. Go back to{' '}
          <a href="/index.html">the homepage</a>.
        </p>
      </div>
    </main>
  );
}
