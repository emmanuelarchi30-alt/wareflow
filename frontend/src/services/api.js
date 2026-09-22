const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
import { supabase } from './supabase';

async function publicLocationRequest(path) {
  const response = await fetch(`https://countriesnow.space/api/v0.1/${path}`);
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.msg || 'Error cargando ubicaciones');
  return result.data;
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

export const api = {
  warehouses: {
    list: async (userId) => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async ({ name, address, location = {}, userId }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          name,
          address,
          country: location.country || null,
          region: location.region || null,
          city: location.city || null,
          user_id: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },
  analyses: {
    create: (formData) => {
      return fetch(`${API_URL}/api/analyses`, {
        method: 'POST',
        body: formData,
      }).then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'No se pudo iniciar el análisis');
        if (!data.analysisId) throw new Error('El backend no devolvió un ID de análisis');
        return data;
      });
    },
    get: (id) => request(`/api/analyses/${id}`),
  },
  support: {
    send: (data) => request('/api/support', { method: 'POST', body: JSON.stringify(data) }),
  },
  location: {
    countries: async () => {
      try {
        return await request('/api/location/countries');
      } catch {
        const countries = await publicLocationRequest('countries/positions');
        return countries.map(country => ({ iso2: country.name, name: country.name }));
      }
    },
    states: async (countryCode) => {
      try {
        return await request(`/api/location/states/${encodeURIComponent(countryCode)}`);
      } catch {
        const result = await publicLocationRequest(`countries/states/q?country=${encodeURIComponent(countryCode)}`);
        return (result.states || []).map(state => ({ iso2: state.name, name: state.name }));
      }
    },
    cities: async (countryCode, stateCode) => {
      try {
        return await request(`/api/location/cities/${encodeURIComponent(countryCode)}/${encodeURIComponent(stateCode)}`);
      } catch {
        const cities = await publicLocationRequest(`countries/state/cities/q?country=${encodeURIComponent(countryCode)}&state=${encodeURIComponent(stateCode)}`);
        return cities.map(name => ({ name }));
      }
    },
  },
};