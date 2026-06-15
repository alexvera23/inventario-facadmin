import React, { useState, useEffect } from 'react';
import UserDrawer from './UserDrawer';
import ReportModal from '../Catalogo/ReportModal';
import { toastService } from '../../services/toastService';
import api from '../../services/api';
import UsuarioModal from '../../components/Modals/UsuarioModal';

export default function UsuariosView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen]= useState(false);

  // --------------------------------------------------------
  // ESTADOS PARA DATOS REALES DE LA API
  // --------------------------------------------------------
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Petición automática al cargar la vista
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamada al endpoint del backend (Lista Ligera)
      const response = await api.get('/usuarios');
      
      // Saneamiento de datos y cálculo dinámico de iniciales
      const usuariosSeguros = response.data.map(u => {
        // Extraemos la primera letra de las primeras dos palabras del nombre
        const initials = u.nombre 
          ? u.nombre.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
          : 'US';

        return {
          ...u,
          initials,
          departamento: u.departamento || 'Sin asignar',
          edificio: u.edificio || 'No especificado', // Prisma no tiene edificio aún, lo dejamos como fallback
          solicitudes: Number(u.total_solicitudes || 0), // Mapeamos a la propiedad de la DB
          activo: u.activo !== false
        };
      });

      setUsuarios(usuariosSeguros);
    } catch (err) {
      console.error('Error al traer los usuarios:', err);
      setError('No se pudo cargar la lista de usuarios. Verifica la conexión con la base de datos.');
      if (toastService && toastService.error) {
        toastService.error('Error de conexión al obtener usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de búsqueda seguro
  const usuariosFiltrados = usuarios.filter(u => {
    const nombre = u.nombre?.toLowerCase() || '';
    const departamento = u.departamento?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    
    return nombre.includes(query) || departamento.includes(query);
  });

  const handleRowClick = (usuario) => {
    setSelectedUser(usuario);
    setIsDrawerOpen(true);
  };

  const handleOpenReport = (usuario) => {
    setIsDrawerOpen(false); 
    setIsReportModalOpen(true); 
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Usuarios / Solicitantes</h2>
          <p className="text-text-muted text-sm mt-1">{usuarios.length} usuarios registrados · Personal activo</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Botón de recarga manual */}
          <button 
            onClick={fetchUsuarios}
            disabled={loading}
            className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            title="Sincronizar directorio"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.212 15M16 11.5H21.5V6" />
            </svg>
          </button>

          <input 
            type="text" 
            placeholder="Buscar usuario o depto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none flex-1 sm:w-56 focus:border-accent transition-all"
          />
          <button onClick={() => setIsUserModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 rounded-lg bg-text-primary text-app font-heading font-bold text-sm transition-opacity hover:opacity-85 whitespace-nowrap dark:bg-accent dark:text-[#002D4C]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Renderizado condicional: Carga / Error / Tabla */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary font-semibold">Consultando directorio de personal...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl mb-3">⚠️</span>
          <p className="text-red-500 font-bold mb-2">{error}</p>
          <button 
            onClick={fetchUsuarios}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-inputBg">
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Usuario</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted hidden sm:table-cell">Departamento</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted hidden md:table-cell">Edificio</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Solicitudes (Mes)</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuariosFiltrados.map((u) => (
                  <tr 
                    key={u.id} 
                    onClick={() => handleRowClick(u)}
                    className="hover:bg-tableHover cursor-pointer transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-heading font-bold text-xs flex-shrink-0">
                          {u.initials}
                        </div>
                        <span className="font-semibold text-text-primary">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-secondary hidden sm:table-cell">{u.departamento}</td>
                    <td className="p-4 text-sm text-text-muted hidden md:table-cell">{u.edificio}</td>
                    <td className="p-4 text-center">
                      <span className="font-heading font-bold text-accent text-base">{u.solicitudes}</span>
                    </td>
                    <td className="p-4 text-center">
                      {u.activo ? (
                        <span className="bg-green-500/10 text-green-600 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">ACTIVO</span>
                      ) : (
                        <span className="bg-red-500/10 text-red-500 font-heading text-[0.7rem] font-bold px-3 py-1 rounded-full">INACTIVO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {usuariosFiltrados.length === 0 && (
              <div className="p-8 text-center text-text-muted">
                No se encontraron usuarios en la base de datos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer */}
      <UserDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        usuario={selectedUser} 
        onOpenReport={handleOpenReport}
      />

      {/* Report Modal Reutilizado */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialScope="usuario"
        initialSubjectId={selectedUser?.id}
      />

      {/* Formulario Modal */}
      <UsuarioModal
      isOpen={isUserModalOpen}
      onClose={()=> setIsUserModalOpen(false)}
      onSuccess={fetchUsuarios}
      />

    </div>
  );
}