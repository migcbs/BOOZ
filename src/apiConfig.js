// En producción la API vive en el mismo dominio (vercel.json reescribe /api/* a
// index.js), así que se llama de forma relativa: sin petición CORS previa
// (preflight) en cada POST/PUT con token y sin depender de booz.vercel.app.
// En desarrollo se usa REACT_APP_API_URL (el servidor local en :3001).
const enLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const API_BASE_URL = enLocal ? (process.env.REACT_APP_API_URL || 'http://localhost:3001/api') : '/api';

export default API_BASE_URL;
