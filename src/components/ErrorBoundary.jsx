import React from "react";

// Evita que un error de render en una sola página tumbe toda la app
// (incluyendo el Navbar, que vive en el mismo árbol de React pero fuera de <Routes>).
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturó un error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            minHeight: "60vh",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h2 style={{ color: "#1d1d1f" }}>Algo salió mal</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Ocurrió un error inesperado al cargar esta página.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: "#8FD9FB",
              color: "#1d1d1f",
              border: "none",
              borderRadius: 50,
              padding: "10px 24px",
              fontWeight: 800,
              fontSize: "0.8rem",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
