import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'admin2025';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Redirect root to admin login */}
      <Route path="/" element={<Navigate to={`/admin/${ADMIN_SECRET}/connexion`} replace />} />

      {/* Admin routes */}
      <Route path="/admin/:secretKey/connexion" element={<AdminLogin />} />
      <Route path="/admin/:secretKey" element={<AdminDashboard />} />

      {/* Fallback - 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h1 className="text-4xl font-display font-bold mb-4">404</h1>
              <p className="text-muted-foreground mb-6">Page introuvable</p>
              <a
                href={`/admin/${ADMIN_SECRET}/connexion`}
                className="text-primary hover:underline"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default App;
