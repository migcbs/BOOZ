// WhatsAppButton.jsx (Botón Flotante y Modal de Contacto - FINAL)

import React, { useState } from "react";
import { FaWhatsapp } from 'react-icons/fa'; // 🟢 Importar el ícono de WhatsApp
import { AiOutlineClose } from 'react-icons/ai'; // 🟢 Ícono para cerrar
import "./Styles.css";

// 💡 TU NÚMERO DE WHATSAPP (código de país + número, sin +, guiones o espacios)
const WHATSAPP_NUMBER = "522212477126"; 

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    edad: "", 
    interes: "clase", 
    horario: "",
  });

  const baseMessageOptions = {
    clase: (h) => `¡Hola! Me llamo ${form.nombre} (${form.edad} años) y quisiera reservar una clase de prueba. Mi horario de interés es: ${h}.`,
    informacion: () => `¡Hola! Me llamo ${form.nombre} (${form.edad} años) y quisiera más información general sobre sus clases y tarifas.`,
  };

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSendMessage() {
    // 1. Validar campos
    if (!form.nombre || !form.edad) {
        alert("Por favor, rellena tu nombre y edad.");
        return;
    }
    if (form.interes === 'clase' && !form.horario) {
        alert("Por favor, indica un horario de interés.");
        return;
    }
    
    // 2. Construir el mensaje
    const message = form.interes === 'clase' 
        ? baseMessageOptions.clase(form.horario)
        : baseMessageOptions.informacion();
    
    // 3. Codificar y abrir WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // 4. Cerrar y reiniciar
    setIsOpen(false);
    setForm({ nombre: "", edad: "", interes: "clase", horario: "" });
  }

  return (
    <>
      {/* 🟢 BOTÓN FLOTANTE SUTIL CON ÍCONO */}
      <button 
        className="floating-whatsapp-btn" 
        onClick={() => setIsOpen(true)}
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp size={28} color="#25D366" /> {/* Ícono de WhatsApp */}
      </button>

      {/* POP-UP / MODAL DEL FORMULARIO */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="whatsapp-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            
            <button className="btn-close-whatsapp-modal" onClick={() => setIsOpen(false)}>
                <AiOutlineClose size={20} /> {/* Ícono de cerrar sutil */}
            </button>
            
            <h3>Solicita Información</h3>
            <p className="modal-subtitle">Te enviaremos al chat de WhatsApp con el mensaje listo.</p>

            <div className="form-group">
                <label>Tu Nombre</label>
                <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: Sofía Martínez"
                />
            </div>

            <div className="form-group">
                <label>Tu Edad</label>
                <input
                    type="number"
                    name="edad"
                    value={form.edad}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: 25"
                />
            </div>
            
            {/* Selector de Interés */}
            <div className="form-group">
                <label>Quisiera...</label>
                <select
                    name="interes"
                    value={form.interes}
                    onChange={handleChange}
                    className="input-field"
                >
                    <option value="clase">Reservar una clase de prueba</option>
                    <option value="informacion">Solicitar más información</option>
                </select>
            </div>
            
            {/* Campo Condicional de Horario */}
            {form.interes === 'clase' && (
                <div className="form-group">
                    <label>Horario de Interés</label>
                    <input
                        type="text"
                        name="horario"
                        value={form.horario}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Ej: Lunes 7:00 PM o Sábado por la mañana"
                    />
                </div>
            )}

            <div className="modal-actions-whatsapp">
                <button 
                    className="btn-whatsapp-send"
                    onClick={handleSendMessage}
                >
                    <FaWhatsapp size={20} style={{ marginRight: '8px' }} /> Enviar
                </button>
                <button onClick={() => setIsOpen(false)} className="btn-cerrar-modal-whatsapp">
                    Cerrar
                </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}