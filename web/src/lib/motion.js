// Shared easing for new components -- existing files across the app inline
// this same curve individually; not retrofitting those here (out of scope
// for this task), just giving new code one place to import it from.
export const EASE = [0.16, 1, 0.3, 1];
export const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
