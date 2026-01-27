import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Styles.css";
// 🟢 IMPORTACIÓN CORREGIDA
import API_BASE_URL from '../apiConfig'; 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Validación básica
    if (!email.trim() || !pass.trim()) {
      setError("Por favor, ingresa correo y contraseña.");
      return;
    }

    const credentials = {
      email: email.toLowerCase().trim(),
      password: pass,
    };

    try {
      // 🟢 ADECUACIÓN PARA VERCEL: Usamos API_BASE_URL en lugar de localhost
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        const loggedInUser = data.user;

        /**
         * 🟢 ADECUACIÓN MINUCIOSA: 
         * Mantenemos los nombres de las propiedades idénticos al Schema de Prisma
         * para que los créditos (9999 del seed) se vinculen correctamente.
         */
        const sessionUser = {
          id: loggedInUser.id,
          nombre: loggedInUser.nombre,
          apellido: loggedInUser.apellido,
          email: loggedInUser.email,
          role: loggedInUser.role || "cliente",
          creditosDisponibles: loggedInUser.creditosDisponibles, 
          tipoCliente: loggedInUser.tipoCliente,
          suscripcionActiva: loggedInUser.suscripcionActiva,
          planNombre: loggedInUser.planNombre
        };

        // Guardar sesión completa en LocalStorage
        localStorage.setItem("user", JSON.stringify(sessionUser));

        // LÓGICA DE REDIRECCIÓN BASADA EN ROLES
        if (sessionUser.role === "admin") {
          navigate("/admin/dashboard");
        } else if (sessionUser.role === "coach") {
          navigate("/coach/home");
        } else {
          navigate("/cliente/inicio");
        }

      } else {
        setError(data.message || "Credenciales inválidas.");
      }
      
    } catch (error) {
        console.error("Fallo durante el inicio de sesión:", error);
        // 🟢 MENSAJE ACTUALIZADO: Más genérico para producción
        setError("Error de conexión con el servidor Booz.");
    }
  };

  return (
    <div className="auth-container animate-ios-entry">
      <h2 className="auth-title">Iniciar Sesión</h2>
      
      {error && (
        <div className="error-badge" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} noValidate> 
        <div className="input-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="Contraseña"
              className="auth-input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-pass"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button className="auth-button" type="submit">
          Entrar
        </button>
      </form>

      <div className="auth-footer">
        <p className="auth-secondary-text">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="auth-link-highlight">
            Registrarme
          </Link>
        </p>
      </div>
    </div>
  );
}