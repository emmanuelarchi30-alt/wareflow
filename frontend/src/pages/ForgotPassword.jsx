import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '../components/ui/VideoBackground';
import { FloatingShapes } from '../components/ui/FloatingShapes';
import { GlassPanel, GlassInput, GlassButton, GlassSelect } from '../components/ui/GlassPanel';
import toast from 'react-hot-toast';

const SECURITY_QUESTIONS = [
  { value: 'mother_maiden', label: '¿Cuál es el apellido de soltera de tu madre?' },
  { value: 'first_pet', label: '¿Cómo se llamaba tu primera mascota?' },
  { value: 'birth_city', label: '¿En qué ciudad naciste?' },
  { value: 'first_school', label: '¿Cuál fue el nombre de tu primera escuela?' },
  { value: 'favorite_teacher', label: '¿Cuál fue el nombre de tu profesor favorito?' },
];

const securityMethodLabels = {
  question: 'Pregunta de seguridad',
  email_code: 'Código por email (2FA)',
  sms_code: 'Código por SMS (2FA)',
};

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('method');
  const [method, setMethod] = useState('question');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    securityQuestion: '',
    securityAnswer: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email inválido';
    }
    if (method === 'question') {
      if (!formData.securityQuestion) newErrors.securityQuestion = 'Selecciona una pregunta';
      if (!formData.securityAnswer.trim()) newErrors.securityAnswer = 'Respuesta requerida';
    } else if (method === 'email_code' || method === 'sms_code') {
      if (!formData.code.trim()) newErrors.code = 'Código requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (formData.newPassword.length < 8) newErrors.newPassword = 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(formData.newPassword)) newErrors.newPassword = 'Debe tener mayúscula';
    if (!/[a-z]/.test(formData.newPassword)) newErrors.newPassword = 'Debe tener minúscula';
    if (!/[0-9]/.test(formData.newPassword)) newErrors.newPassword = 'Debe tener número';
    if (!/[^A-Za-z0-9]/.test(formData.newPassword)) newErrors.newPassword = 'Debe tener símbolo';
    if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'No coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === 'method') {
        if (!validateStep1()) {
          setLoading(false);
          return;
        }
        
        const email = formData.email.trim().toLowerCase();
        await resetPassword(email, {
          method,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer,
          code: formData.code,
        });
        
        toast.success(method === 'question' 
          ? 'Respuesta verificada. Define tu nueva contraseña.'
          : 'Código verificado. Define tu nueva contraseña.');
        setStep('reset');
      } else if (step === 'reset') {
        if (!validateStep2()) {
          setLoading(false);
          return;
        }
        
        await resetPassword(formData.email.trim().toLowerCase(), {
          method: 'update',
          newPassword: formData.newPassword,
        });
        
        toast.success('Contraseña actualizada correctamente');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.message || 'Error en el proceso');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'reset') setStep('method');
    else navigate('/login');
  };

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return toast.error('Ingresa un email válido primero');
    }
    setLoading(true);
    try {
      const { supabase } = await import('../services/supabase');
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) throw error;
      toast.success(`Código enviado a ${method === 'email_code' ? 'tu email' : 'tu teléfono'}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VideoBackground className="min-h-screen flex items-center justify-center p-4">
      <FloatingShapes count={5} />
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 'method' ? 50 : -50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: step === 'method' ? -50 : 50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <GlassPanel hero className="p-8">
              <button
                type="button"
                onClick={goBack}
                className="absolute top-4 right-4 p-2 rounded-lg glass-hover text-secondary hover:text-primary transition-colors"
                aria-label="Volver"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-primary mb-2">
                  {step === 'method' ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
                </h1>
                <p className="text-secondary">
                  {step === 'method'
                    ? 'Verifica tu identidad con un parámetro de seguridad'
                    : 'Define una contraseña segura para tu cuenta'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {step === 'method' && (
                  <>
                    <GlassInput
                      id="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      error={errors.email}
                      autoComplete="email"
                      required
                    />

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-secondary">Método de verificación</label>
                      <div className="grid gap-2" role="radiogroup" aria-label="Método de seguridad">
                        {['question', 'email_code', 'sms_code'].map(m => (
                          <label
                            key={m}
                            className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              method === m
                                ? 'border-accent-blue bg-accent-blue/10'
                                : 'border-white/10 hover:border-accent-blue/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="securityMethod"
                              value={m}
                              checked={method === m}
                              onChange={() => { setMethod(m); setErrors({}); }}
                              className="sr-only"
                            />
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors" 
                                 style={{ borderColor: method === m ? 'var(--accent-blue)' : 'rgba(255,255,255,0.3)' }}>
                              {method === m && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-blue)' }} />}
                            </div>
                            <span className="text-sm text-primary">{securityMethodLabels[m]}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {method === 'question' && (
                      <div className="space-y-3">
                        <GlassSelect
                          id="securityQuestion"
                          label="Pregunta de seguridad"
                          value={formData.securityQuestion}
                          onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })}
                          error={errors.securityQuestion}
                          options={SECURITY_QUESTIONS}
                          required
                        />
                        <GlassInput
                          id="securityAnswer"
                          label="Respuesta"
                          type="text"
                          value={formData.securityAnswer}
                          onChange={e => setFormData({ ...formData, securityAnswer: e.target.value })}
                          error={errors.securityAnswer}
                          autoComplete="off"
                          required
                        />
                      </div>
                    )}

                    {(method === 'email_code' || method === 'sms_code') && (
                      <div className="space-y-3">
                        <GlassInput
                          id="code"
                          label="Código de verificación"
                          type="text"
                          value={formData.code}
                          onChange={e => setFormData({ ...formData, code: e.target.value })}
                          error={errors.code}
                          autoComplete="one-time-code"
                          placeholder="Ingresa el código de 6 dígitos"
                          required
                        />
                        <GlassButton type="button" variant="secondary" onClick={sendCode} loading={loading} className="w-full">
                          Enviar código a {method === 'email_code' ? 'email' : 'SMS'}
                        </GlassButton>
                      </div>
                    )}
                  </>
                )}

                {step === 'reset' && (
                  <>
                    <GlassInput
                      id="newPassword"
                      label="Nueva contraseña"
                      type="password"
                      value={formData.newPassword}
                      onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                      error={errors.newPassword}
                      autoComplete="new-password"
                      required
                    />
                    <GlassInput
                      id="confirmPassword"
                      label="Confirmar contraseña"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      error={errors.confirmPassword}
                      autoComplete="new-password"
                      required
                    />
                  </>
                )}

                <GlassButton type="submit" className="w-full" loading={loading}>
                  {step === 'method' ? 'Verificar identidad' : 'Actualizar contraseña'}
                </GlassButton>
              </form>

              <div className="mt-6 text-center">
                <p className="text-secondary">¿Recordaste tu contraseña?{' '}
                  <button onClick={() => navigate('/login')} className="text-accent-blue font-medium hover:underline">
                    Iniciar sesión
                  </button>
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        </AnimatePresence>
      </div>
    </VideoBackground>
  );
}