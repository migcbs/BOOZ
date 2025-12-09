// Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Importamos los iconos sutiles
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ErrorNotification from "./ErrorNotification"; // <-- Nuevo componente
import "./Styles.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    fechaNacimiento: "",
    password: "",
    passwordConfirm: "",
    contactoEmergencia: "",
    responsivaFirmada: false,
    enfermedades: "",
    condicion: "",
    condicionOtro: "",
    lesiones: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorPopup, setShowErrorPopup] = useState(false); // Estado para controlar el popup

  // Lógica de fuerza de contraseña (sin cambios)
  const passwordIsStrong = (pwd) => {
    const re =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;
    return re.test(pwd);
  };

  // Validación que ahora también muestra el popup
  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.apellido.trim()) e.apellido = "El apellido es obligatorio.";
    // ... (resto de validaciones sin cambios)
    if (!form.correo.trim()) e.correo = "El correo es obligatorio.";
    else {
        const mailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!mailRe.test(form.correo)) e.correo = "Correo no válido.";
    }

    if (!form.telefono.trim()) e.telefono = "El teléfono es obligatorio.";
    if (!form.fechaNacimiento) e.fechaNacimiento = "La fecha de nacimiento es obligatoria.";

    if (!form.password) e.password = "La contraseña es obligatoria.";
    else if (!passwordIsStrong(form.password))
      e.password = "Contraseña debe tener 8 caracteres, mayúscula, minúscula, número y símbolo."; // Mensaje mejorado

    if (form.password !== form.passwordConfirm)
      e.passwordConfirm = "Las contraseñas no coinciden.";

    if (!form.contactoEmergencia.trim())
      e.contactoEmergencia = "Contacto de emergencia requerido.";

    if (!form.responsivaFirmada)
      e.responsivaFirmada = "Debes aceptar la responsiva.";

    setErrors(e);
    
    // Si hay errores, mostramos el popup
    if (Object.keys(e).length > 0) {
        setShowErrorPopup(true);
        return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    
    // Si hay errores, la validación ya muestra el popup y detiene el proceso
    if (!validate()) return;

    const userToSave = {
      ...form,
      correo: form.correo.toLowerCase(),
      role: "cliente",
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Verificación de correo existente, también usa el sistema de errores
    if (existing.find((u) => u.correo === userToSave.correo)) {
      setErrors({ correo: "Ya existe una cuenta con ese correo." });
      setShowErrorPopup(true);
      return;
    }

    existing.push(userToSave);
    localStorage.setItem("users", JSON.stringify(existing));

    const sessionUser = {
      nombre: userToSave.nombre,
      apellido: userToSave.apellido,
      correo: userToSave.correo,
      role: "cliente",
    };

    localStorage.setItem("user", JSON.stringify(sessionUser));
    navigate("/cliente/home"); // Redirección a Home de cliente (mejor UX que a solo /cliente)
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Registro de Cliente</h2>

      {/* RENDERIZADO DEL NUEVO POPUP DE ERRORES */}
      {showErrorPopup && (
        <ErrorNotification 
          errors={errors} 
          onClose={() => setShowErrorPopup(false)} 
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* --- DATOS PERSONALES --- */}
        <label htmlFor="nombre">Nombre</label>
        <input name="nombre" id="nombre" className="auth-input" value={form.nombre} onChange={handleChange} autoComplete="given-name" />

        <label htmlFor="apellido">Apellido</label>
        <input name="apellido" id="apellido" className="auth-input" value={form.apellido} onChange={handleChange} autoComplete="family-name" />

        <label htmlFor="correo">Correo</label>
        <input name="correo" id="correo" type="email" className="auth-input" value={form.correo} onChange={handleChange} autoComplete="email" />

        <label htmlFor="telefono">Teléfono</label>
        <input name="telefono" id="telefono" type="tel" className="auth-input" value={form.telefono} onChange={handleChange} autoComplete="tel" />

        <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
        <input name="fechaNacimiento" id="fechaNacimiento" type="date" className="auth-input" value={form.fechaNacimiento} onChange={handleChange} />

        {/* --- CONTRASEÑA (CON ICONOS) --- */}
        <label htmlFor="password">Contraseña</label>
        <div className="password-wrapper">
          <input
            name="password"
            id="password"
            type={showPass ? "text" : "password"}
            className="auth-input"
            value={form.password}
            onChange={handleChange}
            // Eliminamos style inline, el CSS global ya maneja el padding
          />
          <button 
            type="button" 
            className="toggle-pass" 
            onClick={() => setShowPass((s) => !s)}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"} // A11y
          >
            {/* Reemplazo de Emojis por Iconos */}
            {showPass ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <label htmlFor="passwordConfirm">Confirmar contraseña</label>
        <div className="password-wrapper">
            <input
              name="passwordConfirm"
              id="passwordConfirm"
              type="password" // Siempre es password para esta
              className="auth-input"
              value={form.passwordConfirm}
              onChange={handleChange}
              // El input de confirmación no necesita botón de toggle
            />
        </div>


        {/* --- DATOS MÉDICOS --- */}
        <label htmlFor="contactoEmergencia">Contacto de emergencia</label>
        <input name="contactoEmergencia" id="contactoEmergencia" className="auth-input" value={form.contactoEmergencia} onChange={handleChange} />

        <label htmlFor="enfermedades">Enfermedades / lesiones previas</label>
        <textarea name="enfermedades" id="enfermedades" className="auth-input" rows="3" value={form.enfermedades} onChange={handleChange} />

        <label htmlFor="condicion">Condición médica actual</label>
        <select name="condicion" id="condicion" className="auth-input" value={form.condicion} onChange={handleChange}>
          <option value="">Ninguna</option>
          <option value="hipertenso">Hipertenso</option>
          <option value="diabetico">Diabético</option>
          <option value="presion-baja">Presión baja</option>
          <option value="otro">Otro</option>
        </select>

        {form.condicion === "otro" && (
          <>
            <label htmlFor="condicionOtro">Especificar otra condición</label>
            <input name="condicionOtro" id="condicionOtro" className="auth-input" value={form.condicionOtro} onChange={handleChange} />
          </>
        )}

        <label htmlFor="lesiones">Lesiones (especificar)</label>
        <textarea name="lesiones" id="lesiones" className="auth-input" rows="3" value={form.lesiones} onChange={handleChange} />

        {/* --- RESPONSIVA --- */}
        <label htmlFor="responsivaFirmada" className="checkbox-label">
          <input 
            type="checkbox" 
            name="responsivaFirmada" 
            id="responsivaFirmada" 
            checked={form.responsivaFirmada} 
            onChange={handleChange} 
          />
          <span>Acepto la responsiva y términos de servicio.</span>
        </label>
        
        {/* --- BOTONES --- */}
        <button className="auth-button" type="submit">Registrarme</button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="auth-secondary-btn auth-back-btn"
        >
          Volver al login
        </button>
      </form>
    </div>
  );
}