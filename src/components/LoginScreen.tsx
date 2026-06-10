import React, { useState, useEffect } from 'react';
import { Key, Mail, ArrowRight, AlertCircle, Eye, EyeOff, UserPlus, LogIn, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, doc, getDoc, setDoc, signInWithEmailAndPassword, verifyEmailCode, resendVerificationCode, sendPasswordResetEmail, confirmPasswordReset } from '../services/backendClient';
import { Usuario } from '../types';
import TapaselLogo from './TapaselLogo';

interface LoginScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}


const ROLES_DISPONIBLES = [
  { value: 'ADMIN', label: 'Administrador general', permisos: ['panel','finanzas','rrhh','documentos','produccion','configuracion'] },
  { value: 'CFO',   label: 'Director Ejecutivo', permisos: ['panel','finanzas','documentos'] },
  { value: 'RRHH',  label: 'Gestión Talento Humano', permisos: ['panel','rrhh','produccion','documentos'] },
  { value: 'COO',   label: 'Director de Operaciones', permisos: ['panel','produccion','documentos'] },
];

const translateError = (message: string): string => {
  if (!message) return 'Ha ocurrido un error inesperado. Intente nuevamente.';
  const msg = message.toLowerCase();
  if (msg.includes("signups are disabled") || msg.includes("signup is disabled")) {
    return "El registro de usuarios está desactivado para este proyecto.";
  }
  if (msg.includes("already exists") || msg.includes("unique constraint")) {
    return "El usuario ya se encuentra registrado con este correo.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("credentials match")) {
    return "Credenciales de inicio de sesión inválidas. Verifique su correo y contraseña.";
  }
  if (msg.includes("email not verified") || msg.includes("not verified")) {
    return "Debe ir a tu correo electrónico y confirmar tu cuenta para poder acceder al aplicativo.";
  }
  if (msg.includes("password should be") || msg.includes("weak password")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (msg.includes("invalid otp") || msg.includes("invalid verification code") || msg.includes("incorrect code")) {
    return "Código de verificación inválido. Intente nuevamente.";
  }
  if (msg.includes("user not found") || msg.includes("no user found")) {
    return "Usuario no encontrado en el sistema. Cree una cuenta primero.";
  }
  return message;
};

type FormMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<FormMode>('login');
  const [emailInput, setEmailInput]     = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nombreInput, setNombreInput]   = useState('');
  const [cargoInput, setCargoInput]     = useState('');
  const [rolInput, setRolInput]         = useState('ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [confirmResetPasswordInput, setConfirmResetPasswordInput] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('code');
    if (token) {
      setResetToken(token);
      setMode('reset');
      // Clean up the URL query parameters so they don't persist on reload
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const handleResendCode = async () => {
    if (!verificationEmail) return;
    setResendStatus('sending');
    setErrorMessage('');
    try {
      await resendVerificationCode(verificationEmail);
      setResendStatus('success');
      setTimeout(() => setResendStatus('idle'), 5000);
    } catch (err: any) {
      setResendStatus('error');
      setErrorMessage(translateError(err.message || 'Error al reenviar el código.'));
    }
  };

  // Reset errors on mode switch
  const switchMode = (next: FormMode) => {
    setMode(next);
    setErrorMessage('');
    setSuccessMessage('');
    setEmailInput('');
    setPasswordInput('');
    setNombreInput('');
    setCargoInput('');
    setVerificationCode('');
    setVerificationEmail('');
    setResetPasswordInput('');
    setConfirmResetPasswordInput('');
  };

  // ── Email / Password login ──────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!emailInput.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico institucional.');
      return;
    }
    try {
      const result = await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput) as any;
      if (result && result.requireEmailVerification) {
        setVerificationEmail(result.email);
        setMode('verify');
        return;
      }
      const userDoc = await getDoc(doc(db, 'usuarios', emailInput.trim()));
      if (!userDoc.exists()) {
        setErrorMessage('Usuario no encontrado en el sistema. Cree una cuenta primero.');
        return;
      }
      onLoginSuccess(userDoc.data() as Usuario);
    } catch (err: any) {
      setErrorMessage(translateError(err.message || 'Credenciales inválidas. Verifique su correo y contraseña.'));
    }
  };

  // ── Register new user ───────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!nombreInput.trim() || !emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage('Todos los campos son obligatorios.');
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      const rolObj = ROLES_DISPONIBLES.find(r => r.value === rolInput) || ROLES_DISPONIBLES[0];
      const newUser: Usuario = {
        id: emailInput.trim().toLowerCase(),
        nombre: nombreInput.trim(),
        email: emailInput.trim().toLowerCase(),
        cargo: cargoInput.trim() || rolObj.label,
        rol: rolInput as Usuario['rol'],
        avatarInitials: nombreInput.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
        permisos: rolObj.permisos,
      };
      const result = await setDoc(doc(db, 'usuarios', newUser.id), { ...newUser, password: passwordInput }) as any;
      if (result && result.requireEmailVerification) {
        setVerificationEmail(newUser.email);
        setMode('verify');
      } else {
        onLoginSuccess(newUser);
      }
    } catch (err: any) {
      setErrorMessage(translateError(err.message || 'Error al crear la cuenta. Intente nuevamente.'));
    }
  };

  // ── Email verification OTP code ─────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setErrorMessage('Por favor ingrese el código de 6 dígitos.');
      return;
    }
    try {
      const loggedInUser = await verifyEmailCode(verificationEmail, verificationCode.trim());
      onLoginSuccess(loggedInUser as Usuario);
    } catch (err: any) {
      setErrorMessage(translateError(err.message || 'Código de verificación inválido. Intente nuevamente.'));
    }
  };

  // ── Forgot Password Request ─────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!emailInput.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico institucional.');
      return;
    }
    setIsSubmittingReset(true);
    try {
      await sendPasswordResetEmail(emailInput.trim());
      setSuccessMessage('Hemos enviado un enlace para restablecer tu contraseña a tu correo electrónico. Por favor revisa tu bandeja de entrada.');
      setEmailInput('');
    } catch (err: any) {
      setErrorMessage(translateError(err.message || 'Error al enviar el correo de restablecimiento. Intente nuevamente.'));
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // ── Reset Password Submit ───────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!resetPasswordInput.trim() || !confirmResetPasswordInput.trim()) {
      setErrorMessage('Todos los campos son obligatorios.');
      return;
    }
    if (resetPasswordInput.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (resetPasswordInput !== confirmResetPasswordInput) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmittingReset(true);
    try {
      await confirmPasswordReset(resetToken, resetPasswordInput);
      setSuccessMessage('Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.');
      setTimeout(() => {
        switchMode('login');
      }, 3000);
    } catch (err: any) {
      setErrorMessage(translateError(err.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.'));
    } finally {
      setIsSubmittingReset(false);
    }
  };


  const selectedRolObj = ROLES_DISPONIBLES.find(r => r.value === rolInput) || ROLES_DISPONIBLES[0];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 sm:p-6 antialiased font-sans relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 blur-[100px] rounded-full"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 50, 0], rotate: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-primary/5 blur-[100px] rounded-full"
        />
      </div>

      {/* Main card */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-3xl shadow-2xl p-7 sm:p-10 z-10 flex flex-col gap-6 relative"
      >
        {/* Logo & heading */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-5">
            <TapaselLogo className="h-14 w-auto" isDarkTheme={false} />
          </div>
          <p className="font-mono text-[9px] text-brand-primary uppercase tracking-widest font-bold">
            Orquestador General ERP &amp; Auditoría IA
          </p>
          <p className="text-slate-500 text-xs mt-3 max-w-xs mx-auto leading-relaxed">
            {mode === 'login'
              ? 'Ingrese sus credenciales corporativas para acceder al sistema.'
              : mode === 'register'
              ? 'Complete los datos para crear su cuenta de acceso.'
              : mode === 'forgot'
              ? 'Ingrese su correo electrónico institucional para recibir un enlace de restablecimiento de contraseña.'
              : mode === 'reset'
              ? 'Ingrese y confirme su nueva contraseña de acceso.'
              : `Debe ir a tu correo electrónico y confirmar tu cuenta para poder acceder al aplicativo.`}
          </p>
        </div>

        {/* Mode tabs */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Crear Cuenta
            </button>
          </div>
        )}

        {mode === 'verify' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2.5">
            <Mail className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold text-left leading-normal">
              Debe ir a tu correo electrónico y confirmar tu cuenta para poder acceder al aplicativo.
            </span>
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2.5"
            >
              <Mail className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="colaborador@tapasel.co"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 bg-transparent border-none focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-brand-primary hover:underline bg-transparent border-none cursor-pointer p-0 font-medium"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-container text-white font-display font-bold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none shadow-md shadow-brand-primary/20"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="colaborador@tapasel.co"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReset}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-container text-white font-display font-bold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none shadow-md shadow-brand-primary/20 disabled:opacity-50"
            >
              <span>{isSubmittingReset ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Regresar al Inicio de Sesión
              </button>
            </div>
          </form>
        )}

        {/* ── RESET PASSWORD FORM ── */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Nueva Contraseña (mín. 6 caracteres)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={resetPasswordInput}
                  onChange={e => setResetPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 bg-transparent border-none focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmResetPasswordInput}
                  onChange={e => setConfirmResetPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReset}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-container text-white font-display font-bold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none shadow-md shadow-brand-primary/20 disabled:opacity-50"
            >
              <span>{isSubmittingReset ? 'Restableciendo...' : 'Restablecer contraseña'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  value={nombreInput}
                  onChange={e => setNombreInput(e.target.value)}
                  placeholder="Ej. María Fernanda López"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>
            </div>

            {/* Cargo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Cargo o Posición
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cargoInput}
                  onChange={e => setCargoInput(e.target.value)}
                  placeholder="Ej. Analista Financiero"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 px-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="usuario@tapasel.co"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Contraseña (mín. 6 caracteres)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-10 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 bg-transparent border-none focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Rol */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                Rol en el Sistema
              </label>
              <div className="relative">
                <select
                  value={rolInput}
                  onChange={e => setRolInput(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl py-3 pl-4 pr-8 text-xs text-slate-800 outline-none transition-all focus:ring-1 focus:ring-brand-primary/30 cursor-pointer"
                >
                  {ROLES_DISPONIBLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[9px] text-slate-400 font-mono">
                Permisos: {selectedRolObj.permisos.join(', ')}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-container text-white font-display font-bold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none shadow-md shadow-brand-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta y Acceder</span>
            </button>
          </form>
        )}

        {/* ── VERIFICATION FORM ── */}
        {mode === 'verify' && (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 animate-bounce">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-slate-700 text-xs font-medium leading-relaxed">
                Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>
              <p className="text-emerald-700 text-xs font-bold block mt-1">
                Debe ir a tu correo electrónico y confirmar tu cuenta para poder acceder al aplicativo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-container text-white font-display font-bold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none shadow-md shadow-brand-primary/20"
            >
              <span>Ir al Inicio de Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex justify-center items-center gap-2 text-xs mt-2">
              <span className="text-slate-400">¿No recibiste el enlace?</span>
              <button
                type="button"
                disabled={resendStatus === 'sending'}
                onClick={handleResendCode}
                className="text-brand-primary hover:text-brand-primary-container font-bold bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
              >
                {resendStatus === 'sending'
                  ? 'Reenviando...'
                  : resendStatus === 'success'
                  ? '¡Reenviado!'
                  : 'Reenviar enlace'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[9px] text-slate-400 font-mono">
          SISTEMA DE SEGURIDAD TAPASEL CO • TODOS LOS DERECHOS RESERVADOS 2026
        </p>
      </motion.div>
    </div>
  );
}
