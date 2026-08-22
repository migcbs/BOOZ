import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";
import IsologoBooz from './assets/isologo.png';
import API_BASE_URL from '../apiConfig';

const DEFAULT_SOCIAL = {
  facebookUrl: 'https://www.facebook.com/booz.studio',
  instagramUrl: 'https://www.instagram.com/booz.studio/',
  tiktokUrl: 'https://www.tiktok.com/@booz.studio',
};

const scrollToSection = (id) => {
  if (id === "inicio-section") {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [visible, setVisible]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = localStorage.getItem("booz_user");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const role = currentUser?.role || "";
  const [social, setSocial] = useState(DEFAULT_SOCIAL);

  useEffect(() => {
    fetch(`${API_BASE_URL}/config`)
      .then(res => res.json())
      .then(data => setSocial(s => ({
        facebookUrl: data?.facebookUrl || s.facebookUrl,
        instagramUrl: data?.instagramUrl || s.instagramUrl,
        tiktokUrl: data?.tiktokUrl || s.tiktokUrl,
      })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem("booz_user");
      setCurrentUser(s ? JSON.parse(s) : null);
    } catch { setCurrentUser(null); }
  }, [location.pathname]);

  const hideNavbar =
    location.pathname === "/login"    ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/coach") ||
    location.pathname.startsWith("/admin");

  const links = [
    { id: "inicio-section",     label: "Inicio"    },
    { id: "calendario-section", label: "Clases"    },
    { id: "ubicacion-section",  label: "Ubicación" },
  ];

  const perfilPath =
    role === 'admin' ? '/admin/perfil' :
    role === 'coach' ? '/coach/perfil' :
    '/cliente/perfil';

  const handleScroll = useCallback(() => {
    const offset = window.scrollY || document.documentElement.scrollTop;
    setScrolled(offset > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("booz_token");
      localStorage.removeItem("booz_user");
      navigate("/cliente/home");
      setLoggingOut(false); // Resetear estado por si acaso
    }, 350);
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
    <div className={`navbar-container ${scrolled ? "scrolled-container" : ""} ${visible ? "nav-visible" : "nav-hidden"} ${loggingOut ? "nav-leaving" : ""}`}>
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
            {currentUser ? (
              <>
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
              </>
            ) : (
              <>
                <Link to="/login" className="nav-btn-profile" aria-label="Iniciar sesión">
                  <FaUserCircle size={22} />
                </Link>
                <Link to="/login" className="nav-btn logout-btn">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>

          <div className="social-icons">
            <a href={social.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href={social.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href={social.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
          </div>
        </div>

      </nav>
    </div>
  );
}