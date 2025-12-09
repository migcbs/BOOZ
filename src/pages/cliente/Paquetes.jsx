// Paquetes.jsx
import React, { useState } from "react";
// Importaciones necesarias para Stripe
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import "./Styles.css"; 

// ====================================================================
// CONFIGURACIÓN DE PAGO (¡REEMPLAZA ESTO!)
// ====================================================================

// Carga la clave pública de Stripe (¡REEMPLAZA CON TU CLAVE REAL!)
const stripePromise = loadStripe('pk_test_TU_CLAVE_PUBLICA_DE_STRIPE_AQUI'); 

// Estilos para el campo de la tarjeta Stripe
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#fff",
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

// ====================================================================
// COMPONENTES MODALES
// ====================================================================

/**
 * 💳 Modal de Pago con todos los campos de facturación necesarios.
 */
const StripePaymentForm = ({ paquete, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  // 🟢 ESTADOS PARA LOS CAMPOS ADICIONALES
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({
    line1: '',
    city: '',
    postal_code: '',
    country: 'MX', // Asume México, pero se puede hacer un selector
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

    // Validación básica
    if (!name || !email || !address.postal_code) {
        setError("Por favor, completa todos los campos de facturación.");
        setLoading(false);
        return;
    }

    try {
        // En una aplicación real, aquí harías una llamada a tu servidor (backend)
        // para crear un PaymentIntent de Stripe y obtener el 'clientSecret'.
        // Aquí lo simulamos:
        console.log("Simulando creación de PaymentIntent en el Backend...");
        const clientSecret = "SIMULADO_CLIENT_SECRET_DEL_BACKEND"; 

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            // Captura los datos de la tarjeta desde el CardElement
            card: elements.getElement(CardElement), 
            // 🟢 AGREGAMOS TODOS LOS DATOS DE FACTURACIÓN
            billing_details: {
              name: name,
              email: email,
              address: {
                line1: address.line1,
                city: address.city,
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
          onSuccess(result.paymentIntent.id); 
        } else {
            setError("El pago no fue exitoso. Estado: " + result.paymentIntent.status);
        }
    } catch (err) {
        setError("Error de comunicación con el servidor. Intenta de nuevo.");
        onError("Error de comunicación con el servidor.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="modal-card glass-card">
        <h3>Pago Seguro: {paquete.titulo} (${paquete.precio} MXN)</h3>
        <p className="modal-subtitle">Necesitamos tu información para el recibo.</p>
        
        <form onSubmit={handleSubmit} className="payment-form">
          
          {/* 🟢 CAMPO: NOMBRE DEL TARJETAHABIENTE */}
          <input
            type="text"
            placeholder="Nombre completo en la tarjeta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
          />

          {/* 🟢 CAMPO: CORREO ELECTRÓNICO */}
          <input
            type="email"
            placeholder="Correo Electrónico (Para tu recibo)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          
          {/* 🟢 CAMPOS DE DIRECCIÓN: Código Postal y País son vitales */}
          <div className="address-fields">
            <input
              type="text"
              placeholder="Código Postal"
              value={address.postal_code}
              onChange={(e) => setAddress({...address, postal_code: e.target.value})}
              required
              className="input-field half-field"
            />
            {/* Normalmente el País es un selector en un entorno de producción */}
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
            {/* Campo de tarjeta inyectado por Stripe */}
            <CardElement options={CARD_ELEMENT_OPTIONS} /> 
          </div>
          
          {error && <p className="error-message">{error}</p>}

          <div className="modal-actions">
            <button 
              type="submit" 
              disabled={!stripe || loading}
              className="btn-confirmar" 
            >
              {loading ? 'Procesando...' : `Pagar $${paquete.precio} MXN`}
            </button>
            <button type="button" onClick={onClose} className="btn-cerrar">
                Cancelar
            </button>
          </div>
        </form>
        <p className="stripe-disclaimer">Pagos procesados de forma segura por Stripe.</p>
    </div>
  );
};

/**
 * 📅 Modal de Reserva/Calendario (Se abre tras un pago exitoso)
 */
const ReservationScheduler = ({ paquete, onClose }) => (
    <div className="modal-card success-card">
        <h2>🎉 ¡Pago Exitoso!</h2>
        <h3 className="modal-subtitle">Has adquirido {paquete.clases} créditos.</h3>
        
        <p>Ahora puedes usar tus créditos para **elegir tus horarios** en el calendario de reservas.</p>
        
        <button onClick={onClose} className="btn-confirmar" style={{ marginTop: '20px' }}>
            Ir a Reservar Horarios
        </button>
    </div>
);


// ====================================================================
// COMPONENTE PRINCIPAL: Paquetes
// ====================================================================

export default function Paquetes() {
  const paquetes = [
    { titulo: "5 Clases", precio: 300, clases: 5 },
    { titulo: "10 Clases", precio: 550, clases: 10 },
    { titulo: "20 Clases", precio: 1000, clases: 20 },
  ];
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalStage, setModalStage] = useState(null); // 'payment', 'reservation'
  
  const handlePurchase = (paquete) => {
    setSelectedPackage(paquete);
    setModalStage('payment');
  };

  const handlePaymentSuccess = (paymentId) => {
    console.log(`Pago ${paymentId} exitoso. Créditos asignados: ${selectedPackage.clases}`);
    setModalStage('reservation'); 
  };
  
  const handleCloseModal = () => {
    setSelectedPackage(null);
    setModalStage(null);
  };


  return (
    <div className="paquetes-container">
      <h2>Paquetes disponibles</h2>

      <div className="paquetes-grid">
        {paquetes.map((p) => (
          <div key={p.titulo} className="paquete-card">
            <h3>{p.titulo}</h3>
            <p className="clases-count">{p.clases} Clases</p>
            <p className="precio">${p.precio} MXN</p>
            <button 
              className="btn-comprar"
              onClick={() => handlePurchase(p)}
            >
                Comprar
            </button>
          </div>
        ))}
      </div>
      
      {/* ------------------------------------------- */}
      {/* 🟢 VENTANA FLOTANTE (POP-UP) */}
      {/* ------------------------------------------- */}
      
      {(modalStage === 'payment' || modalStage === 'reservation') && selectedPackage && (
        <div className="modal-overlay">
            {modalStage === 'payment' && (
                // 💡 El formulario debe estar envuelto en <Elements>
                <Elements stripe={stripePromise}>
                    <StripePaymentForm 
                        paquete={selectedPackage}
                        onSuccess={handlePaymentSuccess} 
                        onError={(msg) => console.error(msg)}
                        onClose={handleCloseModal}
                    />
                </Elements>
            )}
            
            {modalStage === 'reservation' && (
                <ReservationScheduler
                    paquete={selectedPackage}
                    onClose={handleCloseModal}
                />
            )}
        </div>
      )}
    </div>
  );
}