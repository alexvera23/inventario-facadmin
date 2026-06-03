import { createContext, useState, useEffect, useContext } from 'react';

// 1. Creamos el contexto
const ThemeContext = createContext();

// 2. Creamos el Provider que envolverá nuestra App
export const ThemeProvider = ({ children }) => {
  // Leemos si el usuario ya tenía un tema guardado, si no, por defecto es 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Este efecto se ejecuta cada vez que el estado 'theme' cambia
  useEffect(() => {
    const root = window.document.documentElement; // Accede a la etiqueta <html>
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Guardamos la preferencia en el LocalStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Función para alternar el tema
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Hook personalizado para usar el tema fácilmente en cualquier componente
export const useTheme = () => useContext(ThemeContext);