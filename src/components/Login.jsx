import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import API_BASE_URL from '../apiConfig';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !pass.trim()) {
      setError("Por favor, ingresa correo y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: pass,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { user, token } = data;

        // ✅ CORRECCIÓN: Guardar el token JWT además del usuario
        // El token es lo que el backend verifica en cada llamada protegida
        localStorage.setItem("booz_token", token);
        localStorage.setItem("booz_user", JSON.stringify({
          id:                  user.id,
          nombre:              user.nombre,
          apellido:            user.apellido,
          email:               user.email,
          role:                user.role || "cliente",
          creditosDisponibles: user.creditosDisponibles,
          tipoCliente:         user.tipoCliente,
          suscripcionActiva:   user.suscripcionActiva,
          planNombre:          user.planNombre,
        }));

        // Redirección por rol
        if (user.role === "admin")        navigate("/admin/dashboard");
        else if (user.role === "coach")   navigate("/coach/home");
        else                              navigate("/cliente/inicio");

      } else {
        setError(data.message || "Credenciales inválidas.");
      }

    } catch (err) {
      console.error("Error en login:", err);
      setError("Error de conexión con el servidor Booz.");
    } finally {
      setLoading(false);
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

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
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