import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CatalogoView from './views/Catalogo/CatalogoView'; 
import VentanillaView from './views/Ventanilla/VentanillaView';
import UsuariosView from './views/Usuarios/UsuariosView';
import ReportesView from './views/Reportes/ReportesView';
import ToastProvider from './components/ToastProvider';
import api from './services/api';
import LoginView from './views/Login/LoginView';
import { useAuth } from './context/AuthContext';
import AuditoriasView from './views/Auditoria/AuditoriasView';

function App() {
  const [activeView, setActiveView] = useState('catalogo');
  const [isMobileOpen, setMobileOpen] = useState(false);
  const {user, loading} = useAuth();

  
  //Prueba de conexión automática al montar la aplicacion 
  
  useEffect(()=> {
    const probarConexion = async () =>{
      try{
        const respuesta = await api.get('/health');
        console.log ("Conexion con el Backend establecida con exito:", respuesta.data)
      }catch(error){
        console.error ("No se pudo conectar con el Backend",error);
      }
    };
    probarConexion();
  },[]);

  // Función para renderizar el componente correcto según el menú
  const renderView = () => {
    switch (activeView) {
      case 'catalogo': return <CatalogoView />;
      case 'ventanilla': return <VentanillaView/>;
      case 'usuarios': return <UsuariosView/>;
      case 'reportes': return <ReportesView/>;
      case 'auditorias': return <AuditoriasView/>;
      default: return <CatalogoView />;
    }
  };

  // 1. Pantalla de carga mientras lee el token del localStorage
  if (loading) {
    return (
      <div className="h-screen w-screen bg-app flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. Si NO hay usuario, renderizamos ÚNICAMENTE la pantalla de Login
  if (!user) {
    return (
      <>
        <ToastProvider />
        <LoginView />
      </>
    );
  }

  // 3. Si SÍ hay usuario, renderizamos tu Dashboard con Sidebar y Navbar
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
          <main className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col animate-fade-in">
            {/* Aquí inyectamos la vista activa */}
            {renderView()}
          </main>
        </div>
      </div>
    </>
  );
}

export default App;