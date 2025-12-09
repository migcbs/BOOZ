// ErrorNotification.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function ErrorNotification({ errors, onClose }) {
  // Solo renderizar si hay errores
  if (Object.keys(errors).length === 0) return null;

  return (
    <div className="error-notification-popup" role="alert" aria-live="assertive">
      <div className="error-notification-header">
        <strong>⚠️ Hay errores en el formulario:</strong>
        <button 
            onClick={onClose} 
            className="close-btn"
            aria-label="Cerrar notificación de errores"
        >
          <FaTimes />
        </button>
      </div>
      <ul className="error-notification-list">
        {Object.entries(errors).map(([key, value]) => (
          <li key={key}>{value}</li>
        ))}
      </ul>
    </div>
  );
}