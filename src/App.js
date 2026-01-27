import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Cliente
import Perfil from "./pages/cliente/Perfil"; 
import ClienteHome from "./pages/cliente/ClienteHome";

// Coach
import CoachHome from "./pages/coach/CoachHome";
import Clientes from './pages/coach/Clientes'; 
import Rutinas from './pages/coach/Rutinas';

// Admin
import AdminHome from "./pages/admin/AdminHome";

// Auth
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "20px" }}>
          <Routes>
            {/* Redirección inicial */}
            <Route path="/" element={<Navigate to="/login" replace />} /> 
            
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* --- RUTAS CLIENTE --- */}
            <Route
              path="/cliente/perfil"
              element={<ProtectedRoute element={Perfil} allowedRoles={["cliente"]} />}
            />
            <Route
              path="/cliente/home"
              element={<ProtectedRoute element={ClienteHome} allowedRoles={["cliente"]} />}
            />
            {/* Fallback para cliente */}
            <Route path="/cliente/*" element={<Navigate to="/cliente/home" replace />} />

            {/* --- RUTAS COACH --- */}
            {/* Estas rutas coinciden exactamente con los links de tu Navbar */}
            <Route
              path="/coach/clientes"
              element={<ProtectedRoute element={Clientes} allowedRoles={["coach", "admin"]} />}
            />
            <Route
              path="/coach/rutinas"
              element={<ProtectedRoute element={Rutinas} allowedRoles={["coach", "admin"]} />}
            />
            <Route
              path="/coach/perfil"
              element={<ProtectedRoute element={Perfil} allowedRoles={["coach", "admin"]} />}
            />
            <Route
              path="/coach/home"
              element={<ProtectedRoute element={CoachHome} allowedRoles={["coach", "admin"]} />}
            />
            {/* Redirección por defecto para coach (Dashboard inicial) */}
            <Route path="/coach/*" element={<Navigate to="/coach/clientes" replace />} />

            {/* --- RUTAS ADMIN --- */}
            <Route
              path="/admin/*"
              element={<ProtectedRoute element={AdminHome} allowedRoles={["admin"]} />}
            />

            {/* Error 404 */}
            <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;