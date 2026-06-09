import React, { useState } from 'react';
import UserDrawer from './UserDrawer';
import ReportModal from '../Catalogo/ReportModal'; // <-- Reciclamos el modal
import { toastService } from '../../services/toastService';
import api from '../../services/api';
const USUARIOS_MOCK = [
  { id: 'U01', initials: 'DR', nombre: 'Don Roque', departamento: 'Intendencia', edificio: 'Edificio 3', solicitudes: 48, activo: true },
  { id: 'U02', initials: 'MG', nombre: 'María García', departamento: 'Secretaría', edificio: 'Rectoría', solicitudes: 22, activo: true },
  { id: 'U03', initials: 'JL', nombre: 'José López', departamento: 'Laboratorios', edificio: 'Edificio 5', solicitudes: 35, activo: true },
  { id: 'U04', initials: 'AL', nombre: 'Ana Lara', departamento: 'Intendencia', edificio: 'Edificio 1', solicitudes: 61, activo: false },
  { id: 'U05', initials: 'CR', nombre: 'Carlos Ríos', departamento: 'Mantenimiento', edificio: 'Planta Baja', solicitudes: 17, activo: true },
];

export default function UsuariosView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  

  // Filtrado de búsqueda
  const usuariosFiltrados = USUARIOS_MOCK.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (usuario) => {
    setSelectedUser(usuario);
    setIsDrawerOpen(true);
  };

  const handleOpenReport = (usuario) => {
    setIsDrawerOpen(false); // Cierra el drawer para no estorbar
    setIsReportModalOpen(true); // Abre el modal de reportes pre-configurado
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Usuarios / Solicitantes</h2>
          <p className="text-text-muted text-sm mt-1">{USUARIOS_MOCK.length} usuarios registrados · Personal activo</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Buscar usuario o depto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-inputBg border-[1.5px] border-border rounded-lg py-2 px-4 text-sm text-text-primary outline-none flex-1 sm:w-56 focus:border-accent transition-all"
          />
          <button className="flex items-center justify-center gap-2 px-4 rounded-lg bg-text-primary text-app font-heading font-bold text-sm transition-opacity hover:opacity-85 whitespace-nowrap dark:bg-accent dark:text-[#002D4C]">

            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
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
              No se encontraron usuarios.
            </div>
          )}
        </div>
      </div>

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

    </div>
  );
}