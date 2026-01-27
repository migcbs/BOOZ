/**
 * ARCHIVO DE CONFIGURACIÓN DE RED - BOOZ STUDIO
 * * En desarrollo (localhost), apunta al puerto 3001.
 * En producción (Vercel), utiliza rutas relativas /api para que 
 * el vercel.json redirija al server.js correctamente.
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://booz.vercel.app/api' 
    : 'http://localhost:3001/api';

export default API_BASE_URL;