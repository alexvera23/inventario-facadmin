import React, { useState, useEffect, useCallback } from 'react';
import UserDrawer from './UserDrawer';
import ReportModal from '../Reportes/ReportModal';
import { toastService } from '../../services/toastService';
import api from '../../services/api';
import UsuarioModal from '../../components/Modals/UsuarioModal';
import EditUsuarioModal from '../../components/Modals/EditUsuarioModal';
import PaginationControls from '../../components/PaginationControls';
import { useAuth } from '../../context/AuthContext';

export default function UsuariosView() {
  // ─── ESTADOS DE BÚSQUEDA Y FILTROS ───
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [rolFiltro, setRolFiltro] = useState('TODOS');

  // ─── ESTADOS DE PAGINACIÓN ───
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState(null);

  // ─── ESTADOS DE DATOS Y MODALES ───
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUsuarioModal, setIsEditModalOpen] = useState(false);
  const { user: currentUser } = useAuth();

  //  LÓGICA DE DEBOUNCE (Retraso de 500ms para la búsqueda)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1); // Regresamos a la página 1 si cambia el término
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  //  FETCH PRINCIPAL PAGINADO
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamada a la API paginada de Usuarios
      const response = await api.get('/usuarios', {
        params: {
          page,
          limit,
          busqueda: debouncedTerm,
          rol: rolFiltro
        }
      });

      const rawData = response.data.data || [];
      const pagination = response.data.pagination || null;

      // Saneamiento de datos y cálculo dinámico de iniciales
      const usuariosSeguros = rawData.map(u => {
        const initials = u.nombre 
          ? u.nombre.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
          : 'US';

        return {
          ...u,
          initials,
          departamento: u.departamento || 'Sin asignar',
          edificio: u.edificio || 'No especificado',
          solicitudes: Number(u.total_solicitudes || 0),
          activo: u.activo !== false
        };
      });

      setUsuarios(usuariosSeguros);
      setPaginationInfo(pagination);
    } catch (err) {
      console.error('Error al traer los usuarios:', err);
      setError('No se pudo cargar la lista de usuarios. Verifica la conexión con la base de datos.');
      toastService.error('ERROR EN EL SERVIDOR');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedTerm, rolFiltro]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // ─── HANDLERS DE UI ───
  const handleRowClick = (usuario) => {
    setSelectedUser(usuario);
    setIsDrawerOpen(true);
  };

  const handleOpenReport = () => {
    setIsDrawerOpen(false); 
    setIsReportModalOpen(true); 
  };

  const handleOpenEdit = () => {
    setIsDrawerOpen(false); 
    setIsEditModalOpen(true); 
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
              <h2 className="text-2xl font-heading font-bold text-text-primary">Usuarios / Solicitantes</h2>
            </div>
          <p className="text-text-muted text-sm mt-1">Directorio general del personal activo</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Botón de recarga manual */}
          <button 
            onClick={fetchUsuarios}
            disabled={loading}
            className="p-2.5 bg-card border border-border rounded-lg text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
            title="Sincronizar directorio"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Filtro por Rol */}
          <select
            value={rolFiltro}
            onChange={(e) => {
              setRolFiltro(e.target.value);
              setPage(1);
            }}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-3 text-sm font-semibold text-text-primary outline-none focus:border-accent"
          >
            <option value="TODOS"> Todos los Roles</option>
            <option value="SOLICITANTE"> Solicitantes</option>
            <option value="ENCARGADO"> Encargados</option>
            <option value="ADMIN"> Administradores</option>
          </select>

          {/* Búsqueda por texto con Debounce */}
          <input 
            type="text" 
            placeholder="Buscar por nombre, ID o depto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none flex-1 sm:w-64 focus:border-accent transition-all"
          />

          {/* Solo se muestra si el usuario logueado es ADMIN */}
          {currentUser?.rol === 'ADMIN' && (
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 rounded-lg bg-text-primary text-app font-heading font-bold text-sm transition-opacity hover:opacity-85 whitespace-nowrap dark:bg-accent dark:text-[#002D4C]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              <span className="hidden sm:inline">Nuevo Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* Renderizado condicional: Error / Tabla Paginada */}
      {error ? (
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
        <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-auto relative rounded-t-xl">
            {loading && (
              <div className="absolute inset-0 bg-card/50 backdrop-blur-[1px] z-10 flex justify-center items-center">
                 <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="border-b border-border bg-inputBg">
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted">Usuario</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted hidden sm:table-cell">Departamento</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted hidden md:table-cell">Rol</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Solicitudes (Mes)</th>
                  <th className="p-4 text-[0.7rem] font-heading font-bold tracking-wider uppercase text-text-muted text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuarios.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-text-muted italic">
                      No se encontraron usuarios en la base de datos.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
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
                          <div>
                            <p className="font-semibold text-text-primary">{u.nombre}</p>
                            <p className="text-xs text-text-muted font-mono">{u.id_interno}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-text-secondary hidden sm:table-cell">{u.departamento}</td>
                      <td className="p-4 text-xs font-mono font-bold text-text-muted hidden md:table-cell">{u.rol}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 🚀 COMPONENTE DE PAGINACIÓN */}
          <PaginationControls 
            pagination={paginationInfo}
            onPageChange={(nuevaPag) => setPage(nuevaPag)}
            onLimitChange={handleLimitChange}
          />

        </div>
      )}

      {/* Drawer */}
      <UserDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        usuario={selectedUser} 
        onOpenReport={handleOpenReport}
        onOpenEdit={handleOpenEdit}
      />

      {/* Report Modal */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialScope="usuario"
        initialSubjectId={selectedUser?.id}
      />

      {/* Formulario Modal Crear */}
      <UsuarioModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={fetchUsuarios}
      />

      {/* Formulario Modal Editar */}
      <EditUsuarioModal
        isOpen={isEditUsuarioModal}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchUsuarios}
        usuario={selectedUser}
      />

    </div>
  );
}