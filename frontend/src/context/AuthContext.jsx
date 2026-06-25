import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app por primera vez, verificamos si ya había una sesión guardada
  useEffect(() => {
    const token = localStorage.getItem('facadmin_token');
    const savedUser = localStorage.getItem('facadmin_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = async (id_interno, password) => {
    try {
      const response = await api.post('/auth/login', { id_interno, password });
      const { token, user: loggedUser } = response.data;

      // Guardamos en el almacenamiento del navegador
      localStorage.setItem('facadmin_token', token);
      localStorage.setItem('facadmin_user', JSON.stringify(loggedUser));

      // Guardamos en el estado de React
      setUser(loggedUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al conectar con el servidor.'
      };
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('facadmin_token');
    localStorage.removeItem('facadmin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar la autenticación de forma rápida en cualquier vista
export function useAuth() {
  return useContext(AuthContext);
}