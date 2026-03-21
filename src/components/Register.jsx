import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import ErrorNotification from "./ErrorNotification";
import "./Register.css";
import API_BASE_URL from '../apiConfig.js';

export default function Register() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre:             "",
    apellido:           "",
    correo:             "",
    telefono:           "",
    fechaNacimiento:    "",
    password:           "",
    passwordConfirm:    "",
    contactoEmergencia: "",
    responsivaFirmada:  false,
    tipoSangre:         "",
    enfermedades:       "",
    lesiones:           "",
  });

  const [showPass, setShowPass]             = useState(false);
  const [errors, setErrors]                 = useState({});
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showResponsiva, setShowResponsiva] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())                    e.nombre            = "El nombre es obligatorio.";
    if (!form.apellido.trim())                  e.apellido          = "El apellido es obligatorio.";
    if (!form.correo.includes("@"))             e.correo            = "Correo inválido.";
    if (form.password.length < 8)               e.password          = "Mínimo 8 caracteres.";
    if (form.password !== form.passwordConfirm) e.passwordConfirm   = "Las contraseñas no coinciden.";
    if (!form.responsivaFirmada)                e.responsivaFirmada = "Acepta la responsiva para continuar.";

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
    setLoading(true);

    const userToSave = {
      nombre:             form.nombre.trim(),
      apellido:           form.apellido.trim(),
      email:              form.correo.toLowerCase().trim(),
      password:           form.password,
      telefono:           form.telefono,
      contactoEmergencia: form.contactoEmergencia,
      fechaNacimiento:    form.fechaNacimiento || null,
      tipoSangre:         form.tipoSangre || null,
      alergias:           form.enfermedades || null,
      lesiones:           form.lesiones || null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(userToSave),
      });

      const data = await response.json();

      if (response.ok) {
        const { user, token } = data;

        localStorage.setItem("booz_token", token);
        localStorage.setItem("booz_user", JSON.stringify({
          id:                  user.id,
          nombre:              user.nombre,
          apellido:            user.apellido,
          email:               user.email,
          role:                user.role || "cliente",
          creditosDisponibles: user.creditosDisponibles || 0,
          tipoCliente:         user.tipoCliente,
          suscripcionActiva:   user.suscripcionActiva,
        }));

        navigate("/cliente/inicio");

      } else {
        setErrors({ general: data.error || "El email ya está registrado." });
        setShowErrorPopup(true);
      }

    } catch (err) {
      setErrors({ general: "Error de conexión con el servidor Booz." });
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* Botón de regreso */}
      <Link to="/login" className="back-button" aria-label="Volver al inicio de sesión">
        <FaArrowLeft />
        <span>Iniciar sesión</span>
      </Link>

      <h2 className="auth-title">Registro</h2>
      <p className="auth-subtitle">Crea tu cuenta en Booz Studio</p>

      {showErrorPopup && (
        <ErrorNotification errors={errors} onClose={() => setShowErrorPopup(false)} />
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* Datos personales */}
        <p className="form-section-label">Datos personales</p>

        <div className="input-row">
          <div className="input-group">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" className="auth-input"
              value={form.nombre} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" name="apellido" className="auth-input"
              value={form.apellido} onChange={handleChange} required />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" name="correo" type="email" className="auth-input"
            placeholder="tu@correo.com"
            value={form.correo} onChange={handleChange} required />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" name="telefono" className="auth-input"
              placeholder="55 1234 5678"
              value={form.telefono} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input id="fechaNacimiento" name="fechaNacimiento" type="date"
              className="auth-input"
              value={form.fechaNacimiento} onChange={handleChange} />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="contactoEmergencia">Contacto de emergencia</label>
          <input id="contactoEmergencia" name="contactoEmergencia" className="auth-input"
            placeholder="Nombre y teléfono"
            value={form.contactoEmergencia} onChange={handleChange} />
        </div>

        {/* Seguridad */}
        <p className="form-section-label">Seguridad</p>

        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <div className="password-wrapper">
            <input id="password" name="password"
              type={showPass ? "text" : "password"}
              className="auth-input"
              placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={handleChange} required />
            <button type="button" className="toggle-pass"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="passwordConfirm">Confirmar contraseña</label>
          <input id="passwordConfirm" name="passwordConfirm" type="password"
            className="auth-input"
            placeholder="Repite tu contraseña"
            value={form.passwordConfirm} onChange={handleChange} required />
        </div>

        {/* Información médica */}
        <p className="form-section-label">Información médica</p>

        <div className="input-group">
          <label htmlFor="tipoSangre">Tipo de sangre</label>
          <select id="tipoSangre" name="tipoSangre"
            className="auth-input auth-select"
            value={form.tipoSangre} onChange={handleChange}>
            <option value="">Selecciona...</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="enfermedades">Enfermedades o condiciones médicas</label>
          <textarea id="enfermedades" name="enfermedades"
            className="auth-input auth-textarea"
            placeholder="Ej. diabetes, hipertensión... (opcional)"
            value={form.enfermedades} onChange={handleChange} rows={2} />
        </div>

        <div className="input-group">
          <label htmlFor="lesiones">Lesiones o limitaciones físicas</label>
          <textarea id="lesiones" name="lesiones"
            className="auth-input auth-textarea"
            placeholder="Ej. lesión de rodilla, lumbalgia... (opcional)"
            value={form.lesiones} onChange={handleChange} rows={2} />
        </div>

        {/* Responsiva */}
        <label className="checkbox-label">
          <input type="checkbox" name="responsivaFirmada"
            checked={form.responsivaFirmada} onChange={handleChange} />
          <span className="checkbox-text">
            Acepto la responsiva y los{" "}
            <span className="auth-link-highlight">términos de Booz Studio</span>.
          </span>
        </label>

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>

      </form>

      <div className="auth-footer">
        <p className="auth-secondary-text">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="auth-link-highlight">
            Iniciar sesión
          </Link>
        </p>
      </div>

    </div>
  );
}