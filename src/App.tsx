import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { HomePage } from '@/pages/HomePage';


function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <main className="h-full">
          <Routes>
            <Route path="/" element={<HomePage />} />


          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
