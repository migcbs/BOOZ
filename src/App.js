// App.js

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// 🟢 Importamos el componente de Perfil
import Perfil from "./pages/cliente/Perfil"; 

import ClienteHome from "./pages/cliente/ClienteHome";
import CoachHome from "./pages/coach/CoachHome";
import AdminHome from "./pages/admin/AdminHome";

import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar />

        <main style={{ flex: 1, padding: "20px" }}>
          <Routes>
            {/* Redirección inicial */}
            <Route path="/" element={<Navigate to="/login" replace />} /> 

            {/* LOGIN y REGISTRO */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ========================================================= */}
            {/* 🟢 RUTA DE PERFIL (LA ÚNICA EXCEPCIÓN FUERA DE LA SPA HOME) */}
            {/* ========================================================= */}
            <Route
              path="/cliente/perfil" // Ruta exacta para Perfil
              element={
                <ProtectedRoute
                  element={Perfil} // Renderiza solo Perfil
                  allowedRoles={["cliente"]}
                />
              }
            />
            
            {/* ========================================================= */}
            {/* 🟢 RUTA DE CLIENTE HOME (LA SPA VERTICAL COMPLETA)         */}
            {/* ========================================================= */}
            <Route
              path="/cliente/*" // Esto atrapará /cliente o /cliente/home, pero no /cliente/perfil (porque ya se definió arriba)
              element={
                <ProtectedRoute
                  element={ClienteHome} // Renderiza la SPA vertical completa
                  allowedRoles={["cliente"]}
                />
              }
            />

            {/* RUTAS DE COACH */}
            <Route
              path="/coach/*"
              element={
                <ProtectedRoute
                  element={CoachHome}
                  allowedRoles={["coach", "admin"]}
                />
              }
            />

            {/* RUTAS DE ADMIN */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute
                  element={AdminHome}
                  allowedRoles={["admin"]}
                />
              }
            />

            {/* 404 */}
            <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;