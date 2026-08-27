import { useEffect, useState } from 'react';

// True once the observed element has exited the viewport via the TOP
// (scrolled past going down) -- false both while it's visible and while
// it's still below the fold. Checking boundingClientRect.top (not just
// isIntersecting) matters because on a short viewport the element can
// start below the fold; without this it would read as "scrolled past" the
// instant the page loads, before any scrolling happened.
export function useScrolledPast(ref) {
  const [scrolledPast, setScrolledPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return scrolledPast;
}
