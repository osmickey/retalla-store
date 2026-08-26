import { ICON_PATHS } from './paths';

// Replaces the old renderIcons()/data-icon hydration pattern — a normal
// reactive component now, so callers no longer need to manually re-invoke
// anything after a DOM change (e.g. the password-visibility toggle just
// swaps the `name` prop via useState).
export default function Icon({ name, size = 22, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // ICON_PATHS is a hardcoded internal constant, never user input.
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  );
}
