import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared by Modal.jsx and SidePanel.jsx: move focus in on open, keep Tab
// cycling inside while open, restore focus to the trigger on close.
// containerRef must point at the panel's outermost DOM node (the one with
// role="dialog"); active is the same open/visible flag the caller tracks.
export function useFocusTrap(containerRef, active) {
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    triggerRef.current = document.activeElement;

    // Called synchronously, not deferred to a rAF/next frame: by the time
    // this effect runs, React has already committed the container (and its
    // children) to the DOM -- refs attach during commit, strictly before
    // any useEffect fires -- so there's no async gap here to wait out.
    const container = containerRef.current;
    const initialFocusable = container?.querySelectorAll(FOCUSABLE_SELECTOR);
    (initialFocusable?.[0] || container)?.focus();

    function onKeyDown(e) {
      if (e.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [active, containerRef]);
}
