import { useEffect, useRef, useState } from 'react';

interface AdvancedSelectProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function AdvancedSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  required = false,
}: AdvancedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required ? '*' : ''}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((s) => !s)}
        className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between focus:outline-none"
      >
        <span className="text-sm text-slate-900">{value || <span className="text-slate-400">{placeholder}</span>}</span>
        <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">No results</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50"
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}