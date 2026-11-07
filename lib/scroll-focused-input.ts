let keyboardScrollGuardInstalled = false;

function installKeyboardScrollGuard() {
  if (keyboardScrollGuardInstalled || typeof window === "undefined") return;
  keyboardScrollGuardInstalled = true;

  const viewport = window.visualViewport;
  if (!viewport) return;

  let keyboardOpen = window.innerHeight - viewport.height > 120;
  let savedScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (keyboardOpen) savedScrollY = window.scrollY;
  }, { passive: true });

  viewport.addEventListener("resize", () => {
    const nextKeyboardOpen = window.innerHeight - viewport.height > 120;
    if (nextKeyboardOpen) {
      if (!keyboardOpen) savedScrollY = window.scrollY;
      keyboardOpen = true;
      return;
    }

    if (keyboardOpen) {
      keyboardOpen = false;
      const restoreScroll = () => window.scrollTo({ top: savedScrollY, left: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        restoreScroll();
        requestAnimationFrame(restoreScroll);
      });
      // Some Android WebViews apply their own scroll correction after the
      // visual viewport has finished resizing.
      window.setTimeout(restoreScroll, 100);
    }
  });
}

export function scrollFocusedInputIntoView(element: HTMLElement, revealThrough?: HTMLElement | null) {
  if (typeof window === "undefined") return;
  installKeyboardScrollGuard();

  const check = () => {
    if (!element.isConnected || document.activeElement !== element) return;

    const viewport = window.visualViewport;
    const visibleTop = viewport?.offsetTop ?? 0;
    const visibleBottom = visibleTop + (viewport?.height ?? window.innerHeight);
    const focusedRect = element.getBoundingClientRect();
    const endRect = revealThrough?.getBoundingClientRect();
    const rect = endRect
      ? { top: Math.min(focusedRect.top, endRect.top), bottom: Math.max(focusedRect.bottom, endRect.bottom) }
      : focusedRect;
    const margin = 24;
    let delta = 0;

    if (rect.bottom > visibleBottom - margin) {
      delta = rect.bottom - (visibleBottom - margin);
    } else if (rect.top < visibleTop + margin) {
      delta = rect.top - (visibleTop + margin);
    }

    if (Math.abs(delta) <= 2) return;

    // Keep the focused field clear of the on-screen keyboard on iOS and Android.
    window.scrollBy({ top: delta, left: 0, behavior: "smooth" });
  };

  // A tap opens the keyboard asynchronously. Recheck after its viewport resize,
  // but only for this explicit focus event; manual finger scrolling is untouched.
  requestAnimationFrame(check);
  [160, 360, 620, 900].forEach(delay => window.setTimeout(check, delay));
}
