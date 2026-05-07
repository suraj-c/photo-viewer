import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement these APIs the app touches; provide minimal stubs.
if (typeof URL.createObjectURL !== 'function') {
  // @ts-expect-error -- adding to URL for jsdom
  URL.createObjectURL = (obj: Blob) => `blob:mock/${(obj as Blob).size ?? 0}-${Math.random().toString(36).slice(2)}`;
}
if (typeof URL.revokeObjectURL !== 'function') {
  // @ts-expect-error -- adding to URL for jsdom
  URL.revokeObjectURL = () => undefined;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-expect-error -- partial stub is fine for tests
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  // @ts-expect-error -- minimal stub
  globalThis.ResizeObserver = class {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
}
