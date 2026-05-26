import React, { useState, useEffect } from "react";
import { Sprout, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound } from "lucide-react";
import { checkCredentials, updateUserPassword, initializeUserDb } from "../utils/userDb";

interface LoginScreenProps {
  onLoginSuccess: (userName: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Pre-fill with Admin credentials for easy first access testing
  const [email, setEmail] = useState("AdminLogin");
  const [password, setPassword] = useState("AdminSenha");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password reset state for forced Change Password flow
  const [changingPasswordUser, setChangingPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passError, setPassError] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Initialize DB on mount
  useEffect(() => {
    initializeUserDb();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (!email.trim() || !password.trim()) {
        setError("Por favor, preencha todos os campos.");
        setLoading(false);
        return;
      }

      const res = checkCredentials(email, password);

      if (res.success && res.user) {
        if (res.user.isFirstAccess) {
          // Force immediate password change
          setChangingPasswordUser(res.user.username);
        } else {
          onLoginSuccess(res.user.name);
        }
      } else {
        setError(res.error || "Credenciais incorretas.");
      }
      setLoading(false);
    }, 600);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassLoading(true);

    setTimeout(() => {
      if (!newPassword.trim() || !confirmPassword.trim()) {
        setPassError("Todos os campos de senha são obrigatórios.");
        setPassLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setPassError("Por segurança, a nova senha deve conter pelo menos 6 caracteres.");
        setPassLoading(false);
        return;
      }

      if (newPassword === "AdminSenha") {
        setPassError("Sua nova senha não pode ser igual à senha padrão temporária.");
        setPassLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPassError("As confirmações de senha não correspondem.");
        setPassLoading(false);
        return;
      }

      if (changingPasswordUser) {
        const success = updateUserPassword(changingPasswordUser, newPassword);
        if (success) {
          // Login automatically after updating the exclusive DB
          onLoginSuccess("Administrador Geral");
        } else {
          setPassError("Houve um problema ao salvar as informações no banco de dados.");
        }
      }
      setPassLoading(false);
    }, 800);
  };

  // Rendering screen to FORCE administrator password redefinition
  if (changingPasswordUser) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4 selection:bg-amber-100 selection:text-amber-950">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600"></div>

          <div className="text-center mb-6">
            <div className="inline-flex mb-3.5 bg-amber-50 border border-amber-200 p-2.5 rounded-2xl text-amber-700">
              <KeyRound size={28} className="animate-bounce" />
            </div>
            
            <h1 className="text-xl font-black font-display text-emerald-950 tracking-tight">
              Alteração de Senha Obrigatória
            </h1>
            <p className="text-xs text-stone-550 mt-1.5 leading-relaxed">
              Olá, <span className="font-bold text-stone-850">Administrador</span>. Como este é o seu <strong>primeiro acesso</strong>, redefina a senha padrão imediatamente para garantir a privacidade física do painel.
            </p>
          </div>

          {passError && (
            <div className="mb-5 p-3.5 bg-orange-50 border border-orange-100 text-orange-950 rounded-2xl text-xs flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
              <span className="leading-tight">{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            {/* New Password input */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                Nova Senha de Administrador
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                  <Lock size={15} />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  className="w-full text-xs bg-stone-50/50 border border-stone-200 rounded-xl pl-9.5 pr-10 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/10 focus:border-amber-600 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password input */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                  <Lock size={15} />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha desejada"
                  className="w-full text-xs bg-stone-50/50 border border-stone-200 rounded-xl pl-9.5 pr-10 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/10 focus:border-amber-600 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 border-b-2 border-emerald-950 text-white font-semibold py-3 rounded-2xl text-xs shadow-md shadow-emerald-900/10 transition-all cursor-pointer disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none mt-6"
            >
              {passLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></span>
                  Salvando no DB Exclusivo...
                </span>
              ) : (
                <>
                  Gravar Nova Senha & Entrar
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-150 text-center">
            <p className="text-[10px] text-stone-400 font-mono">
              REGISTRY_DB_MUTATION: ENABLED (SAFE_WRITE)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD LOGIN SCREEN RENDERING
  return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4 selection:bg-amber-100 selection:text-amber-950">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Subtle top indicator representation */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-800"></div>

        {/* TOPOGRAPHIC LEVEL DECORATIVE PATTERN BACKGROUND (SUBTLE) */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-[0.03] text-stone-900">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
            <path d="M10 20 C30 10, 70 30, 90 20" />
            <path d="M10 40 C30 30, 70 50, 90 40" />
            <path d="M10 60 C30 50, 70 70, 90 60" />
            <path d="M10 80 C30 70, 70 90, 90 80" />
          </svg>
        </div>

        <div className="text-center mb-8">
          {/* GEOMETRIC HEXAGON SEAL & SUN/SPROUT CORE SYMBOL */}
          <div className="inline-flex mb-4 relative p-1">
            <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform hover:rotate-6 transition-transform duration-500">
              <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5 Z" fill="#14532d" stroke="#b45309" strokeWidth="3" />
              <path d="M25 43 C40 38, 60 48, 75 43" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <path d="M20 54 C40 50, 60 60, 80 54" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <circle cx="50" cy="30" r="9" fill="#f59e0b" opacity="0.9" />
              <path d="M50 82 V48" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M50 60 C55 58, 65 52, 65 44 C65 42, 58 42, 50 48" fill="#10b981" />
              <path d="M50 67 C45 65, 35 59, 35 51 C35 49, 42 49, 50 55" fill="#10b981" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-extrabold font-display text-emerald-950 tracking-tight">
            Gestão Agrícola Gerencial
          </h1>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
            A tecnologia conectada à terra: controle analítico de custos, colheitas e almoxarifado de sementes e defensivos.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-orange-50 border border-orange-100 text-orange-950 rounded-2xl text-xs flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Username input field */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
              E-mail ou Usuário de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <User size={15} />
              </span>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Exemplo: AdminLogin"
                className="w-full text-xs bg-stone-50/50 border border-stone-200 rounded-xl pl-9.5 pr-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Senha de Acesso
              </label>
              <span className="text-[10px] text-amber-700 font-semibold font-display">Conexão Segura</span>
            </div>
            
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-stone-50/50 border border-stone-200 rounded-xl pl-9.5 pr-10 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/10 focus:border-emerald-700 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 border-b-2 border-emerald-950 text-white font-semibold py-3 rounded-2xl text-xs shadow-md shadow-emerald-900/10 transition-all cursor-pointer disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></span>
                Autenticando...
              </span>
            ) : (
              <>
                Entrar no Sistema Gerencial
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Informative Help Box with Preset Logins */}
        <div className="mt-8 pt-6 border-t border-stone-150 bg-[#faf8f4]/60 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 pb-6 sm:pb-8 text-center rounded-b-3xl">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2.5">
            <ShieldCheck size={12} className="text-emerald-700 animate-pulse" />
            Certificado de Autorização Local
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto mb-2">
            Acessos pré-configurados pela gerência rurais:
          </p>
          <div className="w-full text-left font-mono text-[10px] max-w-xs mx-auto">
            <div className="bg-white border border-stone-200/50 p-2.5 rounded-xl text-center">
              <span className="text-amber-800 font-bold block mb-0.5">ADMINISTRADOR</span>
              <div className="truncate"><span className="text-stone-400">User:</span> AdminLogin</div>
              <div className="truncate"><span className="text-stone-400">Senha:</span> AdminSenha</div>
              <span className="text-[8px] text-amber-600 font-bold block mt-1 uppercase">Mudar no 1º Acesso</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
