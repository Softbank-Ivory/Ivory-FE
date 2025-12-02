import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { FunctionsPage } from '@/pages/FunctionsPage';
import { ExecutionDetailPage } from '@/pages/ExecutionDetailPage';
import { RunnersPage } from '@/pages/RunnersPage';
import { Sidebar } from '@/components/layout/Sidebar';

function App() {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/functions" element={<FunctionsPage />} />
            <Route path="/executions/:executionId" element={<ExecutionDetailPage />} />
            <Route path="/runners" element={<RunnersPage />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
