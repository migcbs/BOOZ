import React, { useEffect, useRef } from "react";
import "./Home.css";

// Importamos el video local
import LocalBannerVideo from './assets/banner.mp4'; 

/**
 * Componente Home: Banner principal con efecto Parallax y video de fondo.
 * Optimizada para superar conflictos de centrado en contenedores Flex.
 */
export default function Home() {
  const backgroundRef = useRef(null); 
  
  /**
   * 🟢 FUNCIÓN DE SCROLL BLINDADA
   * Usamos scrollIntoView para forzar al navegador a ignorar restricciones de alineación flex
   */
  const handleReserve = () => {
    const calendarSection = document.getElementById("calendario-section");
    
    if (calendarSection) {
      // scrollIntoView es más potente cuando el padre tiene justify-content: center
      calendarSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });

      // Pequeño log para confirmar ejecución en consola
      console.log("Comando scroll ejecutado hacia #calendario-section");
    } else {
      console.warn("No se encontró el elemento #calendario-section en el DOM");
      // Fallback: Si el ID falla, bajamos el alto de una pantalla
      window.scrollBy({ 
          top: window.innerHeight, 
          behavior: 'smooth' 
      });
    }
  };

  /**
   * 🟢 EFECTO PARALLAX OPTIMIZADO
   */
  useEffect(() => {
    const handleScroll = () => {
      if (backgroundRef.current) {
        const scrollPosition = window.scrollY; 
        const parallaxSpeed = 0.35; 
        const displacement = scrollPosition * parallaxSpeed;
        
        // Usamos requestAnimationFrame para sincronizar con el refresco de pantalla
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
        
        {/* Capa de video con Parallax */}
        <div ref={backgroundRef} className="banner-background fixed-background">
            <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="banner-video"
            >
                <source src={LocalBannerVideo} type="video/mp4" />
                Tu navegador no soporta videos.
            </video>
            {/* Filtro oscuro para legibilidad del botón */}
            <div className="image-darkener"></div>
        </div>
        
        {/* Interfaz de usuario sobre el video */}
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