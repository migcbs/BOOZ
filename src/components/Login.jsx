// Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// Importar iconos sutiles para la contraseña
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Styles.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Efecto para asegurar que el usuario demo exista, se ejecuta solo una vez al montar.
  useEffect(() => {
    const ensureDemoUser = () => {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const exists = users.find((u) => u.correo === "demo@demo.com");
      
      if (!exists) {
        users.push({
          nombre: "Demo",
          apellido: "User",
          correo: "demo@demo.com",
          password: "Demo123!",
          // 👇 CAMPOS OMITIDOS RESTAURADOS AQUÍ 👇
          telefono: "5512345678", 
          fechaNacimiento: "1990-01-01", 
          contactoEmergencia: "Emergencia 5598765432",
          responsivaFirmada: true,
          enfermedades: "Ninguna",
          condicion: "ninguna", 
          condicionOtro: "",
          lesiones: "Ninguna",
          // 👆 CAMPOS OMITIDOS RESTAURADOS AQUÍ 👆
          role: "cliente",
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("users", JSON.stringify(users));
      }
    };
    ensureDemoUser();
  }, []); // El array vacío asegura que se ejecute solo en el montaje.


  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find((u) => u.correo === email.toLowerCase());

    if (found) {
      if (found.password !== pass) {
        // Añadir una pausa mínima (UX) para evitar ataques de fuerza bruta rápidos
        setTimeout(() => {
          setError("Contraseña incorrecta. Inténtalo de nuevo.");
        }, 300);
        return;
      }

      const sessionUser = {
        nombre: found.nombre,
        apellido: found.apellido,
        correo: found.correo,
        role: found.role || "cliente", // Fallback seguro
      };

      localStorage.setItem("user", JSON.stringify(sessionUser));

      // Lógica de redirección más robusta y legible
      const baseRoute = 
        sessionUser.role === "admin"
          ? "/admin/dashboard"
          : sessionUser.role === "coach"
          ? "/coach/clientes"
          : "/cliente/inicio";

      navigate(baseRoute);
      return;
    }

    setTimeout(() => {
        setError("Usuario no encontrado. Regístrate o revisa tus datos.");
    }, 300);
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Iniciar Sesión</h2>

      {/* A11y: aria-live="assertive" asegura que los lectores de pantalla lean el error inmediatamente */}
      {error && <div className="error" role="alert" aria-live="assertive">{error}</div>}

      <form onSubmit={handleLogin} noValidate> {/* Añadido noValidate para controlar la validación con JS */}
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          placeholder="tu@correo.com"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email" // Sugerencia de autocompletado
        />

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
            autoComplete="current-password" // Sugerencia de autocompletado
          />
          <button
            type="button"
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="toggle-pass"
            onClick={() => setShowPass((s) => !s)}
          >
            {/* Reemplazo de Emojis por Iconos */}
            {showPass ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button className="auth-button" type="submit">
          Entrar
        </button>
      </form>

      <p className="auth-secondary-text">
        ¿No tienes cuenta?
        {/* UX: Reemplazamos <button> anidado con un Link con clase de botón */}
        <Link 
          to="/register" 
          className="auth-secondary-btn" 
          style={{ width: "auto", marginLeft: "10px", display: "inline-block" }}
        >
          Registrarme
        </Link>
      </p>
    </div>
  );
}