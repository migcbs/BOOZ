// Navbar.jsx (Ajustado)

import React, { useEffect, useState } from "react"; 
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { FaFacebookF, FaInstagram, FaTiktok, FaUserCircle } from "react-icons/fa";

// 🟢 FUNCIÓN CLAVE: Permite el scroll suave a las secciones del Single Page Design.
// Resta 100px para compensar la altura del Navbar fijo/flotante.
const scrollToSection = (id) => {
  const element = document.getElementById(id);

  if (id === "inicio-section") {
    // Si es "Inicio", scroll al tope (0) de la ventana.
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  } else if (element) {
    // Para cualquier otra sección, calcula la posición y compensa el Navbar (100px)
    window.scrollTo({
      top: element.offsetTop - 100,
      behavior: 'smooth',
    });
  }
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Ocultar navbar en login y register
  const hideNavbarOnAuth =
    location.pathname === "/login" || location.pathname === "/register";

  // Detectar rol según la ruta
  const getRoleFromPath = () => {
    if (location.pathname.startsWith("/cliente")) return "cliente";
    if (location.pathname.startsWith("/coach")) return "coach";
    if (location.pathname.startsWith("/admin")) return "admin";
    return "";
  };

  const role = getRoleFromPath();

  // LINKS POR ROL: Cliente usa IDs de sección, otros usan rutas (to)
  const roleLinks = {
    cliente: [
      { id: "inicio-section", label: "Inicio" }, 
      { id: "calendario-section", label: "Calendario" },
      //{ id: "paquetes-section", label: "Paquetes" },
      // ❌ Se eliminó 'contacto-section' y se reemplazó por 'ubicacion-section'
      { id: "ubicacion-section", label: "Ubicación" }, 
    ],

    coach: [
      { to: "/coach/clientes", label: "Clientes" },
      { to: "/coach/calendario", label: "Calendario" },
      { to: "/coach/rutinas", label: "Rutinas" },
      { to: "/coach/mensajes", label: "Mensajes" },
    ],

    admin: [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/usuarios", label: "Usuarios" },
      { to: "/admin/coaches", label: "Coaches" },
      { to: "/admin/config", label: "Configuración" },
    ],
  };

  const links = roleLinks[role] || [];

  // Efecto de scroll (Sin cambios)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout (Sin cambios)
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Ocultar navbar
  if (hideNavbarOnAuth) return null;

  // Home dinámico
  const homePath =
    role === "admin"
      ? "/admin/dashboard"
      : role === "coach"
      ? "/coach/clientes"
      : "/cliente/home";

  // 🟢 FUNCIÓN DE NAVEGACIÓN UNIVERSAL PARA CLIENTES (LOGO E INICIO)
  const handleClientNavigation = (id, e) => {
    // Si la ruta actual NO es la SPA (/cliente/home), primero navega, LUEGO scrollea
    if (location.pathname !== '/cliente/home' && location.pathname !== '/cliente') {
        e.preventDefault();
        
        // 1. Navega a la SPA Home
        navigate('/cliente/home'); 
        
        // 2. Espera un momento y luego aplica el scroll (necesario después de un cambio de página)
        window.setTimeout(() => scrollToSection(id), 50); 
    } else {
        // Si YA ESTAMOS en la SPA, solo aplicamos el scroll
        e.preventDefault();
        scrollToSection(id);
    }
  };


  return (
    <div className="navbar-container">
      <nav className={`navbar ${scrolled ? "scrolled" : ""} navbar-${role}`} role="navigation" aria-label="Barra de navegación principal">
        
        {/* IZQUIERDA: Logo/Home */}
        <div className="nav-left">
          {/* Logo: Si es cliente, usa handleClientNavigation */}
          <Link to={homePath} // Mantiene la ruta /cliente/home
                className="nav-logo" 
                aria-label="Ir a la página de inicio"
                onClick={role === "cliente" ? (e) => handleClientNavigation("inicio-section", e) : undefined}
          >
            <strong>BOOZ</strong>
          </Link>
        </div>

        {/* CENTRO: Links de navegación por rol */}
        <div className="nav-center" role="menubar">
          {links.map((link) => {
            
            // Renderizado para el cliente (Scroll con <a>)
            if (role === 'cliente') {
                return (
                    <a key={link.id} 
                       href={`#${link.id}`} 
                       className="nav-link" 
                       role="menuitem"
                       onClick={(e) => {
                         // Si es "Inicio", usa la función universal
                         if (link.id === 'inicio-section') {
                            handleClientNavigation(link.id, e);
                         } else {
                            // Para Calendar, Paquetes, Ubicación, solo hacemos scroll (solo funciona en SPA)
                            e.preventDefault(); 
                            scrollToSection(link.id);
                         }
                       }}
                    >
                      {link.label}
                    </a>
                );
            }
            
            // Renderizado para Coach y Admin (Navegación por ruta con <Link>)
            return (
              <Link key={link.to} to={link.to} className="nav-link" role="menuitem">
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* DERECHA: Botones y Redes Sociales */}
        <div className="nav-right">

          {/* 🟢 ICONO DE PERFIL: Usa la navegación por ruta /cliente/perfil */}
          <Link to={`/${role}/perfil`} className="nav-btn nav-btn-profile icon-only" aria-label="Ir a mi perfil">
            <FaUserCircle size={22} aria-hidden="true" />
          </Link>

          <button 
            className="nav-btn logout-btn" 
            onClick={handleLogout}
            aria-label="Cerrar sesión de la cuenta"
          >
            Cerrar sesión
          </button>

          {/* Redes sociales */}
          <div className="social-icons" aria-label="Redes sociales">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Visitar Facebook de Booz">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Visitar Instagram de Booz">
              <FaInstagram />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="Visitar TikTok de Booz">
              <FaTiktok />
            </a>
          </div>

        </div>
      </nav>
    </div>
  );
}