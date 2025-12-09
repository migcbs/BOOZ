// StripePaymentForm.jsx

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Estilos de la tarjeta para que se vea moderno
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#fff", // Color del texto de la tarjeta
      fontFamily: 'Roboto, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#ccc',
      },
    },
    invalid: {
      color: '#ffcdd2',
    },
  },
};

const StripePaymentForm = ({ paquete, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  // 🟢 ESTADOS PARA LOS CAMPOS ADICIONALES
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({
    line1: '',
    city: '',
    postal_code: '',
    country: 'MX', // Asume México, para el contexto
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || loading) {
        setError("El sistema de pago no está cargado correctamente.");
        return;
    }

    setLoading(true);
    setError(null);

    // Validación básica de campos requeridos
    if (!name || !email || !address.postal_code) {
        setError("Por favor, completa Nombre, Email y Código Postal.");
        setLoading(false);
        return;
    }

    try {
        // 1. LLAMADA AL BACKEND PARA CREAR PAYMENT INTENT
        // En una aplicación real, aquí harías un fetch para obtener el clientSecret
        // const response = await fetch('/api/create-payment-intent', { ... });
        // const { clientSecret } = await response.json();
        const clientSecret = "SIMULADO_CLIENT_SECRET_DEL_BACKEND"; // ⚠️ DEBE VENIR DEL BACKEND

        // 2. CONFIRMAR PAGO EN EL LADO DEL CLIENTE
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement), 
            // 🟢 AGREGAMOS TODOS LOS DATOS DE FACTURACIÓN
            billing_details: {
              name: name,
              email: email,
              address: {
                // Solo Código Postal y País son vitales para Stripe en muchos casos
                postal_code: address.postal_code, 
                country: address.country, 
              },
            },
          },
        });

        if (result.error) {
          setError(result.error.message);
          onError(result.error.message);
        } else if (result.paymentIntent.status === 'succeeded') {
          // 3. Éxito
          onSuccess(result.paymentIntent.id); 
        } else {
            setError("El pago no fue exitoso. Estado: " + result.paymentIntent.status);
            onError("El pago no fue exitoso.");
        }
    } catch (err) {
        setError("Error de comunicación con el servidor. Intenta de nuevo.");
        onError("Error de comunicación con el servidor.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h4 className="payment-cost-header">Monto: ${paquete.precio} MXN</h4>
      
      {/* 🟢 CAMPO: NOMBRE COMPLETO */}
      <input
        type="text"
        placeholder="Nombre en la tarjeta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="input-field"
      />

      {/* 🟢 CAMPO: CORREO ELECTRÓNICO */}
      <input
        type="email"
        placeholder="Correo Electrónico (Recibo)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="input-field"
      />
      
      {/* 🟢 CAMPOS DE DIRECCIÓN BÁSICOS */}
      <div className="address-fields">
        <input
          type="text"
          placeholder="Código Postal"
          value={address.postal_code}
          onChange={(e) => setAddress({...address, postal_code: e.target.value})}
          required
          className="input-field half-field"
        />
        <input
          type="text"
          placeholder="País (Ej: MX)"
          value={address.country}
          onChange={(e) => setAddress({...address, country: e.target.value.toUpperCase()})}
          required
          className="input-field half-field"
        />
      </div>
      
      <label className="card-element-label">Datos de la Tarjeta</label>
      <div className="card-element-wrapper">
        <CardElement options={CARD_ELEMENT_OPTIONS} /> 
      </div>
      
      {error && <p className="error-message">{error}</p>}

      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="btn-confirmar" 
        style={{ marginTop: '15px' }}
      >
        {loading ? 'Procesando...' : `Pagar $${paquete.precio} MXN`}
      </button>
    </form>
  );
};

export default StripePaymentForm;