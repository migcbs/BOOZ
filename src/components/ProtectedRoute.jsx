import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

// ======================================================
// ProtectedRoute — Verifica sesión real con el servidor
//
// Uso en App.js (sin cambios en cómo lo llamas):
//   <ProtectedRoute element={MiComponente} allowedRoles={["cliente"]} />
// ======================================================
function ProtectedRoute({ element: Component, allowedRoles, children }) {

  // Estados posibles: "checking" | "ok" | "unauth" | "forbidden"
  const [status, setStatus] = useState("checking");
  const [user, setUser]     = useState(null);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("booz_token");
      const stored = localStorage.getItem("booz_user");

      console.log('1️⃣ TOKEN:', token ? token.substring(0, 20) + '...' : 'NO HAY');
      console.log('2️⃣ STORED:', stored ? 'existe' : 'NO HAY');
      console.log('3️⃣ API_BASE_URL:', API_BASE_URL);

      if (!token || !stored) {
        console.log('❌ Sin token → unauth');
        setStatus("unauth");
        return;
      }

      try {
        console.log('4️⃣ Haciendo fetch a:', `${API_BASE_URL}/me`);
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('5️⃣ Status respuesta:', res.status);

        if (res.status === 401 || res.status === 403) {
          console.log('❌ Token rechazado por servidor');
          localStorage.removeItem("booz_token");
          localStorage.removeItem("booz_user");
          setStatus("unauth");
          return;
        }

        if (!res.ok) {
          console.log('⚠️ Error servidor, usando datos locales');
          const localUser = JSON.parse(stored);
          setUser(localUser);
          const allowed = !allowedRoles || allowedRoles.includes(localUser.role);
          console.log('6️⃣ Allowed con datos locales:', allowed);
          setStatus(allowed ? "ok" : "forbidden");
          return;
        }

        const freshUser = await res.json();
        console.log('7️⃣ Usuario fresco:', freshUser.role);
        const allowed = !allowedRoles || allowedRoles.includes(freshUser.role);
        console.log('8️⃣ Allowed:', allowed, '| allowedRoles:', allowedRoles);
        setStatus(allowed ? "ok" : "forbidden");

      } catch (err) {
        console.log('💥 CATCH ERROR:', err.message);
        try {
          const localUser = JSON.parse(stored);
          const allowed = !allowedRoles || allowedRoles.includes(localUser.role);
          console.log('9️⃣ Fallback local, allowed:', allowed);
          setUser(localUser);
          setStatus(allowed ? "ok" : "forbidden");
        } catch {
          console.log('💀 Fallback también falló');
          setStatus("unauth");
        }
      }
    };

    verify();
  }, []);  // Solo al montar — cada página protegida verifica su propia sesión

  // Mientras verifica, mostrar pantalla de carga
  if (status === "checking") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "80vh",
        flexDirection: "column",
        gap: "1rem",
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: "3px solid #e5e7eb",
          borderTop: "3px solid #8FD9FB",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#6b7280", fontSize: 13 }}>Verificando sesión...</p>
      </div>
    );
  }

  // No autenticado → al login
  if (status === "unauth") return <Navigate to="/login" replace />;

  // Autenticado pero rol incorrecto → al dashboard de su rol
  if (status === "forbidden") {
    const rol = user?.role;
    if (rol === "admin")      return <Navigate to="/admin/dashboard" replace />;
    if (rol === "coach")      return <Navigate to="/coach/home" replace />;
    return <Navigate to="/cliente/inicio" replace />;
  }

  // ✅ Todo OK — renderizar contenido
  if (children) return <>{children}</>;
  if (Component) return <Component user={user} userRole={user?.role} />;
  return null;
}

export default ProtectedRoute;