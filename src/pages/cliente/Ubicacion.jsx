import React from "react";
import "./Ubicacion.css"; 

const DIRECT_DIRECTIONS_URL = "https://www.google.com/maps/dir//Plaza+Santa+Cecilia,+Centenario+3,+Coatepec,+Ver.,+M%C3%A9xico/data=!4m9!4m8!1m0!1m5!1m1!19sChIJ9VWhddMt24URfMga8Eb8kRE!2m2!1d-96.953000899999992!2d19.4514171!3e0"; 

export default function Ubicacion() {
  return (
    <div className="ubicacion-section-wrapper animate-ios-entry">
      
      {/* Contenedor con efecto de profundidad */}
      <div className="map-container">
        <iframe
          title="Mapa Plaza Santa Cecilia"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.1025005199076!2d-96.95494312399292!3d19.451147040086685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85db2dfd3f913e8b%3A0x97a9442292494d90!2sBooz%20Studio!5e0!3m2!1ses!2smx!4v1770168937633!5m2!1ses!2smx"
          className="map-iframe"
          loading="lazy"
          allowFullScreen=""
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      {/* Centrado garantizado por flexbox en el padre */}
      <div className="directions-btn-container">
        <a 
          href={DIRECT_DIRECTIONS_URL} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-how-to-get"
        >
          ¿cómo llegar?
        </a>
      </div>
    </div>
  );
}