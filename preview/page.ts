// Page helpers of the preview: finding elements of index.html and remembering settings between visits.

export const elementById = <ElementType extends Element = HTMLElement>(id: string): ElementType => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing in index.html`);
  return element as unknown as ElementType;
};

// localStorage can be unavailable (private mode, blocked storage): settings are then simply not remembered
export const settings = {
  read: (key: string): string | null => {
    try { return localStorage.getItem(`morphico.${key}`); } catch { return null; }
  },
  write: (key: string, value: string): void => {
    try { localStorage.setItem(`morphico.${key}`, value); } catch { /* not remembered */ }
  },
};
