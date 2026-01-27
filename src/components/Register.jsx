import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ErrorNotification from "./ErrorNotification"; 
import "./Styles.css";
// 🟢 Importamos la configuración dinámica
import API_BASE_URL from '../apiConfig.js'; 

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "", apellido: "", correo: "", telefono: "",
    fechaNacimiento: "", password: "", passwordConfirm: "",
    contactoEmergencia: "", responsivaFirmada: false,
    enfermedades: "", condicion: "", condicionOtro: "", lesiones: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorPopup, setShowErrorPopup] = useState(false); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.correo.includes("@")) e.correo = "Correo inválido.";
    if (form.password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (form.password !== form.passwordConfirm) e.passwordConfirm = "No coinciden.";
    if (!form.responsivaFirmada) e.responsivaFirmada = "Acepta la responsiva.";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      setShowErrorPopup(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (evt) => { 
    evt.preventDefault();
    if (!validate()) return;

    // 🟢 Mapeo de datos para que coincidan con el server.js (Prisma)
    const userToSave = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.correo.toLowerCase().trim(),
        password: form.password, 
        telefono: form.telefono,
        // Datos adicionales que procesará el backend
        contactoEmergencia: form.contactoEmergencia,
        tipoSangre: form.condicion === 'otro' ? form.condicionOtro : form.condicion, 
        alergias: `Médico: ${form.enfermedades}. Lesiones: ${form.lesiones}`, 
    };

    try {
        /**
         * 🟢 ADECUACIÓN PARA VERCEL:
         * 1. Usamos API_BASE_URL.
         * 2. Cambiamos /register por /signup (ruta definida en tu server.js).
         */
        const response = await fetch(`${API_BASE_URL}/signup`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userToSave), 
          });

        const data = await response.json();

        if (response.ok) {
            // Guardamos la sesión inicial
            localStorage.setItem("user", JSON.stringify({
                id: data.user.id,
                nombre: data.user.nombre,
                apellido: data.user.apellido,
                email: data.user.email,
                role: data.user.role || "cliente", 
                creditosDisponibles: data.user.creditosDisponibles || 0
            }));
            
            // Redirección al Home de Cliente
            navigate("/cliente/inicio");
        } else {
            setErrors({ general: data.error || "El email ya está registrado." });
            setShowErrorPopup(true);
        }
    } catch (error) {
        setErrors({ general: "Error de conexión con el servidor Booz." });
        setShowErrorPopup(true);
    }
  };

  return (
    <div className="auth-container animate-ios-entry">
      <h2 className="auth-title">Registro de Cliente</h2>
      
      {showErrorPopup && <ErrorNotification errors={errors} onClose={() => setShowErrorPopup(false)} />}
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="input-group">
            <label>Nombre</label>
            <input name="nombre" className="auth-input" value={form.nombre} onChange={handleChange} required />
        </div>

        <div className="input-group">
            <label>Apellido</label>
            <input name="apellido" className="auth-input" value={form.apellido} onChange={handleChange} required />
        </div>

        <div className="input-group">
            <label>Correo electrónico</label>
            <input name="correo" type="email" className="auth-input" value={form.correo} onChange={handleChange} required />
        </div>

        <div className="input-group">
            <label>Teléfono</label>
            <input name="telefono" className="auth-input" value={form.telefono} onChange={handleChange} />
        </div>

        <div className="input-group">
            <label>Fecha de Nacimiento</label>
            <input name="fechaNacimiento" type="date" className="auth-input" value={form.fechaNacimiento} onChange={handleChange} />
        </div>

        <div className="input-group">
            <label>Contraseña</label>
            <div className="password-wrapper">
                <input name="password" type={showPass ? "text" : "password"} className="auth-input" value={form.password} onChange={handleChange} required />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>

        <div className="input-group">
            <label>Confirmar Contraseña</label>
            <input name="passwordConfirm" type="password" className="auth-input" value={form.passwordConfirm} onChange={handleChange} required />
        </div>

        <div className="input-group">
            <label>Contacto de Emergencia</label>
            <input name="contactoEmergencia" className="auth-input" value={form.contactoEmergencia} onChange={handleChange} />
        </div>

        <label className="checkbox-label">
          <input type="checkbox" name="responsivaFirmada" checked={form.responsivaFirmada} onChange={handleChange} />
          <span className="checkbox-text">Acepto la responsiva y términos de Booz Studio.</span>
        </label>

        <button className="auth-button" type="submit">Registrarme</button>
      </form>
    </div>
  );
}