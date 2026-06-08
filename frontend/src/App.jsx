import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CatalogoView from './views/Catalogo/CatalogoView'; 
import VentanillaView from './views/Ventanilla/VentanillaView';
import UsuariosView from './views/Usuarios/UsuariosView';
import ReportesView from './views/Reportes/ReportesView';
import ToastProvider from './components/ToastProvider';

function App() {
  const [activeView, setActiveView] = useState('catalogo');
  const [isMobileOpen, setMobileOpen] = useState(false);

  // Función para renderizar el componente correcto según el menú
  const renderView = () => {
    switch (activeView) {
      case 'catalogo':
        return <CatalogoView />;
      case 'ventanilla':
        return <VentanillaView/>
      case 'usuarios':
        return <UsuariosView/>
      case 'reportes':
        return <ReportesView/>;
      default:
        return <CatalogoView />;
    }
  };

  return (
    <>
    <ToastProvider/>
    <div className="flex h-screen overflow-hidden bg-app text-text-primary transition-colors duration-300 font-sans">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col">
          {/* Aquí inyectamos la vista activa */}
          {renderView()}
        </main>
      </div>
    </div>
    </>
  );
}

export default App;