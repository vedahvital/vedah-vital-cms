import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import AdminUsers from './pages/AdminUsers';
import Subscribers from './pages/Subscribers';
import ContactMessages from './pages/ContactMessages';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/generate" element={<ProtectedRoute><Layout><Generate /></Layout></ProtectedRoute>} />
      <Route path="/subscribers" element={<ProtectedRoute><Layout><Subscribers /></Layout></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Layout><ContactMessages /></Layout></ProtectedRoute>} />
      <Route path="/admins" element={<ProtectedRoute><Layout><AdminUsers /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}