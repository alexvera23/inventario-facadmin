const auditoriaService = require('../services/auditoriaService');

const obtenerHistorial = async (req, res) => {
  try {
    //  Extraemos los parámetros de paginación y filtros desde la URL
    const { page, limit, busqueda, accion } = req.query;

    const historial = await auditoriaService.obtenerHistorial({
      page,
      limit,
      busqueda,
      accion
    });

    // El servicio ahora retorna el formato estandarizado: { data: [...], pagination: {...} }
    return res.status(200).json(historial);
  } catch (error) {
    console.error('[AuditoriaController Error]:', error);
    return res.status(500).json({ message: 'Error al obtener la bitácora de seguridad.' });
  }
};

module.exports = {
  obtenerHistorial
};