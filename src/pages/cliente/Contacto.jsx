import React, { useState } from "react";
import "./Styles.css";

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "",
    mensaje: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div className="contacto-container">
      <h2>Contacto</h2>

      <label>Nombre</label>
      <input
        type="text"
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
      />

      <label>Mensaje</label>
      <textarea
        name="mensaje"
        value={form.mensaje}
        onChange={handleChange}
      />

      <button className="btn-enviar">Enviar</button>
    </div>
  );
}