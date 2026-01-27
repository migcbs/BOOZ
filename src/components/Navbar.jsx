import React, { useEffect, useState } from "react"; 
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { FaFacebookF, FaInstagram, FaTiktok, FaUserCircle } from "react-icons/fa";

// 🟢 FUNCIÓN CLAVE: Permite el scroll suave a las secciones del Single Page Design.
const scrollToSection = (id) => {
  const element = document.getElementById(id);

  if (id === "inicio-section") {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  } else if (element) {
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

  // 🟢 ADECUACIÓN: Ocultar navbar en Auth y en rutas de Coach/Admin para limpiar el dashboard profesional
  const hideNavbar =
    location.pathname === "/login" || 
    location.pathname === "/register" ||
    location.pathname.startsWith("/coach") || 
    location.pathname.startsWith("/admin");

  // Detectar rol según la ruta
  const getRoleFromPath = () => {
    if (location.pathname.startsWith("/cliente")) return "cliente";
    if (location.pathname.startsWith("/coach")) return "coach";
    if (location.pathname.startsWith("/admin")) return "admin";
    return "";
  };

  const role = getRoleFromPath();

  // LINKS POR ROL: Solo el cliente usará estos links en el Navbar ahora
  const roleLinks = {
    cliente: [
      { id: "inicio-section", label: "Inicio" }, 
      { id: "calendario-section", label: "Calendario" },
      { id: "ubicacion-section", label: "Ubicación" }, 
    ],
    // Coach y Admin se dejan definidos por estructura, aunque no se renderizarán en el Navbar
    coach: [
      { to: "/coach/clientes", label: "Clientes" },
      { to: "/coach/calendario", label: "Calendario" },
      { to: "/coach/rutinas", label: "Rutinas" },
    ],
    admin: [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/usuarios", label: "Usuarios" },
    ],
  };

  const links = roleLinks[role] || [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 🟢 APLICACIÓN DE LA ADECUACIÓN
  if (hideNavbar) return null;

  // Home dinámico
  const homePath = "/cliente/home";

  // Función de navegación para clientes
  const handleClientNavigation = (id, e) => {
    if (location.pathname !== '/cliente/home' && location.pathname !== '/cliente') {
        e.preventDefault();
        navigate('/cliente/home'); 
        window.setTimeout(() => scrollToSection(id), 50); 
    } else {
        e.preventDefault();
        scrollToSection(id);
    }
  };

  return (
    <div className="navbar-container">
      <nav className={`navbar ${scrolled ? "scrolled" : ""} navbar-${role}`} role="navigation">
        
        {/* IZQUIERDA: Logo */}
        <div className="nav-left">
          <Link to={homePath} 
                className="nav-logo" 
                onClick={(e) => handleClientNavigation("inicio-section", e)}
          >
            <strong>BOOZ</strong>
          </Link>
        </div>

        {/* CENTRO: Solo para Cliente */}
        <div className="nav-center" role="menubar">
          {links.map((link) => (
            <a key={link.id} 
               href={`#${link.id}`} 
               className="nav-link" 
               onClick={(e) => {
                 if (link.id === 'inicio-section') {
                    handleClientNavigation(link.id, e);
                 } else {
                    e.preventDefault(); 
                    scrollToSection(link.id);
                 }
               }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* DERECHA: Perfil, Logout y Redes */}
        <div className="nav-right">
          <Link to={`/cliente/perfil`} className="nav-btn nav-btn-profile icon-only">
            <FaUserCircle size={22} />
          </Link>

          <button className="nav-btn logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>

          <div className="social-icons">
            <a href="https://www.facebook.com/profile.php?id=61584576365698" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
            <a href="https://www.instagram.com/booz.studio/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.tiktok.com/@booz.studio" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
          </div>
        </div>
      </nav>
    </div>
  );
}