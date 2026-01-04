export type ConfirmPopupOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
};

type ConfirmRequestDetail = {
  id: string;
  options: ConfirmPopupOptions;
};

type ConfirmResultDetail = {
  id: string;
  ok: boolean;
};

const REQUEST_EVENT = 'app-confirm-request';
const RESULT_EVENT = 'app-confirm-result';

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Opens a global confirm popup and resolves to true/false based on the user's choice.
 *
 * Usage:
 *   if (!(await confirmPopup({ title: 'Delete', message: 'Are you sure?' }))) return;
 */
export function confirmPopup(options: ConfirmPopupOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  const id = makeId();

  return new Promise<boolean>((resolve) => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<ConfirmResultDetail>;
      if (!custom.detail || custom.detail.id !== id) return;
      window.removeEventListener(RESULT_EVENT, handler as EventListener);
      resolve(custom.detail.ok);
    };

    window.addEventListener(RESULT_EVENT, handler as EventListener);
    window.dispatchEvent(
      new CustomEvent<ConfirmRequestDetail>(REQUEST_EVENT, {
        detail: { id, options },
      })
    );
  });
}

export function onConfirmRequest(handler: (req: ConfirmRequestDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<ConfirmRequestDetail>;
    if (!custom.detail) return;
    handler(custom.detail);
  };

  window.addEventListener(REQUEST_EVENT, listener as EventListener);
  return () => window.removeEventListener(REQUEST_EVENT, listener as EventListener);
}

export function emitConfirmResult(id: string, ok: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ConfirmResultDetail>(RESULT_EVENT, { detail: { id, ok } }));
}


