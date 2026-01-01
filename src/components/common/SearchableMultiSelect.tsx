import { useEffect, useId, useMemo, useRef, useState, type ReactElement } from 'react';

export type SearchableMultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type Props = {
  label: string;
  options: SearchableMultiSelectOption[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  pageSize?: number;
};

/**
 * Preline-style "Search inside dropdown" multi-select (search box inside menu).
 * Implemented in React to avoid relying on Preline runtime JS APIs.
 */
export function SearchableMultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Search…',
  disabled = false,
  pageSize,
}: Props) {
  const reactId = useId();
  const buttonId = `sms-${reactId}-button`;
  const listboxId = `sms-${reactId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const closeMenu = () => {
    setIsOpen(false);
    setQuery('');
    setCurrentPage(1);
  };

  const openMenu = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery('');
    setCurrentPage(1);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o]));
    return selectedValues.map((v) => map.get(v)).filter(Boolean) as SearchableMultiSelectOption[];
  }, [options, selectedValues]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const isPaginationEnabled = typeof pageSize === 'number' && pageSize > 0;
  const totalPages = useMemo(() => {
    if (!isPaginationEnabled) return 1;
    return Math.max(1, Math.ceil(filteredOptions.length / pageSize));
  }, [filteredOptions.length, isPaginationEnabled, pageSize]);

  const effectivePage = useMemo(() => {
    if (!isPaginationEnabled) return 1;
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, isPaginationEnabled, totalPages]);

  const startIndex = useMemo(() => {
    if (!isPaginationEnabled) return 0;
    return (effectivePage - 1) * pageSize;
  }, [effectivePage, isPaginationEnabled, pageSize]);

  const endIndex = useMemo(() => {
    if (!isPaginationEnabled) return filteredOptions.length;
    return Math.min(startIndex + pageSize, filteredOptions.length);
  }, [filteredOptions.length, isPaginationEnabled, pageSize, startIndex]);

  const paginatedOptions = useMemo(() => {
    if (!isPaginationEnabled) return filteredOptions;
    return filteredOptions.slice(startIndex, endIndex);
  }, [endIndex, filteredOptions, isPaginationEnabled, startIndex]);

  const setPageSafe = (page: number) => {
    if (!isPaginationEnabled) return;
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
  };

  const buildHiddenPageGroups = (visiblePages: number[]) => {
    const groups: number[][] = [];
    for (let i = 0; i < visiblePages.length - 1; i++) {
      const a = visiblePages[i];
      const b = visiblePages[i + 1];
      if (b > a + 1) {
        const group: number[] = [];
        for (let p = a + 1; p <= b - 1; p++) group.push(p);
        groups.push(group);
      } else {
        groups.push([]);
      }
    }
    return groups;
  };

  const toggleValue = (value: string) => {
    const next = selectedSet.has(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(Array.from(new Set(next)));
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        closeMenu();
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Bind (nested) Preline dropdowns for the pagination ellipsis menu
    window.HSStaticMethods?.autoInit();
  }, [effectivePage, isOpen, totalPages]);

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>

      <button
        id={buttonId}
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (isOpen) closeMenu();
          else openMenu();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeMenu();
        }}
      >
        <span className="truncate text-left">
          {selectedOptions.length > 0 ? (
            <span className="text-slate-900">
              {selectedOptions.length} selected
              <span className="text-slate-500"> (click to edit)</span>
            </span>
          ) : (
            <span className="text-slate-500">Select books…</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          role="dialog"
          aria-label={`${label} options`}
        >
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (isPaginationEnabled) setCurrentPage(1);
                }}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') closeMenu();
                }}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z"
                />
              </svg>
            </div>
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-64 overflow-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">No matching books.</li>
            ) : (
              paginatedOptions.map((o) => {
                const checked = selectedSet.has(o.value);
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={checked}
                    className={`px-4 py-2 cursor-pointer select-none hover:bg-slate-50 ${
                      o.disabled ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (o.disabled) return;
                      toggleValue(o.value);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={checked}
                        readOnly
                        tabIndex={-1}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{o.label}</div>
                        {o.description ? (
                          <div className="text-xs text-slate-500 truncate">{o.description}</div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {isPaginationEnabled && filteredOptions.length > pageSize ? (
            <div className="px-3 py-3 border-t border-slate-100 bg-white">
              <div className="mb-2 text-xs text-slate-600 font-medium">
                Showing <span className="text-slate-900">{startIndex + 1}</span>-
                <span className="text-slate-900">{endIndex}</span> of{' '}
                <span className="text-slate-900">{filteredOptions.length}</span>
              </div>

              <nav className="flex items-center gap-x-1" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => setPageSafe(effectivePage - 1)}
                  disabled={effectivePage === 1}
                  className="inline-flex items-center justify-center size-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition"
                  aria-label="Previous page"
                >
                  <svg
                    className="size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                    />
                  </svg>
                </button>

                {(() => {
                  const visiblePages =
                    totalPages <= 7
                      ? Array.from({ length: totalPages }, (_, i) => i + 1)
                      : (() => {
                          const pageSet = new Set<number>();
                          pageSet.add(1);
                          pageSet.add(totalPages);
                          pageSet.add(effectivePage);
                          pageSet.add(effectivePage - 1);
                          pageSet.add(effectivePage + 1);

                          return Array.from(pageSet)
                            .filter((p) => p >= 1 && p <= totalPages)
                            .sort((a, b) => a - b);
                        })();

                  const gapGroups = buildHiddenPageGroups(visiblePages);

                  const renderPageButton = (page: number) => {
                    const isActive = page === effectivePage;
                    return (
                      <button
                        key={`page-${page}`}
                        type="button"
                        onClick={() => setPageSafe(page)}
                        aria-current={isActive ? 'page' : undefined}
                        className={[
                          'inline-flex items-center justify-center size-9 rounded-lg border transition font-semibold text-xs',
                          isActive
                            ? 'bg-linear-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-glow'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {page}
                      </button>
                    );
                  };

                  const renderGapDropdown = (pages: number[], gapIndex: number) => {
                    if (pages.length === 0) return null;
                    const dropdownId = `sms-pagination-more-${reactId}-${gapIndex}`;
                    return (
                      <div key={`gap-${gapIndex}`} className="hs-dropdown relative inline-flex">
                        <button
                          id={dropdownId}
                          type="button"
                          className="hs-dropdown-toggle inline-flex items-center justify-center size-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                          aria-label="More pages"
                        >
                          <span className="text-base leading-none">…</span>
                          <svg
                            className="hs-dropdown-open:rotate-180 ms-1 size-3 transition-transform"
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                          >
                            <path d="M1.5 5.5l6 6 6-6" />
                          </svg>
                        </button>

                        <div
                          className="hs-dropdown-menu transition-[opacity,margin] duration-200 hs-dropdown-open:opacity-100 opacity-0 hidden min-w-32 bg-white shadow-xl rounded-xl p-2 mt-2 border border-slate-200"
                          aria-labelledby={dropdownId}
                        >
                          {pages.map((p) => (
                            <button
                              key={`gap-page-${p}`}
                              type="button"
                              onClick={() => setPageSafe(p)}
                              className={[
                                'w-full text-left flex items-center justify-between gap-x-3 py-2 px-3 rounded-lg text-sm font-medium transition',
                                p === effectivePage
                                  ? 'bg-violet-50 text-violet-700'
                                  : 'text-slate-700 hover:bg-slate-100',
                              ].join(' ')}
                            >
                              <span>Page {p}</span>
                              {p === effectivePage && <span className="text-xs">Current</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  };

                  const parts: ReactElement[] = [];
                  for (let i = 0; i < visiblePages.length; i++) {
                    parts.push(renderPageButton(visiblePages[i]));
                    if (i < visiblePages.length - 1) {
                      const gapEl = renderGapDropdown(gapGroups[i] ?? [], i);
                      if (gapEl) parts.push(gapEl);
                    }
                  }
                  return parts;
                })()}

                <button
                  type="button"
                  onClick={() => setPageSafe(effectivePage + 1)}
                  disabled={effectivePage === totalPages}
                  className="inline-flex items-center justify-center size-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition"
                  aria-label="Next page"
                >
                  <svg
                    className="size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 bg-white">
            <button
              type="button"
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
              onClick={() => {
                onChange([]);
              }}
              disabled={selectedValues.length === 0}
            >
              Clear
            </button>
            <button
              type="button"
              className="px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              onClick={closeMenu}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {selectedOptions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.map((o) => (
            <span
              key={o.value}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
            >
              <span className="max-w-[260px] truncate">{o.label}</span>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                aria-label={`Remove ${o.label}`}
                onClick={() => removeValue(o.value)}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}


