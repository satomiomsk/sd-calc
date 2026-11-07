export function scrollFocusedInputIntoView(element: HTMLElement) {
  if (typeof window === "undefined") return;

  const check = () => {
    if (!element.isConnected || document.activeElement !== element) return;

    const viewport = window.visualViewport;
    const visibleTop = viewport?.offsetTop ?? 0;
    const visibleBottom = visibleTop + (viewport?.height ?? window.innerHeight);
    const rect = element.getBoundingClientRect();
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
