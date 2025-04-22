import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Redirigir a login si no hay usuario autenticado
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;