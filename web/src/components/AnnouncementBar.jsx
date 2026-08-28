import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ANNOUNCEMENTS } from '../lib/homeContent';
import { EASE } from '../lib/motion';

const ROTATE_MS = 5000;

// Slim rotating bar above the navbar. Deliberately a timed crossfade rather
// than a continuously-scrolling marquee: perpetual motion in a fixed strip
// is exactly the kind of animation-for-its-own-sake the brief rules out, and
// it never rests long enough to actually be read.
export default function AnnouncementBar() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ANNOUNCEMENTS.length <= 1) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="announcement-bar">
      {/* aria-live is intentionally off: this is ambient marketing copy that
          rotates on a timer, and announcing each rotation would interrupt
          screen-reader users mid-task for no benefit. All three messages are
          rendered for assistive tech in the visually-hidden list below. */}
      <div className="container announcement-bar-inner" aria-hidden="true">
        <motion.span
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE }}
        >
          {ANNOUNCEMENTS[index]}
        </motion.span>
      </div>
      <ul className="sr-only">
        {ANNOUNCEMENTS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
