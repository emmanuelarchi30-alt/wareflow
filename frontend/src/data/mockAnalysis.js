export const mockAnalysis = {
  zones: [
    { type: 'racking', x: 10, y: 10, width: 35, height: 80, description: 'Estanterías zona A - picking alto' },
    { type: 'racking', x: 55, y: 10, width: 35, height: 80, description: 'Estanterías zona B - reserva' },
    { type: 'aisle', x: 47, y: 10, width: 6, height: 80, description: 'Pasillo principal' },
    { type: 'aisle', x: 10, y: 10, width: 35, height: 8, description: 'Pasillo transversal 1' },
    { type: 'aisle', x: 10, y: 45, width: 35, height: 8, description: 'Pasillo transversal 2' },
    { type: 'aisle', x: 55, y: 45, width: 35, height: 8, description: 'Pasillo transversal 3' },
    { type: 'loading', x: 10, y: 2, width: 80, height: 6, description: 'Zona de carga/descarga' },
    { type: 'empty', x: 2, y: 2, width: 6, height: 96, description: 'Espacio lateral subutilizado' },
    { type: 'obstacle', x: 50, y: 30, width: 4, height: 4, description: 'Columna estructural' },
  ],
  issues: [
    { type: 'wasted_space', severity: 'warning', x: 5, y: 50, description: 'Espacio muerto junto a pared lateral - 45m² sin uso', recommendation: 'Instalar estanterías de pasillo estrecho (VNA) para recuperar 35m²' },
    { type: 'bottleneck', severity: 'critical', x: 48, y: 50, description: 'Cuello de botella en pasillo principal - ancho 2.8m insuficiente para tráfico bidireccional', recommendation: 'Ampliar pasillo a 3.5m mínimo o implementar sentido único' },
    { type: 'blocked_aisle', severity: 'warning', x: 50, y: 30, description: 'Columna bloquea visibilidad en cruce de pasillos', recommendation: 'Instalar espejos convexos y señalización de prioridad' },
    { type: 'poor_flow', severity: 'warning', x: 30, y: 5, description: 'Flujo de entrada/salida obliga a cruce innecesario de pasillo principal', recommendation: 'Reubicar muelles de recepción a zona norte' },
    { type: 'disorganization', severity: 'good', x: 60, y: 60, description: 'Zona B bien organizada - picking por oleadas funcionando correctamente', recommendation: 'Mantener configuración actual' },
  ],
  recommendations: [
    { priority: 'high', description: 'Ampliar pasillo principal a 3.5m eliminando 2 bahías de estanterías zona A', impact: '+40% throughput, -5% capacidad almacenamiento', zoneType: 'aisle' },
    { priority: 'high', description: 'Instalar estanterías VNA en espacio lateral muerto (zona oeste)', impact: '+35m² capacidad, +25% densidad', zoneType: 'empty' },
    { priority: 'medium', description: 'Implementar sentido único en pasillo principal con señalización en suelo', impact: 'Elimina cuellos de botella, 0 coste', zoneType: 'aisle' },
    { priority: 'medium', description: 'Reubicar recepción a muelles norte para flujo unidireccional', impact: '-30% distancia recorrida, +20% velocidad despacho', zoneType: 'loading' },
    { priority: 'low', description: 'Instalar espejos en cruces ciegos por columnas', impact: 'Mejora seguridad, reducción incidentes ~15%', zoneType: 'obstacle' },
  ],
};