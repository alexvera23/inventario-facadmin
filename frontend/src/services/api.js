import axios from 'axios';

// Creamos una instancia personalizada de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000, // 10 segundos de espera máxima por petición
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor global para capturar errores (Opcional pero muy útil para producción)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(' Error en la petición HTTP:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

//Interceptor de Peticiones 
api.interceptors.request.use(
  (config) => {
    // Buscamos el token en localStorage
    const token = localStorage.getItem('facadmin_token');
    
    // Si el token existe, se lo inyectamos al encabezado HTTP de la petición
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//Interceptor de Respuestas (Por si el token expira, desloguear)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Si el servidor nos rebota por falta de permisos o sesión expirada, limpiamos y mandamos al login
      localStorage.removeItem('facadmin_token');
      localStorage.removeItem('facadmin_user');
      // Redirigir al login de forma nativa si es necesario
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;