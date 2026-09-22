import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Warehouse3D } from '../components/3d/Warehouse3D';
import { GlassPanel, GlassButton, GlassCard } from '../components/ui/GlassPanel';
import { FloatingShapes } from '../components/ui/FloatingShapes';
import toast from 'react-hot-toast';

const LOGISTICS_PROBLEMS = [
  {
    id: 'bottleneck',
    title: 'Cuello de Botella en Pasillo Principal',
    description: 'El pasillo central de 2.8m no permite tráfico bidireccional de montacargas, causando colas de espera de hasta 15 min en horas pico.',
    severity: 'critical',
    icon: '⚠️',
    zone: { x: 48, y: 50 },
    beforeState: {
      aisleWidth: 2.8,
      throughput: 45,
      waitTime: 15,
      collisions: 3,
    },
    afterState: {
      aisleWidth: 3.5,
      throughput: 72,
      waitTime: 3,
      collisions: 0,
    },
    solution: {
      title: 'Ampliar pasillo a 3.5m + Sentido único',
      steps: [
        'Eliminar 2 bahías de estanterías en zona A (pérdida 5% capacidad)',
        'Marcar sentido único con señalización en suelo y postes',
        'Instalar espejos convexos en cruces ciegos',
        'Reubicar picking de alta rotación cerca de muelles',
      ],
      impact: '+60% throughput, -80% tiempo espera, 0 colisiones',
      cost: 'Medio (1-2 semanas implementación)',
    },
  },
  {
    id: 'wasted_space',
    title: 'Espacio Muerto en Zona Lateral',
    description: '45m² junto a pared oeste sin uso productivo. Solo sirve como paso ocasional, desperdiciando superficie valiosa.',
    severity: 'warning',
    icon: '📦',
    zone: { x: 5, y: 50 },
    beforeState: {
      usedArea: 0,
      density: 0,
      potentialPallets: 0,
    },
    afterState: {
      usedArea: 35,
      density: 85,
      potentialPallets: 280,
    },
    solution: {
      title: 'Instalar Estanterías VNA (Very Narrow Aisle)',
      steps: [
        'Montar estanterías de pasillo estrecho (1.6m ancho)',
        'Usar montacargas trilaterales para pasillos de 1.8m',
        'Implementar guiado por cable o láser para seguridad',
        'Configurar 7 niveles de altura (10.5m total)',
      ],
      impact: '+35m² recuperados, +280 pallets, +25% densidad almacenamiento',
      cost: 'Alto (equipo especializado, 3-4 semanas)',
    },
  },
  {
    id: 'blocked_aisle',
    title: 'Columna Estructural Bloquea Cruce',
    description: 'Columna central en intersección de pasillos reduce visibilidad y obliga a maniobras riesgosas. 2 incidentes menores el último mes.',
    severity: 'warning',
    icon: '🚧',
    zone: { x: 50, y: 30 },
    beforeState: {
      visibility: 40,
      incidentsMonth: 2,
      avgManeuverTime: 45,
    },
    afterState: {
      visibility: 95,
      incidentsMonth: 0,
      avgManeuverTime: 18,
    },
    solution: {
      title: 'Espejos convexos + Señalización de prioridad + Iluminación LED',
      steps: [
        'Instalar espejos convexos 60cm en 3 esquinas de la columna',
        'Pintar líneas de prioridad y stop en suelo (epoxi amarillo/rojo)',
        'Añadir luces LED perimetrales en columna (azul intermitente)',
        'Capacitación obligatoria 30 min para operadores de zona',
      ],
      impact: '-100% incidentes, -60% tiempo maniobra, mejora seguridad',
      cost: 'Bajo (2-3 días, <€2000)',
    },
  },
  {
    id: 'poor_flow',
    title: 'Flujo Cruzado Recepción-Despacho',
    description: 'Los camiones de recepción y despacho comparten muelles, obligando a cruzar el pasillo principal y generando interferencias.',
    severity: 'warning',
    icon: '🔄',
    zone: { x: 30, y: 5 },
    beforeState: {
      crossTraffic: 38,
      avgDistance: 120,
      dispatchDelay: 22,
    },
    afterState: {
      crossTraffic: 4,
      avgDistance: 85,
      dispatchDelay: 5,
    },
    solution: {
      title: 'Reubicar Recepción a Muelles Norte (Flujo Unidireccional)',
      steps: [
        'Designar muelles 1-3 (norte) solo para recepción',
        'Designar muelles 4-6 (sur) solo para despacho',
        'Crear carril dedicado recepción→picking→despacho',
        'Instalar puertas rápidas automáticas en separación',
      ],
      impact: '-30% distancia recorrida, -75% cruces, +40% velocidad despacho',
      cost: 'Medio (1 semana, cambios operativos)',
    },
  },
];

const SIMULATION_SPEED = 1500;

export function LogisticsProblems() {
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [simulationPhase, setSimulationPhase] = useState('idle');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  const startSimulation = (problem) => {
    setSelectedProblem(problem);
    setSimulationPhase('running');
    setSimulationProgress(0);
    setShowBeforeAfter(false);
    
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSimulationPhase('complete');
          setShowBeforeAfter(true);
          return 100;
        }
        return prev + 100 / (SIMULATION_SPEED / 100);
      });
    }, 100);
  };

  const resetSimulation = () => {
    setSimulationPhase('idle');
    setSimulationProgress(0);
    setShowBeforeAfter(false);
  };

  const problemZones = LOGISTICS_PROBLEMS.map(p => ({
    type: 'obstacle',
    x: p.zone.x,
    y: p.zone.y,
    width: 4,
    height: 4,
    description: p.title,
  }));

  const warehouseZones = [
    { type: 'racking', x: 10, y: 10, width: 35, height: 80, description: 'Estanterías zona A' },
    { type: 'racking', x: 55, y: 10, width: 35, height: 80, description: 'Estanterías zona B' },
    { type: 'aisle', x: 47, y: 10, width: 6, height: 80, description: 'Pasillo principal' },
    { type: 'aisle', x: 10, y: 10, width: 35, height: 8, description: 'Pasillo transversal 1' },
    { type: 'aisle', x: 10, y: 45, width: 35, height: 8, description: 'Pasillo transversal 2' },
    { type: 'aisle', x: 55, y: 45, width: 35, height: 8, description: 'Pasillo transversal 3' },
    { type: 'loading', x: 10, y: 2, width: 80, height: 6, description: 'Zona de carga/descarga' },
    { type: 'empty', x: 2, y: 2, width: 6, height: 96, description: 'Espacio lateral' },
    { type: 'obstacle', x: 50, y: 30, width: 4, height: 4, description: 'Columna estructural' },
  ];

  const handleZoneClick = (zone) => {
    const problem = LOGISTICS_PROBLEMS.find(p => 
      Math.abs(p.zone.x - zone.x) < 5 && Math.abs(p.zone.y - zone.y) < 5
    );
    if (problem) setSelectedProblem(problem);
  };

  const severityColors = {
    critical: 'bg-status-critical',
    warning: 'bg-status-warning',
    good: 'bg-status-good',
  };

  const severityIcons = {
    critical: '🔴',
    warning: '🟡',
    good: '🟢',
  };

  return (
    <div className="min-h-screen relative">
      <FloatingShapes count={2} />
      <header className="relative z-10 glass border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl glass-hover transition-colors" aria-label="Volver al dashboard">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl font-bold text-primary">Problemas Logísticos</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary hidden sm:block">Simulación interactiva de problemas y soluciones</span>
            <GlassButton variant="secondary" onClick={() => navigate('/dashboard')}>Volver</GlassButton>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-accent-blue text-sm font-semibold uppercase tracking-widest">Centro de Simulación Logística</p>
          <h2 className="text-3xl font-bold text-primary mt-2">Detecta, Simula, Resuelve</h2>
          <p className="text-secondary mt-2">Explora problemas reales de almacén, ejecuta simulaciones de antes/después y aprende las soluciones óptimas.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Warehouse3D
              zones={warehouseZones}
              issues={LOGISTICS_PROBLEMS.map((p, i) => ({
                type: p.id,
                severity: p.severity,
                x: p.zone.x,
                y: p.zone.y,
                description: p.description,
                recommendation: p.solution.title,
              }))}
              selectedIssue={selectedProblem ? { type: selectedProblem.id, x: selectedProblem.zone.x } : null}
              onZoneClick={handleZoneClick}
            />
          </motion.div>

          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassPanel className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary">Problemas Detectados</h2>
                  <span className="text-sm text-secondary">{LOGISTICS_PROBLEMS.length} casos</span>
                </div>
                {selectedProblem && (
                  <button
                    onClick={() => { setSelectedProblem(null); resetSimulation(); }}
                    className="absolute top-4 right-4 p-2 rounded-lg glass-hover text-secondary hover:text-primary transition-colors"
                    aria-label="Cerrar simulación"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {LOGISTICS_PROBLEMS.map((problem, i) => (
                    <motion.button
                      key={problem.id}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        selectedProblem?.id === problem.id
                          ? 'ring-2 ring-accent-blue bg-white/10'
                          : 'glass-hover'
                      }`}
                      onClick={() => setSelectedProblem(problem)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{problem.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-primary">{problem.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${severityColors[problem.severity]} text-white`}>
                              {severityIcons[problem.severity]} {problem.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-secondary/80 line-clamp-2">{problem.description}</p>
                        </div>
                        {selectedProblem?.id === problem.id && (
                          <svg className="w-5 h-5 text-accent-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>

            {selectedProblem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
<GlassPanel className="p-6 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{selectedProblem.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{selectedProblem.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${severityColors[selectedProblem.severity]} text-white`}>
                        {severityIcons[selectedProblem.severity]} {selectedProblem.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-secondary mb-4">{selectedProblem.description}</p>

                  <div className="space-y-4">
                    <GlassButton 
                      onClick={() => startSimulation(selectedProblem)} 
                      disabled={simulationPhase === 'running'}
                      className="w-full"
                      loading={simulationPhase === 'running'}
                    >
                      {simulationPhase === 'idle' ? '▶ Iniciar Simulación' : 
                       simulationPhase === 'running' ? `Simulando... ${Math.round(simulationProgress)}%` : 
                       '✓ Simulación Completada'}
                    </GlassButton>

                    {simulationPhase === 'running' && (
                      <div className="space-y-2">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent-orange to-accent-yellow rounded-full"
                            animate={{ width: `${simulationProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-secondary text-center">
                          {simulationProgress < 30 ? 'Analizando estado actual...' :
                           simulationProgress < 60 ? 'Aplicando solución propuesta...' :
                           simulationProgress < 90 ? 'Calculando métricas post-implementación...' :
                           'Finalizando simulación...'}
                        </p>
                      </div>
                    )}

                    {showBeforeAfter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-blue" />
                          Resultado de la Simulación: {selectedProblem.solution.title}
                        </h4>

                        <div className="grid gap-4 md:grid-cols-2 mb-4">
                          <GlassCard className="p-4 border-l-4 border-status-critical">
                            <h5 className="text-sm font-semibold text-status-critical mb-3 flex items-center gap-1">❌ ANTES</h5>
                            <div className="space-y-2 text-sm">
                              {Object.entries(selectedProblem.beforeState).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-secondary">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                  <span className="font-medium text-primary">{typeof value === 'number' ? value + (key.includes('Time') ? ' min' : key.includes('Area') ? 'm²' : key.includes('Pallets') ? ' uds' : key.includes('Density') ? '%' : '') : value}</span>
                                </div>
                              ))}
                            </div>
                          </GlassCard>

                          <GlassCard className="p-4 border-l-4 border-status-good">
                            <h5 className="text-sm font-semibold text-status-good mb-3 flex items-center gap-1">✅ DESPUÉS</h5>
                            <div className="space-y-2 text-sm">
                              {Object.entries(selectedProblem.afterState).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-secondary">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                  <span className="font-medium text-status-good">{typeof value === 'number' ? value + (key.includes('Time') ? ' min' : key.includes('Area') ? 'm²' : key.includes('Pallets') ? ' uds' : key.includes('Density') ? '%' : '') : value}</span>
                                </div>
                              ))}
                            </div>
                          </GlassCard>
                        </div>

                        <div className="space-y-3 p-4 bg-white/5 rounded-xl">
                          <h5 className="font-semibold text-primary mb-2">Pasos de Implementación:</h5>
                          <ol className="space-y-1 text-sm text-secondary">
                            {selectedProblem.solution.steps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-accent-blue/20 text-accent-blue text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <GlassCard className="p-3">
                            <p className="text-xs text-secondary mb-1">Impacto Estimado</p>
                            <p className="text-sm font-medium text-accent-blue">{selectedProblem.solution.impact}</p>
                          </GlassCard>
                          <GlassCard className="p-3">
                            <p className="text-xs text-secondary mb-1">Coste / Tiempo</p>
                            <p className="text-sm font-medium text-accent-yellow">{selectedProblem.solution.cost}</p>
                          </GlassCard>
                        </div>

                        <GlassButton 
                          variant="secondary" 
                          onClick={resetSimulation}
                          className="w-full mt-4"
                        >
                          ← Nueva Simulación
                        </GlassButton>
                      </motion.div>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {!selectedProblem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <GlassPanel className="p-6 text-center">
                  <svg className="w-16 h-16 mx-auto text-secondary/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <h3 className="text-lg font-medium text-primary mb-2">Selecciona un problema</h3>
                  <p className="text-secondary">Haz clic en un marcador del mapa 3D o en la lista para ver detalles y ejecutar la simulación.</p>
                </GlassPanel>
              </motion.div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}