import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} BOOZ — Todos los derechos reservados.
    </footer>
  );
}