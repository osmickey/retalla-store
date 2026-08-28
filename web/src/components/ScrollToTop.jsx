import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Client-side navigation keeps the window's scroll position, so opening a
// product from halfway down the homepage previously landed you halfway down
// the product page. Resets to the top on every real page change.
//
// Two deliberate exclusions:
//  - Keyed on pathname only. Shop's filters and Account's tabs navigate by
//    changing the query string on the same path; jumping to the top on every
//    filter toggle would be its own bug.
//  - Skipped on POP (browser back/forward), where the browser restores the
//    previous scroll position itself. Overriding that would lose the reader's
//    place in a product list every time they backed out of a product.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    // style.css sets `html { scroll-behavior: smooth }` globally, which would
    // otherwise animate a long scroll back up on every navigation. Suspending
    // it around the jump is more portable than ScrollToOptions'
    // `behavior: 'instant'`, which throws on older Safari.
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = previous;
    // navigationType is read but deliberately NOT a dependency: it can change
    // on a same-path query-string navigation (a filter toggle), and including
    // it would re-fire the scroll there -- the exact case the pathname-only
    // key exists to avoid. It's always current anyway, since a navigation
    // re-renders this component before the effect runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
