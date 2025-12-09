// Home.jsx

import React, { useEffect, useRef } from "react";
import "./Styles.css";

// CORRECCIÓN DE RUTA: 
import LocalBannerImage from './assets/image1.jpg'; 

export default function Home() {
  
  // 1. Referencia al elemento de fondo para manipular el parallax
  const backgroundRef = useRef(null); 
  
  const handleReserve = () => {
    // 🟢 LÓGICA DE SCROLL HACIA ABAJO (700px):
    // Esto desplaza la vista 700 píxeles hacia abajo desde la posición actual.
    window.scrollBy({ 
        top: 900, 
        behavior: 'smooth' // Desplazamiento suave
    });
    console.log("Desplazamiento suave 700px hacia abajo ejecutado.");
  };

  // 2. Lógica del Parallax usando useEffect
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

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); 


  return (
    <div className="main-content-wrapper">
      
      <section className="banner">
        
        <div 
          ref={backgroundRef} 
          className="banner-background fixed-background" 
          style={{ backgroundImage: `url(${LocalBannerImage})` }}
        >
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
      
      {/* 🛑 Asegúrate de tener suficiente contenido debajo del banner para que el scroll sea visible. */}
     
      
    </div>
  );
}