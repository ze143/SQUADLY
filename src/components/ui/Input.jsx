import { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      error,
      helper,
      icon: Icon,
      className = "",
      containerClassName = "",
      required = false,
      ...props
    },
    ref,
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
          {Icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            className={[
              "w-full rounded-lg border bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm",
              "transition focus:outline-none focus:ring-2",
              Icon ? "pr-10" : "",
              error
                ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500",
              "disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        </div>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {!error && helper && (
          <p className="text-slate-500 text-xs mt-1">{helper}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
