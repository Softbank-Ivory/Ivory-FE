import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { ExecutionProvider } from '@/contexts/ExecutionContext';
import { HomePage } from '@/pages/HomePage';


function App() {
  return (
    <ToastProvider>
      <ExecutionProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <main className="h-full">
          <Routes>
            <Route path="/" element={<HomePage />} />


          </Routes>
        </main>
      </div>
      </ExecutionProvider>
    </ToastProvider>
  );
}

export default App;
