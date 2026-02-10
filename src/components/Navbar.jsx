import React, { useEffect, useState, useCallback } from "react"; 
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { FaFacebookF, FaInstagram, FaTiktok, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";
import IsologoBooz from './assets/isologo.png';

// 🟢 FUNCIÓN DE SCROLL ULTRA-REFORZADA
const scrollToSection = (id) => {
  if (id === "inicio-section") {
    // 1. Intentamos con window
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 2. Fallback para cuando el scroll está en el elemento raíz (común en Chrome/Safari)
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    // 3. Fallback para el body
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const element = document.getElementById(id);
    if (element) {
      // scrollIntoView suele ignorar las restricciones de los contenedores Flex
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hideNavbar =
    location.pathname === "/login" || 
    location.pathname === "/register" ||
    location.pathname.startsWith("/coach") || 
    location.pathname.startsWith("/admin");

  const getRoleFromPath = () => {
    if (location.pathname.startsWith("/cliente")) return "cliente";
    if (location.pathname.startsWith("/coach")) return "coach";
    if (location.pathname.startsWith("/admin")) return "admin";
    return "";
  };

  const role = getRoleFromPath();

  const links = (role === 'cliente') ? [
    { id: "inicio-section", label: "Inicio" }, 
    { id: "calendario-section", label: "Calendario" },
    { id: "ubicacion-section", label: "Ubicación" }, 
  ] : []; // Simplificado para debugging

  const handleScroll = useCallback(() => {
    // Detectamos scroll de donde sea que venga
    const offset = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
    setScrolled(offset > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // También escuchamos el scroll en el body por si acaso
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (hideNavbar) return null;

  // 🟢 MANEJO DE NAVEGACIÓN Y REGRESO AL HOME
  const handleClientNavigation = (id, e) => {
    if (e) e.preventDefault();
    
    // Si NO estamos en el Home, primero navegamos y luego scrolleamos
    if (location.pathname !== '/cliente/home' && location.pathname !== '/cliente') {
        navigate('/cliente/home'); 
        // Esperamos a que la ruta cambie y el DOM cargue
        setTimeout(() => scrollToSection(id), 200); 
    } else {
        // Si ya estamos ahí, solo hacemos el scroll
        scrollToSection(id);
    }
  };

  return (
    <div className={`navbar-container ${scrolled ? "scrolled-container" : ""}`}>
      <nav className={`navbar ${scrolled ? "scrolled" : ""} navbar-${role}`}>
        
        {/* LOGO: Actúa como botón de "Inicio/Regreso" */}
       {/* LOGO: Protegido en un contenedor para evitar desconfiguración */}
      <div className="nav-left">
        <Link 
          to="/cliente/home" 
          className="nav-logo" 
          onClick={(e) => handleClientNavigation("inicio-section", e)}
        >
          <div className="logo-wrapper">
              <img src={IsologoBooz} alt="BOOZ" className="nav-isologo-img" />
          </div>
        </Link>
      </div>

        {/* LINKS: Inicio, Calendario, etc. */}
        <div className="nav-center">
          {links.map((link) => (
            <a 
              key={link.id} 
              href={`#${link.id}`} 
              className="nav-link" 
              onClick={(e) => handleClientNavigation(link.id, e)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-right">
          <div className="nav-user-actions">
            <Link to={`/cliente/perfil`} className="nav-btn-profile">
              <FaUserCircle size={22} />
            </Link>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              {scrolled ? "Cerrar sesión" : "Cerrar sesión"}
            </button>
          </div>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebookF /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer"><FaTiktok /></a>
          </div>
        </div>
      </nav>
    </div>
  );
}