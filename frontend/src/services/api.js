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

export default api;