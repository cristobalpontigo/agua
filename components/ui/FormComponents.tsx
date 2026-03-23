/**
 * COMPONENTES REUTILIZABLES - Inputs, Selects, Botones
 * Reducen duplicación de código
 */

'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-blue-300 mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-4 py-2 border-2 border-slate-600 rounded-lg 
          bg-slate-700 text-white placeholder-slate-400
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition ${error ? 'border-red-500 ring-1 ring-red-500' : ''} ${className}
        `}
      />
      {error && <p className="text-red-400 text-sm mt-1">✕ {error}</p>}
      {helperText && <p className="text-slate-400 text-xs mt-1">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-blue-300 mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-4 py-2 border-2 border-slate-600 rounded-lg 
          bg-slate-700 text-white font-medium
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition ${error ? 'border-red-500 ring-1 ring-red-500' : ''} ${className}
        `}
      >
        <option value="">-- Selecciona una opción --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-sm mt-1">✕ {error}</p>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600',
    danger: 'from-red-600 to-red-500 hover:from-red-700 hover:to-red-600',
    success: 'from-green-600 to-green-500 hover:from-green-700 hover:to-green-600',
    secondary: 'from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        bg-gradient-to-r ${variants[variant]}
        text-white font-bold ${sizes[size]} rounded-lg
        transition transform hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {isLoading && <span className="animate-spin">⚙</span>}
      {children}
    </button>
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`
        bg-gradient-to-br from-slate-800 to-slate-900 
        border-2 border-slate-700 rounded-xl p-6 
        shadow-2xl hover:border-blue-500 transition
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}

export function Badge({ variant = 'info', children, className = '', ...props }: BadgeProps) {
  const variants = {
    success: 'bg-green-900 text-green-200 border-green-600',
    error: 'bg-red-900 text-red-200 border-red-600',
    warning: 'bg-orange-900 text-orange-200 border-orange-600',
    info: 'bg-blue-900 text-blue-200 border-blue-600',
  };

  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border ${variants[variant]} font-semibold text-sm ${className}`}
    >
      {children}
    </span>
  );
}
