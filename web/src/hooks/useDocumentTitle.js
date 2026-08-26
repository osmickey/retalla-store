import { useEffect } from 'react';

// A single SPA shell otherwise loses the per-page <title> every raw HTML
// page used to set for itself.
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
