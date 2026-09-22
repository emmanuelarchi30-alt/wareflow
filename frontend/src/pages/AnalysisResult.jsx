import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Warehouse3D, Warehouse3DLegend } from '../components/3d/Warehouse3D';
import { api } from '../services/api';
import { mockAnalysis } from '../data/mockAnalysis';
import { GlassPanel, GlassCard, GlassButton, SeverityBadge, PriorityBadge } from '../components/ui/GlassPanel';
import { FloatingShapes } from '../components/ui/FloatingShapes';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      if (id === 'mock') {
        setAnalysis(mockAnalysis);
      } else {
        const data = await api.analyses.get(id);
        setAnalysis(data.json_analysis || mockAnalysis);
      }
    } catch (err) {
      toast.error('Error cargando análisis');
      console.error(err);
      setAnalysis(mockAnalysis);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = (issue) => {
    setSelectedIssue(selectedIssue?.type === issue.type && selectedIssue.x === issue.x ? null : issue);
  };

  const handleZoneClick = (zone) => {
    const relatedIssue = analysis?.issues?.find(i => 
      Math.abs(i.x - zone.x) < 5 && Math.abs(i.y - zone.y) < 5
    );
    if (relatedIssue) handleIssueClick(relatedIssue);
  };

  const exportPDF = async () => {
    if (!analysis) return;
    setExporting(true);
    try {
      const element = document.getElementById('analysis-content');
      if (!element) throw new Error('Elemento no encontrado');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      
      const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`wareflow-analisis-${id}.pdf`);
      toast.success('PDF exportado');
    } catch (err) {
      toast.error('Error exportando PDF');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <FloatingShapes count={3} />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-blue/20 rounded-full relative mx-auto mb-4">
            <motion.div
              className="absolute inset-0 border-4 border-accent-blue rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }}
            />
          </div>
          <p className="text-secondary">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" id="analysis-content">
      <FloatingShapes count={2} />
      <header className="relative z-10 glass border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl glass-hover transition-colors" aria-label="Volver">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary">Resultado del Análisis</h1>
              <p className="text-sm text-secondary">ID: {id}</p>
            </div>
          </div>
          <GlassButton onClick={exportPDF} loading={exporting} disabled={exporting}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar PDF
          </GlassButton>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {analysis?.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <GlassPanel className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-yellow/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Diagnóstico de la IA</h3>
                  <p className="text-secondary">{analysis.summary}</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Warehouse3D
              zones={analysis.zones}
              issues={analysis.issues}
              selectedIssue={selectedIssue}
              onZoneClick={handleZoneClick}
            />
            <Warehouse3DLegend className="mt-4" />
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
                  <span className="text-sm text-secondary">{analysis.issues?.length || 0} items</span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysis.issues?.map((issue, i) => (
                    <motion.button
                      key={i}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        selectedIssue?.type === issue.type && selectedIssue.x === issue.x
                          ? 'ring-2 ring-accent-blue bg-white/10'
                          : 'glass-hover'
                      }`}
                      onClick={() => handleIssueClick(issue)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <SeverityBadge severity={issue.severity} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-primary mb-1">{issue.description}</p>
                          <p className="text-sm text-secondary/80">{issue.recommendation}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassPanel className="p-6">
                <h2 className="text-lg font-semibold text-primary mb-4">Recomendaciones de Reorganización</h2>
                <div className="space-y-3">
                  {analysis.recommendations?.map((rec, i) => (
                    <GlassCard key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        <PriorityBadge priority={rec.priority} />
                        <div className="flex-1">
                          <p className="font-medium text-primary mb-1">{rec.description}</p>
                          <p className="text-sm text-secondary">{rec.impact}</p>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>

            {selectedIssue && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <GlassPanel className="p-4 border-l-4" style={{ borderColor: `var(--status-${selectedIssue.severity})` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityBadge severity={selectedIssue.severity} />
                    <h3 className="font-semibold text-primary">Detalle del Problema</h3>
                  </div>
                  <p className="text-secondary mb-2">{selectedIssue.description}</p>
                  <p className="text-sm text-accent-blue font-medium">{selectedIssue.recommendation}</p>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="mt-3 text-sm text-secondary hover:text-primary transition-colors"
                  >
                    Cerrar detalle
                  </button>
                </GlassPanel>
              </motion.div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}