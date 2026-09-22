import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { NewAnalysis } from './pages/NewAnalysis';
import { FloatingShapes } from './components/ui/FloatingShapes';
import { VideoBackground } from './components/ui/VideoBackground';

const AnalysisResult = lazy(() => import('./pages/AnalysisResult').then(m => ({ default: m.AnalysisResult })));
const LogisticsProblems = lazy(() => import('./pages/LogisticsProblems').then(m => ({ default: m.LogisticsProblems })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <FloatingShapes count={3} />
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-blue/20 rounded-full relative mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-accent-blue rounded-full animate-spin" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }} />
        </div>
        <p className="text-secondary">Cargando...</p>
      </div>
    </div>
  );
}

function AppBackground({ children, video = true }) {
  return (
    <VideoBackground
      src="/videos/fondo.mp4"
      className="min-h-screen"
      video={video}
      poster=""
      overlayClassName="bg-black/15"
      gradientClassName="bg-[linear-gradient(135deg,var(--bg-gradient-start),var(--bg-gradient-mid),var(--bg-gradient-end))] bg-[size:400%_400%] animate-gradient-shift"
    >
      {children}
    </VideoBackground>
  );
}

function ProtectedRoute({ children, video = true }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <FloatingShapes count={3} />
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-blue/20 rounded-full relative mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-accent-blue rounded-full animate-spin" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }} />
        </div>
        <p className="text-secondary">Cargando...</p>
      </div>
    </div>
  );
  return user ? <AppBackground video={video}>{children}</AppBackground> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis/new/:warehouseId"
        element={
          <ProtectedRoute>
            <NewAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AnalysisResult />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logistics-problems"
        element={
          <ProtectedRoute video={false}>
            <Suspense fallback={<PageLoader />}>
              <LogisticsProblems />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}