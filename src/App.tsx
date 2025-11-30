import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FunctionsPage } from './pages/FunctionsPage';

import { FunctionDetailPage } from './pages/FunctionDetailPage';

import { ExecutionDetailPage } from './pages/ExecutionDetailPage';

import { RunnersPage } from './pages/RunnersPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="functions" element={<FunctionsPage />} />
        <Route path="functions/:functionId" element={<FunctionDetailPage />} />
        <Route path="executions/:executionId" element={<ExecutionDetailPage />} />
        <Route path="runners" element={<RunnersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
