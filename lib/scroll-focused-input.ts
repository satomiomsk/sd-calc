export function scrollFocusedInputIntoView(element: HTMLElement) {
  if (typeof window === "undefined") return;
  const view = window.visualViewport;
  const check = () => {
    if (!element.isConnected || document.activeElement !== element) return;
    const rect = element.getBoundingClientRect();
    const top = view?.offsetTop ?? 0;
    const bottom = top + (view?.height ?? window.innerHeight);
    const margin = 20;
    let delta = 0;
    if (rect.bottom > bottom - margin) delta = rect.bottom - (bottom - margin);
    else if (rect.top < top + margin) delta = rect.top - (top + margin);
    if (Math.abs(delta) > 2) window.scrollBy({ top: delta, left: 0, behavior: "smooth" });
  };
  // Run only on explicit focus/tap, not while the user manually scrolls.
  requestAnimationFrame(() => {
    check();
    window.setTimeout(check, 180);
    window.setTimeout(check, 420);
  });
}
