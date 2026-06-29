import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toastService } from '../../services/toastService';

export default function LoginView() {
  const [formData, setFormData] = useState({ id_interno: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Llamamos a la función global del contexto
    const result = await login(formData.id_interno, formData.password);

    if (result.success) {
      toastService.success('Bienvenido al sistema FacAdmin');
    } else {
      toastService.error(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen min-h-screen flex bg-app overflow-hidden">
      {/*
        Estilos locales del login. Usan los mismos tokens de Tailwind del resto
        de la app (bg-app, bg-inputBg, border-border, text-accent, etc.) y solo
        añaden las animaciones y el degradado de marca (#002D4C / #00B3E1) que
        no existían como utilidades. Se inyectan aquí porque esta vista vive
        sola en su propia ruta, así que no hay riesgo de colisión de nombres.
      */}
      <style>{`
        @keyframes loginFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes loginSlideIn { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes loginFloat { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-14px) rotate(3deg); } }
        @keyframes loginScan { 0% { transform:translateY(-10%); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateY(110%); opacity:0; } }
        @keyframes loginPulseDot { 0%,100% { opacity:.25; transform:scale(1); } 50% { opacity:1; transform:scale(1.5); } }
        @keyframes loginGradientMove { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }

        .login-visual { background: linear-gradient(120deg, #002D4C 0%, #013a61 45%, #00b3e1 130%); background-size: 200% 200%; animation: loginGradientMove 14s ease-in-out infinite; }
        .login-scanline { animation: loginScan 4.5s linear infinite; }
        .login-float { animation: loginFloat 6s ease-in-out infinite; }
        .login-dot { animation: loginPulseDot 2.4s ease-in-out infinite; }
        .login-enter-l { animation: loginSlideIn .7s cubic-bezier(.22,1,.36,1) both; }
        .login-enter-r { animation: loginFadeUp .7s cubic-bezier(.22,1,.36,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .login-visual, .login-scanline, .login-float, .login-dot, .login-enter-l, .login-enter-r, [class*="login-step-"] {
            animation: none !important;
          }
        }
      `}</style>

      {/* ===== Panel visual — mitad de pantalla en escritorio ===== */}
      <div className="login-visual relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden login-enter-l">
        {/* Cuadrícula sutil de fondo */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />

        {/* Línea de "escaneo" — guiño al control de inventario */}
        <div className="absolute inset-x-0 top-0 h-1/3 login-scanline bg-gradient-to-b from-cyan-200/0 via-cyan-100/30 to-cyan-200/0 blur-md pointer-events-none" />

        {/*
          FOTO INSTITUCIONAL:
          Si la imagen no carga, el onError la oculta y el panel se queda
          con el degradado de marca como respaldo, así nunca se ve roto.
        */}
        <img
          src="../assets/hero.png"
          alt="Almacén de insumos FacAdmin BUAP"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 pointer-events-none"
        />

        {/* Iconografía flotante */}
        <svg className="login-float absolute top-24 right-16 w-14 h-14 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
        <svg className="login-float absolute bottom-32 left-10 w-10 h-10 text-cyan-200/35" style={{ animationDelay: '1.5s' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>

        {/* Puntos pulsantes — referencia visual a trazabilidad de insumos */}
        <span className="login-dot absolute top-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-cyan-200" style={{ animationDelay: '.2s' }} />
        <span className="login-dot absolute top-1/2 left-2/3 w-1.5 h-1.5 rounded-full bg-cyan-200" style={{ animationDelay: '1s' }} />
        <span className="login-dot absolute bottom-1/4 left-1/2 w-1.5 h-1.5 rounded-full bg-cyan-200" style={{ animationDelay: '1.8s' }} />

        {/* Marca, arriba */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="font-heading font-black text-white/90 tracking-wide text-sm uppercase">BUAP · FacAdmin</span>
        </div>

        {/* Frase de marca, abajo */}
        <div className="relative z-10 max-w-sm">
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-heading font-bold mb-3">Control de almacén</p>
          <h1 className="text-3xl font-heading font-black text-white leading-tight tracking-tight">
            Cada insumo,<br />en su lugar,<br />en tiempo real.
          </h1>
        </div>
      </div>

      {/* ===== Panel de formulario ===== */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        {/* Franja de marca solo en móvil, reemplaza al panel visual */}
        <div className="login-visual lg:hidden absolute top-0 inset-x-0 h-24 flex items-center px-6 overflow-hidden">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/15">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-heading font-black text-white/90 text-xs uppercase tracking-wide">BUAP · FacAdmin</span>
          </div>
        </div>

        <div className="login-enter-r w-full max-w-sm mt-24 lg:mt-0">
          <div className="mb-8">
            <h2 className="text-[1.7rem] font-heading font-black text-text-primary tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-text-muted mt-1.5">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div style={{ animation: 'loginFadeUp .5s ease both', animationDelay: '.05s' }}>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5 tracking-wide">
                Matrícula / ID
              </label>
              <input
                type="text"
                name="id_interno"
                required
                autoComplete="off"
                value={formData.id_interno}
                onChange={handleChange}
                placeholder="Ej: EMP-2026-0001"
                className="w-full bg-inputBg border border-border rounded-xl p-3.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
              />
            </div>

            <div style={{ animation: 'loginFadeUp .5s ease both', animationDelay: '.12s' }}>
              <label className="block text-[0.7rem] font-heading font-bold uppercase text-text-muted mb-1.5 tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-inputBg border border-border rounded-xl p-3.5 pr-11 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ animation: 'loginFadeUp .5s ease both', animationDelay: '.2s' }}
              className="w-full mt-2 bg-accent text-white font-heading font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando…
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <p className="text-center text-[0.7rem] text-text-muted mt-8">
            Sistema interno de inventario · BUAP
          </p>
        </div>
      </div>
    </div>
  );
}