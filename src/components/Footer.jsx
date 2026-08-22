import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} BOOZ — Todos los derechos reservados.</span>
      <span className="footer-legal-links">
        <Link to="/terminos">Términos y Condiciones</Link>
        {" · "}
        <Link to="/privacidad">Aviso de Privacidad</Link>
      </span>
    </footer>
  );
}
