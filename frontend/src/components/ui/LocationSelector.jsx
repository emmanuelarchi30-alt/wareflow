import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GlassSelect } from './GlassPanel';

export function LocationSelector({ 
  namePrefix = '', 
  value = {}, 
  onChange, 
  required = true,
  disabled = false,
  labels = { country: 'País', region: 'Región/Estado', city: 'Ciudad' }
}) {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({ countries: false, regions: false, cities: false });
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoading(l => ({ ...l, countries: true }));
    setLocationError('');
    try {
      const data = await api.location.countries();
      setCountries(data);
    } catch (err) {
      console.error('Error loading countries:', err);
      setLocationError('No se pudieron cargar los países. Comprueba que el backend esté ejecutándose.');
    } finally {
      setLoading(l => ({ ...l, countries: false }));
    }
  };

  const loadRegions = async (countryCode) => {
    if (!countryCode) { setRegions([]); setCities([]); return; }
    setLoading(l => ({ ...l, regions: true }));
    try {
      const data = await api.location.states(countryCode);
      setRegions(data);
    } catch (err) {
      console.error('Error loading regions:', err);
    } finally {
      setLoading(l => ({ ...l, regions: false }));
    }
  };

  const loadCities = async (countryCode, stateCode) => {
    if (!countryCode || !stateCode) { setCities([]); return; }
    setLoading(l => ({ ...l, cities: true }));
    try {
      const data = await api.location.cities(countryCode, stateCode);
      setCities(data);
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLoading(l => ({ ...l, cities: false }));
    }
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    onChange?.({ ...value, country: code, region: '', city: '' });
    loadRegions(code);
  };

  const handleRegionChange = (e) => {
    const code = e.target.value;
    onChange?.({ ...value, region: code, city: '' });
    loadCities(value.country, code);
  };

  const handleCityChange = (e) => {
    onChange?.({ ...value, city: e.target.value });
  };

  return (
    <div className="space-y-4" role="group" aria-labelledby={`${namePrefix}-location-label`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassSelect
          id={`${namePrefix}-country`}
          name={`${namePrefix}-country`}
          label={labels.country}
          options={countries.map(c => ({ value: c.iso2, label: c.name }))}
          value={value.country || ''}
          onChange={handleCountryChange}
          disabled={disabled || loading.countries}
          required={required}
        />
        <GlassSelect
          id={`${namePrefix}-region`}
          name={`${namePrefix}-region`}
          label={labels.region}
          options={regions.map(r => ({ value: r.iso2, label: r.name }))}
          value={value.region || ''}
          onChange={handleRegionChange}
          disabled={disabled || loading.regions || !value.country}
          required={required}
        />
        <GlassSelect
          id={`${namePrefix}-city`}
          name={`${namePrefix}-city`}
          label={labels.city}
          options={cities.map(c => ({ value: c.name, label: c.name }))}
          value={value.city || ''}
          onChange={handleCityChange}
          disabled={disabled || loading.cities || !value.region}
          required={required}
        />
      </div>
      {(loading.countries || loading.regions || loading.cities) && (
        <div className="flex items-center gap-2 text-sm text-secondary" role="status" aria-live="polite">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          Cargando ubicaciones...
        </div>
      )}
      {locationError && !loading.countries && (
        <div className="flex items-center justify-between gap-3 text-sm text-status-warning" role="alert">
          <span>{locationError}</span>
          <button type="button" className="text-accent-blue hover:underline" onClick={loadCountries}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}