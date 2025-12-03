import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { HomePage } from '@/pages/HomePage';
import { ExecutionDetailPage } from '@/pages/ExecutionDetailPage';

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <main className="h-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/executions/:executionId" element={<ExecutionDetailPage />} />
            {/* Redirect legacy routes to home for now */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/functions" element={<Navigate to="/" replace />} />
            <Route path="/runners" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
