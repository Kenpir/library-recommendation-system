export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ToastPayload = {
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs?: number;
};

const TOAST_EVENT_NAME = 'app-toast';

export function emitToast(payload: ToastPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT_NAME, { detail: payload }));
}

export function onToast(handler: (payload: ToastPayload) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<ToastPayload>;
    if (!custom.detail) return;
    handler(custom.detail);
  };

  window.addEventListener(TOAST_EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(TOAST_EVENT_NAME, listener as EventListener);
}


