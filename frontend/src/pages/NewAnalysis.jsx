import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GlassPanel, GlassButton, GlassCard, GlassInput } from '../components/ui/GlassPanel';
import { FloatingShapes } from '../components/ui/FloatingShapes';
import toast from 'react-hot-toast';

export function NewAnalysis() {
  const { warehouseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const fileInputRef = useRef(null);
  const dragActiveRef = useRef(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      dragActiveRef.current = true;
    } else if (e.type === 'dragleave') {
      dragActiveRef.current = false;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActiveRef.current = false;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile.type.match(/^image\/(jpeg|png|webp)$/)) {
      return toast.error('Formato no válido. Usa JPG, PNG o WebP');
    }
    if (selectedFile.size > 4 * 1024 * 1024) {
      return toast.error('La imagen no puede superar 4 MB');
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Selecciona una imagen');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('warehouseId', warehouseId);
      formData.append('userId', user.id);
      const { analysisId, imageUrl } = await api.analyses.create(formData);
      setAnalysisId(analysisId);
      toast.success('Imagen subida. Analizando con IA...');
      pollAnalysis(analysisId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const pollAnalysis = async (id) => {
    setAnalyzing(true);
    const maxAttempts = 90;
    for (let i = 0; i < maxAttempts; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 1500));
      try {
        const analysis = await api.analyses.get(id);
        if (analysis.status === 'completed') {
          toast.success('Análisis completado');
          navigate(`/analysis/${id}`);
          return;
        }
        if (analysis.status === 'failed') {
          const note = analysis.error_note || 'No se pudo procesar la imagen. Revisa que la foto tenga buena luz y que los racks/pasillos se vean claros.';
          toast.error(`El análisis falló: ${note}`);
          setAnalyzing(false);
          return;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }
    toast.error('Tiempo de espera agotado. Intenta con una imagen más pequeña o mejor iluminada.');
    setAnalyzing(false);
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setAnalysisId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen relative">
      <FloatingShapes count={3} />
      <header className="relative z-10 glass border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl glass-hover transition-colors" aria-label="Volver">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl font-bold text-primary">Nuevo Análisis</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {!analysisId ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassPanel className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-primary mb-2">Subir layout del almacén</h2>
                <p className="text-secondary">Arrastra una foto o selecciónala. Formatos: JPG, PNG, WebP (máx. 4MB)</p>
              </div>

              <div
                ref={fileInputRef}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActiveRef.current ? 'border-accent-blue bg-accent-blue/10' : 'border-white/10 hover:border-accent-blue/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Área para subir imagen"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-hidden="true"
                />
                {preview ? (
                  <div className="relative inline-block max-w-full max-h-96">
                    <img src={preview} alt="Vista previa del layout" className="rounded-xl max-w-full max-h-96 object-contain" />
                    <button
                      type="button"
                      onClick={resetForm}
                      className="absolute top-2 right-2 p-1.5 rounded-lg glass-hover text-secondary hover:text-primary transition-colors"
                      aria-label="Eliminar imagen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-orange/20 to-accent-yellow/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-primary font-medium">Arrastra tu imagen aquí</p>
                    <p className="text-secondary text-sm">o haz clic para seleccionar</p>
                  </div>
                )}
              </div>

              {preview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex gap-3 justify-center"
                >
                  <GlassButton variant="secondary" onClick={resetForm}>
                    Cambiar imagen
                  </GlassButton>
                  <GlassButton onClick={handleUpload} loading={uploading} disabled={uploading}>
                    Analizar con IA
                  </GlassButton>
                </motion.div>
              )}
            </GlassPanel>

            <GlassCard className="mt-6 p-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Consejos para mejor resultado
              </h3>
              <ul className="space-y-2 text-secondary text-sm">
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" /> Foto cenital o desde altura (planta del almacén)</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" /> Buena iluminación, sin sombras fuertes</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" /> Que se vean claramente estanterías, pasillos y muelles</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" /> Evita personas, montacargas u objetos móviles en la foto</li>
              </ul>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-accent-blue/20 rounded-full" />
              <motion.div
                className="absolute inset-0 border-4 border-accent-blue rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }}
              />
              <div className="relative w-full h-full flex items-center justify-center">
                <svg className="w-10 h-10 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">Analizando con IA...</h3>
            <p className="text-secondary mb-6">Claude Vision está detectando racks, pasillos y problemas del layout. Normalmente tarda 20-45 segundos.</p>
            <div className="w-64 mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-orange to-accent-yellow rounded-full"
                animate={{ width: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-sm text-secondary/70 mt-4">ID de análisis: {analysisId}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}