export {};

declare global {
  interface Window {
    HSStaticMethods?: {
      autoInit: () => void;
    };
    HSOverlay?: {
      open: (selector: string | HTMLElement) => void;
      close: (selector: string | HTMLElement) => void;
    };

    __amplifyAuth?: {
      fetchAuthSession: () => Promise<unknown>;
      getCurrentUser: () => Promise<unknown>;
    };
  }
}
