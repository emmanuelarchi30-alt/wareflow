import { motion } from 'framer-motion';

export function GlassPanel({ children, className = '', hero = false, hover = true, ...props }) {
  return (
    <motion.div
      className={`rounded-2xl ${hero ? 'glass-hero' : 'glass'} ${hover ? 'glass-hover' : ''} ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function GlassCard({ children, className = '', ...props }) {
  return (
    <motion.div
      className={`card-glass ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function GlassInput({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-secondary mb-2">{label}</label>}
      <input
        className={`input-glass ${error ? 'border-status-critical' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-status-critical" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function GlassButton({ children, variant = 'primary', className = '', disabled, loading, ...props }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      className={`relative px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 ${
        isPrimary ? 'btn-primary' : 'btn-secondary'
      } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

export function GlassSelect({ label, options, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-secondary mb-2">{label}</label>}
      <select
        className={`input-glass appearance-none ${error ? 'border-status-critical' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        <option value="" disabled>Seleccionar...</option>
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-status-critical" role="alert">{error}</p>}
    </div>
  );
}

export function SeverityBadge({ severity, className = '' }) {
  const colors = {
    critical: 'bg-status-critical/20 text-status-critical border-status-critical/30',
    warning: 'bg-status-warning/20 text-status-warning border-status-warning/30',
    good: 'bg-status-good/20 text-status-good border-status-good/30',
  };
  const labels = { critical: 'Crítico', warning: 'Advertencia', good: 'OK' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[severity]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[severity]}
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const colors = {
    high: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
    medium: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30',
    low: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
  };
  const labels = { high: 'Alta', medium: 'Media', low: 'Baja' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[priority]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[priority]}
    </span>
  );
}