import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '../components/ui/VideoBackground';
import { FloatingShapes } from '../components/ui/FloatingShapes';
import { GlassPanel, GlassInput, GlassButton, GlassSelect, SeverityBadge } from '../components/ui/GlassPanel';
import { LocationSelector } from '../components/ui/LocationSelector';
import toast from 'react-hot-toast';

const SECURITY_QUESTIONS = [
  { value: 'mother_maiden', label: '¿Cuál es el apellido de soltera de tu madre?' },
  { value: 'first_pet', label: '¿Cómo se llamaba tu primera mascota?' },
  { value: 'birth_city', label: '¿En qué ciudad naciste?' },
  { value: 'first_school', label: '¿Cuál fue el nombre de tu primera escuela?' },
  { value: 'favorite_teacher', label: '¿Cuál fue el nombre de tu profesor favorito?' },
];

const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

function LoginForm({ formData, setFormData, errors, handleSubmit, loading, toggleMode, navigate }) {
  return (
    <GlassPanel hero className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Bienvenido a Wareflow</h1>
        <p className="text-secondary">Inicia sesión para optimizar tus almacenes</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        <GlassInput
          id="password"
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          autoComplete="current-password"
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-accent-orange" /> Recordarme
          </label>
          <button type="button" className="text-sm text-accent-blue hover:underline" onClick={() => navigate('/forgot-password')}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <GlassButton type="submit" className="w-full" loading={loading}>
          Iniciar sesión
        </GlassButton>
      </form>
      <div className="mt-6 text-center">
        <p className="text-secondary">¿No tienes cuenta?{' '}
          <button onClick={toggleMode} className="text-accent-blue font-medium hover:underline">
            Regístrate
          </button>
        </p>
      </div>
    </GlassPanel>
  );
}

function RegisterForm({ formData, setFormData, errors, handleSubmit, loading, toggleMode }) {
  const strength = passwordStrength(formData.password);
  const strengthLabels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const strengthColors = ['text-status-critical', 'text-status-warning', 'text-accent-yellow', 'text-accent-blue', 'text-status-good'];

  return (
    <GlassPanel hero className="p-8 max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-primary mb-2">Crear cuenta</h1>
        <p className="text-secondary">Únete a Wareflow y optimiza tus espacios</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <GlassInput
          id="fullName"
          label="Nombre completo"
          type="text"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
          autoComplete="name"
          required
        />
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
        <GlassInput
          id="password"
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        {formData.password && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(strength / 5) * 100}%`,
                  background: `linear-gradient(90deg, var(--status-critical), var(--status-warning), var(--accent-yellow), var(--accent-blue), var(--status-good))`,
                }}
                animate={{ width: `${(strength / 5) * 100}%` }}
              />
            </div>
            <p className={`text-xs ${strengthColors[strength - 1] || 'text-secondary'}`}>
              {strength > 0 ? strengthLabels[strength - 1] : 'Ingresa una contraseña'}
            </p>
          </div>
        )}
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
        <LocationSelector
          namePrefix="register"
          value={formData.location}
          onChange={loc => setFormData({ ...formData, location: loc })}
          required={true}
        />
        {errors.country && <p className="text-sm text-status-critical" role="alert">{errors.country}</p>}
        <GlassButton type="submit" className="w-full" loading={loading}>
          Crear cuenta
        </GlassButton>
      </form>
      <div className="mt-6 text-center">
        <p className="text-secondary">¿Ya tienes cuenta?{' '}
          <button onClick={toggleMode} className="text-accent-blue font-medium hover:underline">
            Inicia sesión
          </button>
        </p>
      </div>
    </GlassPanel>
  );
}

export function AuthPage() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
    location: { country: '', region: '', city: '' },
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!isLogin) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Nombre requerido';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
      if (passwordStrength(formData.password) < 3) newErrors.password = 'Contraseña débil (mín. 8 chars, mayús, minús, número, símbolo)';
      if (!formData.location.country) newErrors.country = 'Selecciona un país';
      if (!formData.securityQuestion) newErrors.securityQuestion = 'Selecciona una pregunta de seguridad';
      if (!formData.securityAnswer.trim()) newErrors.securityAnswer = 'Respuesta requerida';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.password && isLogin) newErrors.password = 'Contraseña requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      if (isLogin) {
        await signIn(email, formData.password);
      } else {
        await signUp(email, formData.password, formData.fullName.trim(), formData.location, formData.securityQuestion, formData.securityAnswer);
      }
      toast.success(isLogin ? 'Bienvenido' : 'Cuenta creada');
      navigate('/dashboard');
    } catch (err) {
      const message = err.message?.toLowerCase().includes('rate limit')
        ? 'Se alcanzó el límite temporal de correos. Espera unos minutos antes de intentarlo de nuevo.'
        : err.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setErrors({});
    setFormData({ 
      fullName: '', 
      email: '', 
      password: '', 
      confirmPassword: '', 
      securityQuestion: '', 
      securityAnswer: '', 
      location: { country: '', region: '', city: '' } 
    });
  };

  return (
    <VideoBackground className="min-h-screen flex items-center justify-center p-4">
      <FloatingShapes count={5} />
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <LoginForm
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                handleSubmit={handleSubmit}
                loading={loading}
                toggleMode={toggleMode}
                navigate={navigate}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <RegisterForm
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                handleSubmit={handleSubmit}
                loading={loading}
                toggleMode={toggleMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </VideoBackground>
  );
}