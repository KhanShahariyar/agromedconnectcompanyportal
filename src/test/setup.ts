import '@testing-library/jest-dom/vitest'

/**
 * jsdom ships no matchMedia. Without it, any component that asks about the
 * viewport throws on mount — which is how seven shell tests started failing at
 * once. This reports the jsdom window width so breakpoint logic is exercised
 * rather than stubbed out.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string): MediaQueryList => {
    const min = /min-width:\s*(\d+)px/.exec(query)
    const max = /max-width:\s*(\d+)px/.exec(query)
    const width = window.innerWidth
    const matches = (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList
  }) as typeof window.matchMedia
}
