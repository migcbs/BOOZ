// src/components/ProtectedRoute.js

import React from "react";
import { Navigate } from "react-router-dom";

// 🟢 AJUSTE CLAVE: Recibimos tanto 'element' (renombrado a Component) como 'children'.
function ProtectedRoute({ element: Component, allowedRoles, children }) {
  
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  // const user = JSON.parse(localStorage.getItem("user")); // Versión simplificada, pero la de arriba es más segura si 'user' puede ser null/undefined.

  // 1. Verificar Autenticación
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Verificar Rol
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Si el rol no está permitido, redirigir
    // Opcionalmente, puedes redirigir a una página de error 403 en lugar de login.
    return <Navigate to="/login" replace />; 
  }

  // 3. Renderizar Contenido
  
  // A) Si hay CHILDREN (Rutas Anidadas - Usado para el Cliente)
  if (children) {
    // Si la verificación pasa y hay hijos, los renderizamos (serán las <Routes> anidadas)
    return <>{children}</>;
  }

  // B) Si hay ELEMENT (Componente Directo - Usado para Coach/Admin)
  if (Component) {
    // Si la verificación pasa y se pasó un componente, lo renderizamos
    // Nota: El prop 'userRole' no es estrictamente necesario, pero lo mantengo por si lo usas.
    return <Component userRole={user.role} />;
  }
  
  return null; // Caso de respaldo
}

export default ProtectedRoute;