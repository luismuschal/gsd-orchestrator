import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import { api } from './lib/api';

export default function App() {
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; expiresAt?: number } | null>(null);

  useEffect(() => {
    // Check auth status on mount
    api.getAuthStatus().then(setAuthStatus).catch(() => setAuthStatus({ authenticated: false }));
    
    // Check every minute
    const interval = setInterval(() => {
      api.getAuthStatus().then(setAuthStatus).catch(() => setAuthStatus({ authenticated: false }));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
      const { url } = await api.getLoginUrl();
      window.location.href = url;
    } catch (error) {
      alert('Failed to get login URL');
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">GSD Orchestrator</h1>
            
            {authStatus && (
              <div className="flex items-center gap-4">
                {authStatus.authenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">Authenticated</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Login with GitHub
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
