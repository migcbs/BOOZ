// /pages/cliente/ClienteHome.jsx (Modificado para usar botón flotante)

import React from "react";
import Home from "./Home";
import CalendarPage from "./Calendar";
import Ubicacion from "./Ubicacion";
import Paquetes from "./Paquetes";
import WhatsAppButton from "./WhatsAppButton";
import ScrollReveal from "../../components/ScrollReveal";
import SEO from "../../components/SEO";
// ...

export default function ClienteHome() {
  return (
    <div className="cliente-home-container" style={{ paddingTop: "30px" }}>
      <SEO description="Movimiento, fuerza y equilibrio. Reserva tu clase en BOOZ Studio." />

      {/* 1. SECCIÓN PRINCIPAL / BANNER */}
      <Home />

      {/* 2. SECCIÓN DE CALENDARIO (La segunda sección vertical) */}
      <section id="calendario-section" className="page-content-padded">
        <ScrollReveal>
          <CalendarPage />
        </ScrollReveal>
      </section>

      {/* 3. SECCIÓN DE PAQUETES (Tercera sección vertical) */}


      {/* 4. SECCIÓN DE UBICACIÓN */}
      <section id="ubicacion-section" className="page-content-padded">
        <ScrollReveal>
          <Ubicacion />
        </ScrollReveal>
      </section>

      {/* 🟢 AÑADIR EL BOTÓN FLOTANTE AL FINAL */}
      <WhatsAppButton />

    </div>
  );
}