import { useEffect, useRef, useState, useCallback } from 'react';
import toastLib, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Config visual por tipo de toast                                    */
/* ------------------------------------------------------------------ */

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    accent: '#10B981',
    accentSoft: 'rgba(16, 185, 129, 0.12)',
  },
  error: {
    icon: XCircle,
    accent: '#EF4444',
    accentSoft: 'rgba(239, 68, 68, 0.12)',
  },
  warning: {
    icon: AlertTriangle,
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.12)',
  },
  info: {
    icon: Info,
    accent: 'var(--accent)',
    accentSoft: 'var(--accent-glow)',
  },
  loading: {
    icon: Loader2,
    accent: 'var(--accent)',
    accentSoft: 'var(--accent-glow)',
  },
};

/* ------------------------------------------------------------------ */
/*  Tarjeta de toast individual                                        */
/* ------------------------------------------------------------------ */

function ToastCard({ t, type, message }) {
  const config = VARIANTS[type] ?? VARIANTS.info;
  const Icon = config.icon;
  const isLoading = type === 'loading';

  const duration = t.duration ?? 4000;
  const [progress, setProgress] = useState(100);
  const remainingRef = useRef(duration);
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);
  const dismissTimerRef = useRef(null);

  const clearTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const left = Math.max(remainingRef.current - elapsed, 0);
    setProgress((left / duration) * 100);
    if (left > 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [duration]);

  useEffect(() => {
    if (isLoading || duration === Infinity) return undefined;

    startRef.current = Date.now();
    dismissTimerRef.current = setTimeout(() => {
      toastLib.dismiss(t.id);
    }, remainingRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = () => {
    if (isLoading || duration === Infinity) return;
    const elapsed = Date.now() - startRef.current;
    remainingRef.current = Math.max(remainingRef.current - elapsed, 0);
    clearTimers();
  };

  const handleMouseLeave = () => {
    if (isLoading || duration === Infinity) return;
    startRef.current = Date.now();
    dismissTimerRef.current = setTimeout(() => {
      toastLib.dismiss(t.id);
    }, remainingRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: t.visible ? 1 : 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background:
          'color-mix(in srgb, var(--bg-card) 72%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${config.accent}`,
        boxShadow:
          '0 10px 30px -8px rgba(0,0,0,0.25), 0 4px 10px -4px rgba(0,0,0,0.1)',
      }}
      className="relative flex w-80 max-w-[90vw] items-start gap-3 overflow-hidden rounded-xl px-4 py-3 font-sans"
    >
      <div
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: config.accentSoft, color: config.accent }}
      >
        <Icon size={15} className={isLoading ? 'animate-spin' : ''} />
      </div>

      <p className="flex-1 pt-0.5 text-sm font-medium leading-snug text-text-primary">
        {message}
      </p>

      {!isLoading && (
        <button
          onClick={() => toastLib.dismiss(t.id)}
          aria-label="Cerrar notificación"
          className="mt-0.5 shrink-0 rounded-md p-0.5 text-text-muted transition-colors hover:bg-black/5 hover:text-text-primary dark:hover:bg-white/10"
        >
          <X size={14} />
        </button>
      )}

      {!isLoading && duration !== Infinity && (
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/5 dark:bg-white/5">
          <div
            style={{
              width: `${progress}%`,
              background: config.accent,
              transition: 'width 100ms linear',
            }}
            className="h-full"
          />
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  API pública: toast.success / error / warning / info / loading      */
/* ------------------------------------------------------------------ */

function fire(type, message, opts = {}) {
  return toastLib.custom(
    (t) => <ToastCard t={t} type={type} message={message} />,
    { duration: 4000, ...opts }
  );
}

export const toast = {
  success: (message, opts) => fire('success', message, opts),
  error: (message, opts) => fire('error', message, opts),
  warning: (message, opts) => fire('warning', message, opts),
  info: (message, opts) => fire('info', message, opts),
  loading: (message, opts) => fire('loading', message, { duration: Infinity, ...opts }),
  dismiss: (id) => toastLib.dismiss(id),
  promise: (promise, messages, opts) => {
    const id = toast.loading(messages.loading ?? 'Cargando...', opts);
    promise
      .then((res) => {
        toast.dismiss(id);
        toast.success(
          typeof messages.success === 'function'
            ? messages.success(res)
            : messages.success ?? 'Listo',
          opts
        );
        return res;
      })
      .catch((err) => {
        toast.dismiss(id);
        toast.error(
          typeof messages.error === 'function'
            ? messages.error(err)
            : messages.error ?? 'Algo salió mal',
          opts
        );
        throw err;
      });
    return promise;
  },
};

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export default function ToastProvider() {
  // Los toasts se crean con toast.success/error/warning/info/loading (arriba),
  // cada uno ya trae su propio render (ToastCard) vía toastLib.custom().
  // Toaster solo se encarga de posicionar y animar la entrada/salida del stack.
  return <Toaster position="top-right" reverseOrder={false} gutter={12} />;
}