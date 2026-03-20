import API_BASE_URL from './apiConfig';

// ======================================================
// authFetch — Wrapper de fetch con token JWT automático
//
// Úsalo en lugar de fetch() en cualquier componente
// que llame a rutas protegidas del backend.
//
// Ejemplo:
//   import authFetch from '../authFetch';
//   const res = await authFetch('/coach/clientes');
//   const clientes = await res.json();
// ======================================================
export default async function authFetch(endpoint, options = {}) {
    const token = localStorage.getItem("booz_token");

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            // ✅ Agrega el token en cada llamada automáticamente
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            // Permite sobreescribir headers si es necesario
            ...options.headers,
        },
    });

    // ✅ Si el token expiró, limpiar sesión y redirigir al login
    if (res.status === 401) {
        localStorage.removeItem("booz_token");
        localStorage.removeItem("booz_user");
        window.location.href = "/login";
        return;
    }

    return res;
}

// ======================================================
// Helpers de conveniencia para los métodos más comunes
// ======================================================

export const apiGet = (endpoint) =>
    authFetch(endpoint, { method: "GET" });

export const apiPost = (endpoint, body) =>
    authFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
    });

export const apiPut = (endpoint, body) =>
    authFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(body),
    });

export const apiDelete = (endpoint) =>
    authFetch(endpoint, { method: "DELETE" });