const auditoriaService = require('../services/auditoriaService');

const obtenerHistorial = async (req, res) => {
  try {
    const historial = await auditoriaService.obtenerHistorial();
    return res.status(200).json(historial);
  } catch (error) {
    console.error('[AuditoriaController Error]:', error);
    return res.status(500).json({ message: 'Error al obtener la bitácora de seguridad.' });
  }
};

module.exports = {
  obtenerHistorial
};