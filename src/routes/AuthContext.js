import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar al cargar si hay un usuario en sessionStorage
  useEffect(() => {
    const user = sessionStorage.getItem('adminUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (email, password) => {
    // Compara con las variables de entorno
    if (email === process.env.REACT_APP_ADMIN_EMAIL && 
        password === process.env.REACT_APP_ADMIN_PASSWORD) {
      const user = { email };
      setCurrentUser(user);
      sessionStorage.setItem('adminUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('adminUser');
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};