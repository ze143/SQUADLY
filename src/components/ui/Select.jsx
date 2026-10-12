import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(
  (
    {
      label,
      error,
      helper,
      options = [],
      placeholder = '-- اختر --',
      className = '',
      containerClassName = '',
      required = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 pl-10 text-sm appearance-none',
              'transition focus:outline-none focus:ring-2',
              error
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <ChevronDown
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {!error && helper && <p className="text-slate-500 text-xs mt-1">{helper}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;