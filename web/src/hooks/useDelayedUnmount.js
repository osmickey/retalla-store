import { useEffect, useState } from 'react';

// AnimatePresence's exit-completion tracking needs a real animation-frame
// signal (rAF / Web Animations API) to know when it's safe to unmount a
// child -- that signal can be unreliable in contexts where the tab is
// backgrounded or hidden (confirmed in this project's own sandboxed test
// browser: exit animations built with AnimatePresence got permanently stuck
// mounted there, with framer-motion version making no difference). This
// gives the same "stay mounted while exiting" behavior via a plain timer
// instead, so the element always actually unmounts after `delayMs`,
// independent of whatever completion signal the animation library uses.
// Pair with `animate` (not `initial`/`exit`) on the child, toggling its
// target based on the original `isMounted` flag, not the delayed one.
export function useDelayedUnmount(isMounted, delayMs) {
  const [shouldRender, setShouldRender] = useState(isMounted);

  useEffect(() => {
    let timer;
    if (isMounted) {
      setShouldRender(true);
    } else {
      timer = setTimeout(() => setShouldRender(false), delayMs);
    }
    return () => clearTimeout(timer);
  }, [isMounted, delayMs]);

  return shouldRender;
}
