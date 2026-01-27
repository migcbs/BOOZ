import React, { useEffect, useRef } from "react";
import "./Styles.css";

// Importamos el video
import LocalBannerVideo from './assets/banner.mp4'; 

export default function Home() {
  const backgroundRef = useRef(null); 
  
  const handleReserve = () => {
    window.scrollBy({ 
        top: 900, 
        behavior: 'smooth' 
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (backgroundRef.current) {
        const scrollPosition = window.scrollY; 
        const parallaxSpeed = 0.35; 
        const displacement = scrollPosition * parallaxSpeed;
        backgroundRef.current.style.transform = `translate3d(0, ${displacement}px, 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); 

  return (
    <div className="main-content-wrapper">
      <section className="banner">
        
        {/* Sustituimos el div por el elemento video */}
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
            <div className="image-darkener"></div>
        </div>
        
        <div className="banner-overlay">
          <button 
            className="reserve-button glass-button" 
            onClick={handleReserve}
            aria-label="Reservar clase ahora"
          >
            ¡Reserva Ya!
          </button>
        </div>
      </section>
    </div>
  );
}