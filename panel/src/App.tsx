import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Nodes from './pages/Nodes';
import Monitoring from './pages/Monitoring';
import SettingsPage from './pages/Settings';
import ScurityPage from './pages/Secutiry';
import SupportPage from './pages/Support';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/nodes" replace />} />
              <Route path="/nodes" element={<Nodes />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/dashboard" element={<div className="p-8 text-on-surface">Dashboard placeholder</div>} />
              <Route path="/security" element={<ScurityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
