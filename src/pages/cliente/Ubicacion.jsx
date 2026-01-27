import React from "react";

// 🚀 URL QUE LANZA LAS DIRECCIONES DIRECTO HACIA PLAZA SANTA CECILIA
const DIRECT_DIRECTIONS_URL = "https://www.google.com/maps/dir//Plaza+Santa+Cecilia,+Centenario+3,+Coatepec,+Ver.,+M%C3%A9xico/data=!4m9!4m8!1m0!1m5!1m1!19sChIJ9VWhddMt24URfMga8Eb8kRE!2m2!1d-96.953000899999992!2d19.4514171!3e0"; 

export default function Ubicacion() {
  return (
    <>
      {/* 🟢 MAPA CON BORDES REDONDEADOS TIPO iOS */}
      <div style={{ position: "relative", width: "100%", maxWidth: "900px", margin: "0 auto" }}>
        <iframe
          title="Mapa Plaza Santa Cecilia"
          width="100%"
          height="450"
          style={{ 
            border: 0, 
            borderRadius: "32px", 
            filter: "grayscale(0.1) contrast(1.05)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)" // Sombra más suave para fondo claro
          }}
          loading="lazy"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d257.3616241398672!2d-96.95270203019027!3d19.451100572814777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85db2dfd3f913e8b%3A0x97a9442292494d90!2sBooz%20Studio!5e0!3m2!1ses!2smx!4v1768180732676!5m2!1ses!2smx"
          allowFullScreen=""
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>

        {/* 🟢 BOTÓN APPLE LIQUID GLASS iOS 26 */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <a 
            href={DIRECT_DIRECTIONS_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              // Geometría y Texto basado en Manual
              padding: "16px 45px",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#8FD9FB", // Azul del manual
              textTransform: "uppercase",
              textDecoration: "none",
              fontSize: "bolder",
              display: "inline-block",
              borderRadius: "50px", 
              letterSpacing: "2px",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              cursor: "pointer",

              // Efecto Liquid Glass Ajustado
              backgroundColor: "rgba(255, 255, 255, 0.6)", // Más opaco para fondo claro
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              
              // Bordes de alta definición
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
              
              // Sombra de profundidad
              boxShadow: "0 10px 25px rgba(180, 145, 68, 0.1)", // Sombra cálida basada en el Oro del manual
            }}
            // Efectos dinámicos
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
              e.currentTarget.style.transform = "scale(1.05) translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 15px 30px rgba(143, 217, 251, 0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
              e.currentTarget.style.transform = "scale(1) translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(180, 145, 68, 0.1)";
            }}
          >
            ¿cómo llegar?
          </a>
        </div>
      </div>
    </>
  );
}