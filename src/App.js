import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Perfil      from "./pages/cliente/Perfil";
import ClienteHome from "./pages/cliente/ClienteHome";

import CoachHome     from "./pages/coach/CoachHome";
import CoachCalendar from "./pages/coach/CoachCalendar";
import Clientes      from './pages/coach/Clientes';
import ListaEspera   from './pages/coach/AdminListaEspera';
import CoachStats    from './pages/coach/CoachStats';
import Rutinas       from './pages/coach/Rutinas';

import AdminHome from "./pages/admin/AdminHome";

import Login          from "./components/Login";
import Register       from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div className="app-viewport">
        <Navbar />
        <main className="main-content">
          <Routes>

            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* CLIENTE */}
            <Route path="/cliente/home"
              element={<ProtectedRoute element={ClienteHome} allowedRoles={["cliente"]} />}
            />
            <Route path="/cliente/perfil"
              element={<ProtectedRoute element={Perfil} allowedRoles={["cliente"]} />}
            />
            <Route path="/cliente/*" element={<Navigate to="/cliente/home" replace />} />

            {/* COACH — específicas ANTES del fallback */}
            <Route path="/coach/home"
              element={<ProtectedRoute element={CoachHome} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/calendario"
              element={<ProtectedRoute element={CoachCalendar} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/clientes"
              element={<ProtectedRoute element={Clientes} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/espera"
              element={<ProtectedRoute element={ListaEspera} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/stats"
              element={<ProtectedRoute element={CoachStats} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/rutinas"
              element={<ProtectedRoute element={Rutinas} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/perfil"
              element={<ProtectedRoute element={Perfil} allowedRoles={["coach","admin"]} />}
            />
            <Route path="/coach/*" element={<Navigate to="/coach/home" replace />} />

            {/* ADMIN */}
            <Route path="/admin/*"
              element={<ProtectedRoute element={AdminHome} allowedRoles={["admin"]} />}
            />

            <Route path="*" element={
              <h2 style={{ textAlign: 'center', marginTop: '100px' }}>
                404 - Página no encontrada
              </h2>
            } />

          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;