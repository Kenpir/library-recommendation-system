import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { emitConfirmResult, onConfirmRequest, type ConfirmPopupOptions } from '@/utils/confirm';

type PendingConfirm = {
  id: string;
  options: ConfirmPopupOptions;
};

function ConfirmContent({
  options,
  onCancel,
  onConfirm,
}: {
  options: ConfirmPopupOptions;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmText = options.confirmText ?? (options.variant === 'danger' ? 'Delete' : 'Confirm');
  const cancelText = options.cancelText ?? 'Cancel';

  const confirmClass =
    options.variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
      : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500';

  return (
    <div>
      <p className="text-slate-700 leading-relaxed">{options.message}</p>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-semibold"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-white transition-colors font-semibold focus:outline-hidden focus:ring-2 ${confirmClass}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}

/**
 * Global confirmation popup host.
 * Mount once near the root (e.g. in `App.tsx`).
 */
export function ConfirmViewport() {
  const [queue, setQueue] = useState<PendingConfirm[]>([]);

  useEffect(() => {
    return onConfirmRequest((req) => {
      setQueue((prev) => [...prev, { id: req.id, options: req.options }]);
    });
  }, []);

  const active = queue[0];
  const isOpen = !!active;

  const closeWith = (ok: boolean) => {
    if (!active) return;
    emitConfirmResult(active.id, ok);
    setQueue((prev) => prev.slice(1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeWith(false)}
      title={active?.options.title ?? 'Confirm'}
    >
      {active ? (
        <ConfirmContent
          options={active.options}
          onCancel={() => closeWith(false)}
          onConfirm={() => closeWith(true)}
        />
      ) : (
        <div />
      )}
    </Modal>
  );
}


