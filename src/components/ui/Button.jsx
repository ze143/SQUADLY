import { forwardRef } from 'react';

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700',
  ghost: 'hover:bg-slate-100 text-slate-700',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  icon: 'p-2',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      disabled = false,
      loading = false,
      type = 'button',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const classes = [
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
      'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} type={type} disabled={disabled || loading} className={classes} {...props}>
        {loading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;