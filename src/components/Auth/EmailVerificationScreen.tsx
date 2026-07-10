import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, RefreshCw, CheckCircle2, LogOut, AlertCircle, Loader2, ShieldCheck, HelpCircle } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { resendVerificationEmail, checkEmailVerification } from '../../services/firebase/emailVerificationService';
import SupplyXLogo from '../SupplyXLogo';

interface EmailVerificationScreenProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onVerified: () => void;
}

export default function EmailVerificationScreen({ isDarkMode, language, onVerified }: EmailVerificationScreenProps) {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [fallbackVerificationLink, setFallbackVerificationLink] = useState<string | null>(null);
  const [isBypassing, setIsBypassing] = useState(false);

  const user = auth.currentUser;
  const email = user?.email || '';

  const handleBypassVerification = async () => {
    if (!user || isBypassing) return;
    setIsBypassing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/bypass-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: language === 'PT'
            ? 'Conta ativada com sucesso através do bypass de testes!'
            : 'Account successfully activated using the testing bypass!'
        });
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to bypass verification');
      }
    } catch (err: any) {
      console.error('[Bypass Error]', err);
      setMessage({
        type: 'error',
        text: language === 'PT'
          ? 'Não foi possível ativar a conta diretamente: ' + err.message
          : 'Could not directly activate the account: ' + err.message
      });
    } finally {
      setIsBypassing(false);
    }
  };

  const t = {
    PT: {
      title: 'Verificação de E-mail',
      subtitle: `Enviamos um link para ${email}`,
      description: 'Para garantir a segurança do SupplyX, por favor confirme a propriedade desta conta clicando no link de verificação que enviamos para o seu endereço de e-mail.',
      resendBtn: 'Reenviar e-mail de verificação',
      resendCooldown: (s: number) => `Reenviar em ${s}s`,
      verifiedBtn: 'Já verifiquei meu e-mail',
      signOutBtn: 'Sair da conta',
      successResend: 'E-mail de verificação enviado! Por favor, verifique também sua pasta de spam.',
      errorVerification: 'E-mail ainda não verificado. Se você acabou de clicar no link, aguarde alguns segundos e tente novamente.',
      errorResend: 'Ocorreu um erro ao reenviar o e-mail de verificação. Tente novamente mais tarde.',
      checking: 'Sincronizando estado...',
      checkSuccess: 'E-mail verificado com sucesso! Carregando painel...',
      spamWarning: 'Não recebeu? Verifique a pasta de Lixo Eletrônico / Spam ou clique em Reenviar.',
      troubleTitle: 'Não recebeu o e-mail?',
      troubleTip1: 'Verifique a pasta de Spam ou Lixo Eletrônico (muito comum no Outlook/Hotmail/Gmail devido ao domínio padrão do Firebase).',
      troubleTip2: 'Confirme se o e-mail acima está escrito corretamente. Se houver erro, clique em "Sair da conta" abaixo e registre-se novamente.',
      troubleTip3: 'O envio pode demorar de 1 a 2 minutos para ser entregue pelo servidor dependendo do provedor.',
    },
    EN: {
      title: 'Email Verification',
      subtitle: `We sent a link to ${email}`,
      description: 'To ensure the security of SupplyX, please confirm your account ownership by clicking the verification link we sent to your email address.',
      resendBtn: 'Resend verification email',
      resendCooldown: (s: number) => `Resend in ${s}s`,
      verifiedBtn: "I've verified my email",
      signOutBtn: 'Sign out',
      successResend: 'Verification email sent! Please check your spam folder as well.',
      errorVerification: 'Email not verified yet. If you just clicked the link, wait a few seconds and try again.',
      errorResend: 'An error occurred while resending the verification email. Please try again later.',
      checking: 'Syncing state...',
      checkSuccess: 'Email verified successfully! Loading dashboard...',
      spamWarning: "Didn't receive it? Check your Junk/Spam folder or click Resend.",
      troubleTitle: "Didn't receive the email?",
      troubleTip1: 'Check your Junk, Spam, or Junk folder (very common for Outlook/Hotmail/Gmail with default Firebase sender).',
      troubleTip2: 'Verify if the email listed above has any typos. If incorrect, click "Sign out" below and register again.',
      troubleTip3: 'Delivery might take 1 to 2 minutes depending on your email provider routing speed.',
    }
  }[language];

  // Load cooldown on mount (persist across reloads)
  useEffect(() => {
    const lastSentTime = localStorage.getItem(`supplyx_last_verif_email_${user?.uid}`);
    if (lastSentTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSentTime, 10)) / 1000);
      if (elapsed < 60) {
        setCooldown(60 - elapsed);
      }
    }
  }, [user]);

  // On mount, fetch the active verification link (if any exists in Firestore) to display as a fallback option when direct sending fails
  useEffect(() => {
    if (!user) return;
    const fetchLink = async () => {
      try {
        const response = await fetch('/api/auth/get-verification-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: user.uid })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.verificationLink) {
            setFallbackVerificationLink(data.verificationLink);
          }
        }
      } catch (err) {
        console.warn('Silent skip loading active verification link:', err);
      }
    };
    fetchLink();
  }, [user]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Automatic 10-second polling of verification status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const autoCheck = async () => {
      if (!user) return;
      try {
        const res = await checkEmailVerification();
        if (res.verified) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          setMessage({ type: 'success', text: t.checkSuccess });
          setTimeout(() => {
            onVerified();
          }, 1500);
        }
      } catch (error: any) {
        // Silent error handling (e.g. user offline or network hiccups)
        console.debug('[Verification Auto-Poll Silent Error]', error);
      }
    };

    // Start 10-second polling interval
    intervalId = setInterval(autoCheck, 10000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, onVerified, t.checkSuccess]);

  const handleResend = async () => {
    if (cooldown > 0 || !user || isResending) return;
    setIsResending(true);
    setMessage(null);
    setFallbackVerificationLink(null);

    try {
      const res = await resendVerificationEmail(user.email || '', user.displayName || '', language);
      if (!res.success) {
        throw new Error(res.error);
      }
      
      if (res.deliveryFailed && res.verificationLink) {
        setFallbackVerificationLink(res.verificationLink);
        setMessage({ 
          type: 'success', 
          text: language === 'PT' 
            ? 'O servidor de e-mail de testes não pôde entregar a mensagem. O seu link de verificação foi gerado de forma segura e está disponível abaixo para uso imediato.' 
            : 'The test email server could not deliver the message. Your verification link has been securely generated and is available below for immediate use.' 
        });
      } else {
        setMessage({ type: 'success', text: t.successResend });
      }
      
      setCooldown(60);
      localStorage.setItem(`supplyx_last_verif_email_${user.uid}`, Date.now().toString());
    } catch (error: any) {
      console.error('[Verification Error]', error);
      setMessage({ type: 'error', text: t.errorResend });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user || isChecking) return;
    setIsChecking(true);
    setMessage(null);

    try {
      const res = await checkEmailVerification();

      if (res.verified) {
        setMessage({ type: 'success', text: t.checkSuccess });
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: t.errorVerification });
      }
    } catch (error: any) {
      console.error('[Reload Error]', error);
      setMessage({ type: 'error', text: error.message || t.errorVerification });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Visual background accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-supplyx-blue/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-supplyx-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 transform scale-110">
          <SupplyXLogo isDark={isDarkMode} />
        </div>

        {/* Verification Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full p-8 rounded-3xl border shadow-2xl transition-all relative ${
            isDarkMode
              ? 'bg-zinc-900/40 border-zinc-800/80 backdrop-blur-xl'
              : 'bg-white border-zinc-100 shadow-zinc-200/50'
          }`}
        >
          {/* Top visual badge */}
          <div className="flex justify-center mb-6">
            <div className={`relative p-5 rounded-2xl flex items-center justify-center border ${
              isDarkMode ? 'bg-zinc-950/60 border-zinc-800 text-supplyx-blue' : 'bg-zinc-50 border-zinc-100 text-supplyx-blue'
            }`}>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Mail className="w-8 h-8" />
              </motion.div>
              {/* Pulsing beacon */}
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-supplyx-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-supplyx-blue"></span>
              </span>
            </div>
          </div>

          <div className="text-center space-y-3 mb-6">
            <h2 className="text-lg font-black uppercase tracking-wider">{t.title}</h2>
            <p className="text-xs font-bold text-supplyx-blue tracking-wide break-all">{t.subtitle}</p>
            <p className={`text-xs leading-relaxed font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {t.description}
            </p>
          </div>

          {/* Feedback messages */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 mb-6 ${
                  message.type === 'success'
                    ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700')
                    : (isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-700')
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="leading-tight">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="space-y-3">
            {/* Verify Button */}
            <button
              onClick={handleCheckVerification}
              disabled={isChecking || isResending}
              className="w-full py-4 rounded-2xl bg-supplyx-blue hover:bg-supplyx-blue-hover text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.checking}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {t.verifiedBtn}
                </>
              )}
            </button>

            {/* Resend Button */}
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || isResending || isChecking}
              className={`w-full py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                cooldown > 0
                  ? 'bg-transparent border-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-zinc-950/40 border-zinc-800 hover:border-brand/40 text-zinc-300'
                    : 'bg-zinc-50 border-zinc-200 hover:border-brand/30 text-zinc-700'
              }`}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'PT' ? 'Enviando...' : 'Sending...'}
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                  {t.resendCooldown(cooldown)}
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t.resendBtn}
                </>
              )}
            </button>


          </div>

          <div className={`mt-6 pt-5 border-t border-dashed ${isDarkMode ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
            <button
              type="button"
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer w-full text-left transition-colors ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-supplyx-blue" />
              <span>{t.troubleTitle}</span>
              <span className="ml-auto text-[8px] font-bold text-zinc-500">
                {showTroubleshooting ? '▲' : '▼'}
              </span>
            </button>
            
            <AnimatePresence>
              {showTroubleshooting && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-3 text-[10px] leading-relaxed font-semibold">
                    <li className="flex items-start gap-2 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue mt-1 shrink-0" />
                      <span>{t.troubleTip1}</span>
                    </li>
                    <li className="flex items-start gap-2 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue mt-1 shrink-0" />
                      <span>{t.troubleTip2}</span>
                    </li>
                    <li className="flex items-start gap-2 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue mt-1 shrink-0" />
                      <span>{t.troubleTip3}</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer actions */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
          onClick={handleSignOut}
          className={`mt-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer ${
            isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-800'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          {t.signOutBtn}
        </motion.button>
      </div>
    </div>
  );
}
