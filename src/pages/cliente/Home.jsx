import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Añadido
import "./Home.css";

import LocalBannerVideo from './assets/banner.mp4';

export default function Home() {
  const backgroundRef = useRef(null);
  const navigate      = useNavigate(); // ✅ Añadido

  /**
   * 🟢 BOTÓN "¡Reserva Ya!"
   * - Sin sesión  → redirige al login
   * - Con sesión  → scroll al calendario
   */
  const handleReserve = () => {
    const token = localStorage.getItem("booz_token");

    // ✅ Sin sesión: ir a login
    if (!token) {
      navigate("/login");
      return;
    }

    // ✅ Con sesión: scroll al calendario
    const calendarSection = document.getElementById("calendario-section");
    if (calendarSection) {
      calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log("Scroll ejecutado hacia #calendario-section");
    } else {
      console.warn("No se encontró #calendario-section en el DOM");
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  /**
   * 🟢 EFECTO PARALLAX
   */
  useEffect(() => {
    const handleScroll = () => {
      if (backgroundRef.current) {
        const parallaxSpeed  = 0.35;
        const displacement   = window.scrollY * parallaxSpeed;

        window.requestAnimationFrame(() => {
          if (backgroundRef.current) {
            backgroundRef.current.style.transform = `translate3d(0, ${displacement}px, 0)`;
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="main-content-wrapper" id="inicio-section">
      <section className="banner">

        {/* Video con Parallax */}
        <div ref={backgroundRef} className="banner-background fixed-background">
          <video autoPlay loop muted playsInline className="banner-video">
            <source src={LocalBannerVideo} type="video/mp4" />
            Tu navegador no soporta videos.
          </video>
          <div className="image-darkener"></div>
        </div>

        {/* UI sobre el video */}
        <div className="banner-overlay">
          <div className="banner-text-content">
            <button
              className="reserve-button glass-button"
              onClick={handleReserve}
              aria-label="Reservar clase ahora"
            >
              ¡Reserva Ya!
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}