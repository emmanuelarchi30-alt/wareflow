import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GlassPanel, GlassButton, GlassCard, GlassInput, SeverityBadge } from '../components/ui/GlassPanel';
import { FloatingShapes } from '../components/ui/FloatingShapes';
import { LocationSelector } from '../components/ui/LocationSelector';
import toast from 'react-hot-toast';

// TODO: Reemplaza esta URL con tu endpoint de Formspree
// Obtén tu endpoint en: https://formspree.io/
// Formato: https://formspree.io/f/{tu_form_id}
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/moevebbb';

const processStages = [
  { id: 'recepcion', label: 'Recepción', count: 12, detail: 'Muelles activos', color: 'var(--accent-blue)' },
  { id: 'inventario', label: 'Inventario', count: 8, detail: 'Conteos pendientes', color: 'var(--accent-yellow)' },
  { id: 'preparacion', label: 'Preparación', count: 24, detail: 'Pedidos en picking', color: 'var(--accent-orange)' },
  { id: 'despacho', label: 'Despacho', count: 7, detail: 'Rutas listas', color: 'var(--status-good)' },
];

const initialTasks = [
  { id: 1, title: 'Validar muelle 03', area: 'Recepción', priority: 'Alta', time: '09:30', status: 'Pendiente' },
  { id: 2, title: 'Reponer zona de picking A', area: 'Inventario', priority: 'Media', time: '10:15', status: 'En curso' },
  { id: 3, title: 'Liberar ruta de despacho norte', area: 'Despacho', priority: 'Alta', time: '11:00', status: 'Pendiente' },
];

const teamMembers = ['L. Martínez', 'J. Gutiérrez', 'P. Ramírez', 'R. Castro'];

const dashboardSections = [
  { id: 'indicadores', label: 'Indicadores operativos', keywords: 'indicadores operativos pedidos hoy tiempo picking ocupacion incidencias kpi metricas' },
  { id: 'flujo', label: 'Flujo operativo', keywords: 'flujo operativo proceso etapas recepcion inventario preparacion despacho operativo' },
  { id: 'alertas', label: 'Alertas operativas', keywords: 'alertas operativas prioridades muelle stock ruta transportista incidencias' },
  { id: 'tareas', label: 'Tareas del turno', keywords: 'tareas turno pendientes asignacion tarea comentarios' },
  { id: 'despacho', label: 'Actividad de despacho', keywords: 'actividad despacho rendimiento pedidos horas grafico carga salidas' },
  { id: 'almacenes', label: 'Mis almacenes', keywords: 'almacenes warehouse almacen bodega conectados' },
];

export function Dashboard() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', address: '', location: {} });
  const [tasks, setTasks] = useState(initialTasks);
  const [activeStage, setActiveStage] = useState('preparacion');
  const [showReports, setShowReports] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const goToSection = (sectionId) => {
    const el = document.getElementById(`seccion-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightedSection(sectionId);
      setTimeout(() => setHighlightedSection(null), 2200);
      setSearchFocused(false);
    }
  };

  const matchedSections = search.trim()
    ? dashboardSections.filter(s => {
        const q = search.trim().toLowerCase();
        return s.label.toLowerCase().includes(q) || s.keywords.split(' ').some(k => k.includes(q) || q.includes(k));
      })
    : [];
  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name || '', country: profile?.country || '', region: profile?.region || '', city: profile?.city || '' });
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [sendingSupport, setSendingSupport] = useState(false);

  useEffect(() => {
    setProfileForm({ full_name: profile?.full_name || '', country: profile?.country || '', region: profile?.region || '', city: profile?.city || '' });
  }, [profile]);

  useEffect(() => {
    if (user) loadWarehouses();
  }, [user]);

  const loadWarehouses = async () => {
    try {
      const data = await api.warehouses.list(user.id);
      setWarehouses(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!newWarehouse.name.trim()) return toast.error('Nombre requerido');
    try {
      await api.warehouses.create({ ...newWarehouse, userId: user.id });
      toast.success('Almacén creado');
      setShowCreate(false);
      setNewWarehouse({ name: '', address: '', location: {} });
      loadWarehouses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const completeTask = (taskId) => {
    setTasks(current => current.map(task => (
      task.id === taskId ? { ...task, status: 'Completada' } : task
    )));
    toast.success('Tarea marcada como completada');
  };

  const downloadReport = () => {
    const rows = [
      ['Indicador', 'Valor'],
      ['Pedidos hoy', '184'],
      ['Tiempo medio de picking', '18 min'],
      ['Ocupacion de almacenes', '76%'],
      ['Incidencias activas', '3'],
      ['Tareas pendientes', String(tasks.filter(task => task.status !== 'Completada').length)],
      ['Almacenes conectados', String(warehouses.length)],
    ];
    const csv = rows.map(row => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wareflow-reporte-operativo.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte descargado');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(profileForm);
      setShowEditProfile(false);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendSupport = async (event) => {
    event.preventDefault();
    setSendingSupport(true);
    try {
      const formData = new FormData();
      formData.append('name', profile?.full_name || 'Líder de Wareflow');
      formData.append('email', user.email);
      formData.append('subject', supportForm.subject);
      formData.append('message', supportForm.message);
      formData.append('_replyto', user.email);

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Error al enviar el formulario');

      setSupportForm({ subject: '', message: '' });
      setShowSupport(false);
      toast.success('Solicitud enviada a soporte TIC (developers3012@gmail.com)');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingSupport(false);
    }
  };

  const visibleWarehouses = warehouses.filter(warehouse => `${warehouse.name} ${warehouse.address || ''} ${warehouse.city || ''}`.toLowerCase().includes(search.toLowerCase()));

  if (!user) return navigate('/login');

  return (
    <div className="min-h-screen relative">
      <FloatingShapes count={3} />
      <motion.header
        className="relative z-10 glass border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-accent-yellow flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-xl font-bold text-primary">Wareflow</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 relative">
              <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
              <input value={search} onChange={event => setSearch(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 150)} className="w-44 bg-transparent outline-none text-sm text-primary placeholder:text-secondary" placeholder="Buscar sección o almacén..." aria-label="Buscar sección o almacén" />
              {searchFocused && matchedSections.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 glass rounded-xl border border-white/10 p-2 shadow-2xl z-50">
                  {matchedSections.map(s => (
                    <button key={s.id} type="button" onClick={() => goToSection(s.id)} className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg glass-hover text-sm text-primary text-left hover:bg-white/10">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h.01" /></svg>
                        {s.label}
                      </span>
                      <span className="text-xs text-secondary">Ir a sección →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button type="button" onClick={() => setShowProfile(true)} className="px-3 py-2 rounded-lg glass-hover text-sm font-medium text-secondary hover:text-primary transition-colors" title="Ver perfil">
                Perfil
              </button>
              <button type="button" onClick={() => setShowLists(true)} className="px-3 py-2 rounded-lg glass-hover text-sm font-medium text-secondary hover:text-primary transition-colors" title="Ver listas">
                Listas
              </button>
              <button type="button" onClick={() => setShowBoard(true)} className="px-3 py-2 rounded-lg glass-hover text-sm font-medium text-secondary hover:text-primary transition-colors" title="Ver cartelera">
                Cartelera
              </button>
              <button type="button" onClick={() => navigate('/logistics-problems')} className="px-3 py-2 rounded-lg glass-hover text-sm font-medium text-secondary hover:text-primary transition-colors" title="Problemas logísticos">
                ⚠️ Problemas
              </button>
              <button type="button" onClick={() => setShowSupport(true)} className="px-3 py-2 rounded-lg glass-hover text-sm font-medium text-secondary hover:text-primary transition-colors" title="Soporte técnico">
                Soporte técnico
              </button>
            </div>
            <div className="lg:hidden relative">
              <button type="button" onClick={() => setMobileMenu(m => !m)} className="sm:hidden p-2 rounded-xl glass-hover transition-colors" aria-label="Menú" aria-expanded={mobileMenu}>
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              {mobileMenu && (
                <div className="absolute right-0 top-full mt-2 glass rounded-xl border border-white/10 p-2 shadow-2xl z-50 w-56">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 mb-2">
                    <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
                    <input value={search} onChange={event => setSearch(event.target.value)} className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-secondary" placeholder="Buscar sección o almacén..." aria-label="Buscar" />
                  </div>
                  {[
                    ['Perfil', () => setShowProfile(true)],
                    ['Listas', () => setShowLists(true)],
                    ['Cartelera', () => setShowBoard(true)],
                    ['⚠️ Problemas', () => navigate('/logistics-problems')],
                    ['Soporte técnico', () => setShowSupport(true)],
                  ].map(([label, action]) => (
                    <button key={label} type="button" onClick={() => { action(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg glass-hover text-sm text-secondary hover:text-primary transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <GlassButton variant="secondary" onClick={signOut}>Salir</GlassButton>
          </div>
        </div>
      </motion.header>

      <motion.main
        className="relative z-10 max-w-7xl mx-auto px-6 py-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-accent-blue text-sm font-semibold uppercase tracking-widest">Centro de operaciones</p>
            <h2 className="text-3xl font-bold text-primary mt-2">Coordinación logística</h2>
            <p className="text-secondary mt-1">Controla el flujo completo desde la recepción hasta el despacho.</p>
          </div>
          <div className="flex gap-3">
            <GlassButton variant="secondary" onClick={() => setShowReports(true)}>Ver reportes</GlassButton>
            <GlassButton onClick={() => setShowCreate(true)}>Nuevo almacén</GlassButton>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Atajos de secciones">
          {dashboardSections.map(s => (
            <button key={s.id} type="button" onClick={() => goToSection(s.id)} className={`px-3 py-1.5 rounded-full text-sm glass-hover transition-colors ${highlightedSection === s.id ? 'bg-white/15 ring-1 ring-accent-blue/60 text-primary' : 'text-secondary'}`}>
              {s.label}
            </button>
          ))}
        </nav>

        <section id="seccion-indicadores" className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8 rounded-2xl transition-all duration-700 ${highlightedSection === 'indicadores' ? 'ring-2 ring-accent-blue/50 bg-white/5 p-2' : ''}`} aria-label="Indicadores operativos">
          {[
            ['Pedidos hoy', '184', '+12%', 'vs. ayer', 'text-accent-blue'],
            ['Tiempo medio de picking', '18 min', '-8%', 'mejora', 'text-status-good'],
            ['Ocupación de almacenes', '76%', '4%', 'capacidad libre', 'text-accent-yellow'],
            ['Incidencias activas', '03', '2 críticas', 'requieren atención', 'text-status-critical'],
          ].map(([label, value, change, caption, tone], index) => (
            <motion.div
              key={label}
              className="glass rounded-2xl p-5"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
            >
              <p className="text-secondary text-sm">{label}</p>
              <div className="flex items-end justify-between mt-3">
                <strong className="text-3xl text-primary">{value}</strong>
                <span className={`text-sm font-semibold ${tone}`}>{change}</span>
              </div>
              <p className="text-xs text-secondary/70 mt-2">{caption}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mb-10">
          <GlassPanel id="seccion-flujo" className={`p-6 rounded-2xl transition-all duration-700 ${highlightedSection === 'flujo' ? 'ring-2 ring-accent-blue/50' : ''}`} hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-primary">Flujo operativo</h3>
                <p className="text-sm text-secondary mt-1">Estado de cada etapa en tiempo real</p>
              </div>
              <span className="flex items-center gap-2 text-xs text-status-good"><span className="w-2 h-2 rounded-full bg-status-good animate-pulse" /> Operativo</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {processStages.map((stage, index) => (
                <button
                  type="button"
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`relative text-left rounded-xl p-4 border transition-all ${activeStage === stage.id ? 'bg-white/10 border-accent-blue/70 -translate-y-1' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <span className="block w-3 h-3 rounded-full mb-4" style={{ background: stage.color, boxShadow: `0 0 14px ${stage.color}` }} />
                  <p className="text-sm font-semibold text-primary">{stage.label}</p>
                  <strong className="block text-2xl text-primary mt-2">{stage.count}</strong>
                  <p className="text-xs text-secondary mt-1">{stage.detail}</p>
                  {index < processStages.length - 1 && <span className="hidden lg:block absolute top-6 -right-4 w-5 border-t border-white/20" />}
                </button>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel id="seccion-alertas" className={`p-6 rounded-2xl transition-all duration-700 ${highlightedSection === 'alertas' ? 'ring-2 ring-accent-blue/50' : ''}`} hover={false}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-primary">Alertas operativas</h3>
                <p className="text-sm text-secondary mt-1">Prioridades para el equipo</p>
              </div>
              <span className="text-2xl font-bold text-status-critical">03</span>
            </div>
            <div className="space-y-3">
              {[
                ['Muelle 03', 'Recepción retrasada 22 min', 'bg-status-critical', 'Carga completa · 14 pallets · Proveedor ACME'],
                ['Zona A-14', 'Stock bajo de alta rotación', 'bg-status-warning', 'SKU-2284 · 12 uds, umbral 20'],
                ['Ruta N-08', 'Confirmar salida del transportista', 'bg-accent-blue', 'Transportista: FedeExpress · 6 pedidos'],
              ].map(([title, detail, tone, extra]) => (
                <button type="button" key={title} onClick={() => toast(`Alerta seleccionada: ${title} — ${extra}`)} className="w-full flex items-start gap-3 text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${tone}`} />
                  <span className="min-w-0">
                    <strong className="block text-sm text-primary">{title}</strong>
                    <span className="block text-xs text-secondary">{detail}</span>
                    <span className="block text-[11px] text-secondary/70 mt-1">{extra}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2 text-[11px] text-secondary">
              <span className="rounded-full bg-white/5 px-2 py-1">Críticas: 1</span>
              <span className="rounded-full bg-white/5 px-2 py-1">Advertencias: 1</span>
              <span className="rounded-full bg-white/5 px-2 py-1">Seguimiento: 1</span>
            </div>
          </GlassPanel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr] mb-10">
          <GlassPanel id="seccion-tareas" className={`p-6 rounded-2xl transition-all duration-700 ${highlightedSection === 'tareas' ? 'ring-2 ring-accent-blue/50' : ''}`} hover={false}>
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-lg font-semibold text-primary">Tareas del turno</h3><p className="text-sm text-secondary mt-1">{tasks.filter(task => task.status !== 'Completada').length} pendientes</p></div>
              <button type="button" onClick={() => toast('Nueva tarea disponible próximamente')} className="text-sm text-accent-blue hover:underline">+ Añadir tarea</button>
            </div>
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border ${task.status === 'Completada' ? 'border-status-good/20 bg-status-good/5 opacity-60' : 'border-white/10 bg-white/5'}`}>
                  <button type="button" onClick={() => completeTask(task.id)} className={`w-5 h-5 rounded-full border flex-shrink-0 ${task.status === 'Completada' ? 'border-status-good bg-status-good' : 'border-white/30 hover:border-accent-blue'}`} aria-label={`Completar ${task.title}`} />
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-primary truncate">{task.title}</p><p className="text-xs text-secondary mt-1">{task.area} · {task.time} · Responsable: {task.status === 'Completada' ? 'Finalizada' : teamMembers[task.priority === 'Alta' ? 0 : 1]}</p></div>
                  <span className={`text-xs ${task.priority === 'Alta' ? 'text-status-critical' : 'text-status-warning'}`}>{task.priority}</span>
                  <span className={`hidden sm:inline text-[11px] px-2 py-0.5 rounded-full ${task.status === 'Completada' ? 'bg-status-good/15 text-status-good' : 'bg-white/10 text-secondary'}`}>{task.status}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel id="seccion-despacho" className={`p-6 rounded-2xl transition-all duration-700 ${highlightedSection === 'despacho' ? 'ring-2 ring-accent-blue/50' : ''}`} hover={false}>
            <div className="flex items-center justify-between mb-5"><div><h3 className="text-lg font-semibold text-primary">Actividad de despacho</h3><p className="text-sm text-secondary mt-1">Rendimiento de las últimas horas</p></div><span className="text-xs text-secondary">Hoy, 08:00 - 14:00</span></div>
            <div className="flex items-end gap-1.5 h-32 border-b border-white/10 pb-3">
              {[42, 58, 48, 72, 64, 86, 74, 96, 80, 88, 68, 92].map((height, index) => <motion.div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-accent-blue/30 to-accent-blue" initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 0.6, delay: index * 0.04 }} title={`${height} pedidos`} />)}
            </div>
            <div className="flex justify-between text-xs text-secondary mt-3"><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span></div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="rounded-xl bg-white/5 p-2"><strong className="block text-lg text-primary">78</strong><span className="text-[11px] text-secondary">Promedio/hora</span></div>
              <div className="rounded-xl bg-white/5 p-2"><strong className="block text-lg text-accent-orange">96</strong><span className="text-[11px] text-secondary">Pico (12:00)</span></div>
              <div className="rounded-xl bg-white/5 p-2"><strong className="block text-lg text-status-good">6</strong><span className="text-[11px] text-secondary">Rutas salidas</span></div>
            </div>
          </GlassPanel>
        </section>

        <div id="seccion-almacenes" className={`flex items-center justify-between mb-6 rounded-2xl transition-all duration-700 ${highlightedSection === 'almacenes' ? 'ring-2 ring-accent-blue/50 bg-white/5 p-2' : ''}`}>
          <div><h3 className="text-2xl font-bold text-primary">Mis almacenes</h3><p className="text-secondary mt-1">{visibleWarehouses.length} de {warehouses.length} almacén{warehouses.length !== 1 ? 'es' : ''} conectado{warehouses.length !== 1 ? 's' : ''}</p></div>
          <GlassButton onClick={() => setShowCreate(true)}>Nuevo almacén</GlassButton>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[1,2,3].map(i => (
              <GlassCard key={i} className="animate-pulse">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
                <div className="h-4 bg-white/5 rounded w-1/2 mb-2" />
                <div className="h-4 bg-white/5 rounded w-1/3" />
              </GlassCard>
            ))}
          </div>
        ) : warehouses.length === 0 ? (
          <GlassPanel className="text-center py-16">
            <motion.svg
              className="w-16 h-16 mx-auto text-secondary/50 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></motion.svg>
            <h3 className="text-xl font-medium text-primary mb-2">No hay almacenes aún</h3>
            <p className="text-secondary mb-6">Crea tu primer almacén para empezar a analizar layouts</p>
            <GlassButton onClick={() => setShowCreate(true)}>Crear primer almacén</GlassButton>
          </GlassPanel>
        ) : visibleWarehouses.length === 0 && search ? (
          <GlassPanel className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-secondary/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
            <h3 className="text-xl font-medium text-primary mb-2">Sin resultados para "{search}"</h3>
            <p className="text-secondary mb-6">No se encontró ningún almacén con ese nombre, dirección o ciudad.</p>
            <GlassButton variant="secondary" onClick={() => setSearch('')}>Limpiar búsqueda</GlassButton>
          </GlassPanel>
        ) : (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            {visibleWarehouses.map((w, i) => (
              <motion.div key={w.id} variants={{ show: { opacity: 1, y: 0 } }}>
                <GlassCard className="shimmer-border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{w.name}</h3>
                      <p className="text-sm text-secondary mt-1">{w.address || 'Sin dirección'}</p>
                      <p className="text-xs text-secondary/70 mt-1">
                        {w.city}, {w.region}, {w.country}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-yellow/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Link to={`/analysis/new/${w.id}`} className="flex items-center gap-2 text-accent-blue hover:underline font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      Nuevo análisis
                    </Link>
                    <span className="flex items-center gap-1 text-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {w.layout_analyses?.[0]?.count || 0} análisis
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {showCreate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-warehouse-title"
          >
            <GlassPanel hero className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <motion.h2 id="create-warehouse-title" className="text-xl font-bold text-primary mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                Nuevo Almacén
              </motion.h2>
              <form onSubmit={handleCreateWarehouse} className="space-y-4">
                <GlassInput
                  label="Nombre del almacén"
                  value={newWarehouse.name}
                  onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  placeholder="Ej: Almacén Central Madrid"
                  required
                  autoFocus
                />
                <GlassInput
                  label="Dirección"
                  value={newWarehouse.address}
                  onChange={e => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  placeholder="Calle, número, código postal"
                />
                <LocationSelector
                  namePrefix="warehouse"
                  value={newWarehouse.location}
                  onChange={loc => setNewWarehouse({ ...newWarehouse, location: loc })}
                />
                <div className="flex gap-3 pt-2">
                  <GlassButton type="submit" className="flex-1">Crear</GlassButton>
                  <GlassButton type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
                    Cancelar
                  </GlassButton>
                </div>
              </form>
            </GlassPanel>
          </motion.div>
        )}

        {showReports && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReports(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reports-title"
          >
            <GlassPanel hero className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6" onClick={event => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-accent-blue text-xs font-semibold uppercase tracking-widest">Reporte operativo</p>
                  <h2 id="reports-title" className="text-2xl font-bold text-primary mt-2">Rendimiento logístico de hoy</h2>
                  <p className="text-secondary text-sm mt-1">Resumen de actividad, capacidad e incidencias del turno.</p>
                </div>
                <button type="button" onClick={() => setShowReports(false)} className="p-2 rounded-lg glass-hover text-secondary hover:text-primary" aria-label="Cerrar reporte">×</button>
              </div>

              <div className="grid gap-3 sm:grid-cols-4 mb-6">
                {[
                  ['184', 'Pedidos procesados', 'text-accent-blue'],
                  ['92%', 'Nivel de servicio', 'text-status-good'],
                  ['18 min', 'Picking promedio', 'text-accent-yellow'],
                  ['03', 'Incidencias', 'text-status-critical'],
                ].map(([value, label, tone]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4"><strong className={`block text-2xl ${tone}`}>{value}</strong><span className="text-xs text-secondary mt-1 block">{label}</span></div>)}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Rendimiento por proceso</h3>
                  <div className="space-y-4">
                    {[['Recepción', 88, 'var(--accent-blue)'], ['Inventario', 76, 'var(--accent-yellow)'], ['Preparación', 94, 'var(--accent-orange)'], ['Despacho', 82, 'var(--status-good)']].map(([label, value, color]) => <div key={label}><div className="flex justify-between text-xs mb-2"><span className="text-secondary">{label}</span><strong className="text-primary">{value}%</strong></div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} /></div></div>)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Resumen de incidencias</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between rounded-xl bg-status-critical/10 border border-status-critical/20 p-3"><span className="text-sm text-primary">Críticas</span><strong className="text-status-critical">2</strong></div>
                    <div className="flex justify-between rounded-xl bg-status-warning/10 border border-status-warning/20 p-3"><span className="text-sm text-primary">Advertencias</span><strong className="text-status-warning">1</strong></div>
                    <div className="flex justify-between rounded-xl bg-status-good/10 border border-status-good/20 p-3"><span className="text-sm text-primary">Resueltas hoy</span><strong className="text-status-good">14</strong></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 mt-8 pt-5 border-t border-white/10">
                <GlassButton variant="secondary" onClick={() => setShowReports(false)}>Cerrar</GlassButton>
                <GlassButton onClick={downloadReport}>Descargar CSV</GlassButton>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {showProfile && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowProfile(false)} role="dialog" aria-modal="true" aria-labelledby="profile-title">
            <GlassPanel hero className="w-full max-w-md p-6" onClick={event => event.stopPropagation()}>
              <p className="text-accent-yellow text-xs font-semibold uppercase tracking-widest">Cuenta activa</p>
              <h2 id="profile-title" className="text-2xl font-bold text-primary mt-2">Perfil del líder</h2>
              <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4"><p className="text-sm text-secondary">Nombre</p><p className="text-primary mt-1">{profile?.full_name || 'Emmanuel'}</p><p className="text-sm text-secondary mt-4">Correo de acceso</p><p className="text-primary mt-1">{user.email}</p><p className="text-sm text-accent-yellow mt-4">Líder de coordinación logística</p></div>
              <div className="flex justify-end gap-3 mt-6"><GlassButton variant="secondary" onClick={() => setShowProfile(false)}>Cerrar</GlassButton><GlassButton onClick={() => { setShowProfile(false); setShowEditProfile(true); }}>Editar perfil</GlassButton></div>
            </GlassPanel>
          </motion.div>
        )}

        {showEditProfile && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowEditProfile(false)} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
            <GlassPanel hero className="w-full max-w-md p-6" onClick={event => event.stopPropagation()}>
              <h2 id="edit-profile-title" className="text-xl font-bold text-primary mb-5">Editar perfil</h2>
              <form onSubmit={saveProfile} className="space-y-4">
                <GlassInput label="Nombre completo" value={profileForm.full_name} onChange={event => setProfileForm({ ...profileForm, full_name: event.target.value })} required />
                <GlassInput label="País" value={profileForm.country} onChange={event => setProfileForm({ ...profileForm, country: event.target.value })} />
                <GlassInput label="Región / Estado" value={profileForm.region} onChange={event => setProfileForm({ ...profileForm, region: event.target.value })} />
                <GlassInput label="Ciudad" value={profileForm.city} onChange={event => setProfileForm({ ...profileForm, city: event.target.value })} />
                <div className="flex justify-end gap-3 pt-2"><GlassButton type="button" variant="secondary" onClick={() => setShowEditProfile(false)}>Cancelar</GlassButton><GlassButton type="submit">Guardar</GlassButton></div>
              </form>
            </GlassPanel>
          </motion.div>
        )}

        {showLists && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowLists(false)} role="dialog" aria-modal="true" aria-labelledby="lists-title">
            <GlassPanel hero className="w-full max-w-lg p-6" onClick={event => event.stopPropagation()}>
              <h2 id="lists-title" className="text-xl font-bold text-primary">Listas operativas</h2><p className="text-secondary text-sm mt-1 mb-5">Pendientes prioritarios del turno.</p>
              <div className="space-y-3">{tasks.map(task => <div key={task.id} className="flex justify-between gap-4 rounded-xl bg-white/5 border border-white/10 p-4"><div><p className="text-primary text-sm font-medium">{task.title}</p><p className="text-xs text-secondary mt-1">{task.area} · {task.time}</p></div><span className="text-xs text-accent-yellow">{task.status}</span></div>)}</div>
              <div className="flex justify-end mt-6"><GlassButton onClick={() => setShowLists(false)}>Cerrar</GlassButton></div>
            </GlassPanel>
          </motion.div>
        )}

        {showBoard && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowBoard(false)} role="dialog" aria-modal="true" aria-labelledby="board-title">
            <GlassPanel hero className="w-full max-w-lg p-6" onClick={event => event.stopPropagation()}>
              <h2 id="board-title" className="text-xl font-bold text-primary">Cartelera de coordinación</h2><p className="text-secondary text-sm mt-1 mb-5">Comunicados visibles para el equipo logístico.</p>
              <div className="space-y-3"><div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4"><p className="text-sm font-semibold text-primary">Prioridad de turno</p><p className="text-sm text-secondary mt-1">Liberar el muelle 03 antes de las 11:00.</p></div><div className="rounded-xl border border-accent-blue/30 bg-accent-blue/10 p-4"><p className="text-sm font-semibold text-primary">Operación</p><p className="text-sm text-secondary mt-1">La ruta norte está lista para despacho.</p></div></div>
              <div className="flex justify-end mt-6"><GlassButton onClick={() => setShowBoard(false)}>Cerrar</GlassButton></div>
            </GlassPanel>
          </motion.div>
        )}

        {showSupport && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowSupport(false)} role="dialog" aria-modal="true" aria-labelledby="support-title">
            <GlassPanel hero className="w-full max-w-lg p-6" onClick={event => event.stopPropagation()}>
              <p className="text-accent-blue text-xs font-semibold uppercase tracking-widest">Soporte técnico</p><h2 id="support-title" className="text-xl font-bold text-primary mt-2">Contactar al equipo TIC</h2><p className="text-secondary text-sm mt-1 mb-5">El formulario se envía vía Formspree a <strong>developers3012@gmail.com</strong>.</p>
              <form onSubmit={sendSupport} className="space-y-4"><GlassInput label="Asunto" value={supportForm.subject} onChange={event => setSupportForm({ ...supportForm, subject: event.target.value })} required /><div><label className="block text-sm font-medium text-secondary mb-2" htmlFor="support-message">Mensaje</label><textarea id="support-message" className="input-glass min-h-32 resize-y" value={supportForm.message} onChange={event => setSupportForm({ ...supportForm, message: event.target.value })} required /></div><div className="flex justify-end gap-3"><GlassButton type="button" variant="secondary" onClick={() => setShowSupport(false)}>Cancelar</GlassButton><GlassButton type="submit" loading={sendingSupport}>Enviar solicitud</GlassButton></div></form>
            </GlassPanel>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}