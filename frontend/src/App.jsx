import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

function App() {
  // Estado para controlar qué pantalla estamos viendo
  const [activeView, setActiveView] = useState('catalogo');
  // Estado para abrir/cerrar el menú en celulares
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-app text-text-primary transition-colors duration-300 font-sans">
      
      {/* Componente del Menú Lateral */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Contenedor Principal (Navbar + Contenido) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        <Navbar setMobileOpen={setMobileOpen} />

        {/* Área dinámica donde cambiarán las vistas (Catálogo, Ventanilla, etc.) */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center flex-1 flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-accent font-black">{activeView.substring(0,2).toUpperCase()}</span>
             </div>
             <h2 className="text-2xl font-heading font-bold mb-2">Vista Activa: <span className="text-accent capitalize">{activeView}</span></h2>
             <p className="text-text-muted">Aquí construiremos el componente correspondiente a esta sección.</p>
          </div>

        </main>
      </div>

    </div>
  );
}

export default App;