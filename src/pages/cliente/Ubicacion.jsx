import React from "react";
import "./Styles.css";

// 💡 REEMPLAZA ESTA URL con la URL de tu ubicación en Google Maps
// Asegúrate de usar la URL que abre la navegación o la ubicación directa.
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/TU_UBICACION_REAL_AQUI"; 
const IFRAME_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.418465492193!2d-99.19156688469595!3d19.29744118704285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cdff9042b32f91%3A0x2897217351658428!2sEl%20Angel%20de%20la%20Independencia!5e0!3m2!1ses-419!2smx!4v1625078400000!5m2!1ses-419!2smx"; 
// Usé el Ángel de la Independencia como placeholder de ejemplo.

export default function Ubicacion() {
  return (
    <div className="ubicacion-container"> 
      <h2>¿Dónde Estamos?</h2>

      {/* 🟢 MAPA CON MAYOR ALTURA (500px) */}
      <iframe
        title="Gym Location"
        className="mapa-iframe" 
        frameBorder="0"
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        // 💡 Usa la URL de 'embed' de Google Maps
        src={IFRAME_EMBED_URL}
      ></iframe>
      
      {/* 🟢 BOTÓN FUNCIONAL "CÓMO LLEGAR" */}
      <a 
        href={GOOGLE_MAPS_URL} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="btn-como-llegar"
        aria-label="Obtener direcciones en Google Maps"
      >
        {/* Usamos un emoji o un ícono de flecha/mapa */}
        📍 Cómo Llegar Ahora
      </a>
      
    </div>
  );
}