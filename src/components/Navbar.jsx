import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";
import IsologoBooz from './assets/isologo.png';

const scrollToSection = (id) => {
  if (id === "inicio-section") {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [visible, setVisible]       = useState(false); // ✅ Para animación de entrada
  const [loggingOut, setLoggingOut] = useState(false); // ✅ Para feedback visual del logout
  const location  = useLocation();
  const navigate  = useNavigate();

  // ✅ Leer rol desde booz_user (clave correcta)
  const storedUser = localStorage.getItem("booz_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const role = currentUser?.role || "";

  const hideNavbar =
    location.pathname === "/login"     ||
    location.pathname === "/register"  ||
    location.pathname.startsWith("/coach") ||
    location.pathname.startsWith("/admin");

  const links = role === 'cliente' ? [
    { id: "inicio-section",    label: "Inicio"     },
    { id: "calendario-section", label: "Calendario" },
    { id: "ubicacion-section", label: "Ubicación"  },
  ] : [];

  // ✅ Ruta de perfil según rol
  const perfilPath =
    role === 'admin' ? '/admin/perfil' :
    role === 'coach' ? '/coach/perfil' :
    '/cliente/perfil';

  const handleScroll = useCallback(() => {
    const offset = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
    setScrolled(offset > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // ✅ Animación de entrada al montar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ✅ CORRECCIÓN: logout limpia las claves correctas
  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("booz_token");
      localStorage.removeItem("booz_user");
      navigate("/login");
    }, 350); // Pequeño delay para que se vea la animación
  };

  const handleClientNavigation = (id, e) => {
    if (e) e.preventDefault();
    if (location.pathname !== '/cliente/home' && location.pathname !== '/cliente') {
      navigate('/cliente/home');
      setTimeout(() => scrollToSection(id), 200);
    } else {
      scrollToSection(id);
    }
  };

  if (hideNavbar) return null;

  return (
    <div className={`navbar-container 
      ${scrolled  ? "scrolled-container" : ""} 
      ${visible   ? "nav-visible"        : "nav-hidden"}
      ${loggingOut ? "nav-leaving"       : ""}
    `}>
      <nav className={`navbar ${scrolled ? "scrolled" : ""} navbar-${role}`}>

        {/* LOGO */}
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

        {/* LINKS */}
        <div className="nav-center">
          {links.map((link, i) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="nav-link"
              style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              onClick={(e) => handleClientNavigation(link.id, e)}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* ACCIONES */}
        <div className="nav-right">
          <div className="nav-user-actions">
            {/* ✅ Perfil apunta a la ruta correcta según rol */}
            <Link to={perfilPath} className="nav-btn-profile" aria-label="Mi perfil">
              <FaUserCircle size={22} />
            </Link>
            <button
              className={`nav-btn logout-btn ${loggingOut ? "logging-out" : ""}`}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebookF /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
            <a href="https://tiktok.com"    target="_blank" rel="noreferrer" aria-label="TikTok"><FaTiktok /></a>
          </div>
        </div>

      </nav>
    </div>
  );
}