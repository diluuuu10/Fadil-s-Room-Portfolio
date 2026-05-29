/* ============================================================
   Device detection — one source of truth.
   "Mobile" here means: narrow viewport AND a primary touch input.
   We don't want to downgrade iPad-with-trackpad users.
============================================================ */

const MOBILE_MAX_WIDTH = 1000;

/**
 * Returns true when the user should get the mobile fallback UI.
 *
 * The check is based on viewport width primarily, but ALSO requires
 * either a coarse (touch) pointer or a small screen. This keeps the
 * desktop site available for iPads with keyboards/trackpads and
 * for users who resize their browser narrow on a real machine.
 */
export function isMobile() {
  const narrow = window.innerWidth < MOBILE_MAX_WIDTH;
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const noHover =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none)").matches;
  const tinyScreen = window.innerWidth < 600 || window.innerHeight < 600;

  // If the screen is very small, downgrade unconditionally.
  if (tinyScreen) return true;
  // Otherwise downgrade only when narrow AND has touch.
  return narrow && (coarse || noHover);
}

/**
 * For Camera framing: returns a t value 0..1 where 0 = wide desktop
 * and 1 = phone portrait. Lets us interpolate FOV and camera position.
 */
export function mobileness() {
  const w = window.innerWidth;
  if (w >= 1200) return 0;
  if (w <= 380) return 1;
  return (1200 - w) / (1200 - 380);
}

export const MOBILE_BREAKPOINT = MOBILE_MAX_WIDTH;
