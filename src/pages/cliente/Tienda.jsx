import React, { useState, useEffect } from 'react';
import { 
    FaTimes, FaDollarSign, FaLock, FaUser, 
    FaCreditCard, FaCalendarAlt, FaShieldAlt, 
    FaCheckCircle, FaExclamationTriangle 
} from 'react-icons/fa';
import { 
    CardNumberElement, 
    CardExpiryElement, 
    CardCvcElement, 
    useStripe, 
    useElements 
} from '@stripe/react-stripe-js';
import './Styles.css';

export default function Tienda({ isModal, onClose, userEmail }) {
    const stripe = useStripe();
    const elements = useElements();
    
    // Estados de Formulario
    const [monto, setMonto] = useState('');
    const [titular, setTitular] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estados de Feedback Visual
    const [status, setStatus] = useState('idle'); // idle | processing | success | error
    const [errorMessage, setErrorMessage] = useState('');

    // Limpiar estados al cerrar o abrir modal
    useEffect(() => {
        if (!isModal) {
            setStatus('idle');
            setMonto('');
            setTitular('');
            setErrorMessage('');
        }
    }, [isModal]);

    if (!isModal) return null;

    // Configuración estética de los campos de Stripe
    const elementStyles = {
        style: {
            base: {
                color: "#8FD9FB", // Azul Booz
                fontFamily: '"Orbitron", sans-serif', // O la fuente que uses en tu CSS
                fontSize: '16px',
                fontSmoothing: "antialiased",
                "::placeholder": {
                    color: "rgba(143, 217, 251, 0.4)",
                },
                iconColor: "#8FD9FB",
            },
            invalid: {
                color: "#ff4d4d",
                iconColor: "#ff4d4d",
            }
        }
    };

    const handleProceedToPay = async (e) => {
        e.preventDefault();
        
        if (!stripe || !elements) return;

        // Validaciones preventivas
        if (!monto || parseFloat(monto) < 50) {
            setErrorMessage("El monto mínimo de recarga es $50.00 MXN");
            setStatus('error');
            return;
        }

        setLoading(true);
        setStatus('processing');
        setErrorMessage('');

        try {
            // 1. Llamada al Backend para obtener el Client Secret
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    monto: parseFloat(monto), 
                    email: userEmail 
                })
            });

            if (!response.ok) throw new Error("Error al conectar con el servidor de pagos.");
            
            const { clientSecret } = await response.json();

            // 2. Confirmación del pago con Stripe Elements
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardNumberElement),
                    billing_details: {
                        name: titular,
                        email: userEmail,
                    }
                }
            });

            if (result.error) {
                setErrorMessage(result.error.message);
                setStatus('error');
            } else if (result.paymentIntent.status === 'succeeded') {
                setStatus('success');
                // Auto-cierre después de mostrar el éxito por 3 segundos
                setTimeout(() => {
                    onClose();
                }, 3000);
            }
        } catch (err) {
            console.error("Payment Error:", err);
            setErrorMessage("Hubo un problema técnico. Intenta más tarde.");
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    // Renderizado del estado de ÉXITO
    if (status === 'success') {
        return (
            <div className="popup-overlay">
                <div className="popup-card glass-card tienda-modal-container success-state">
                    <FaCheckCircle className="success-icon-anim" />
                    <h2 className="card-title-accent">¡Pago Confirmado!</h2>
                    <p className="popup-subtitle">Tus créditos se han actualizado correctamente.</p>
                    <p className="success-amount-text">${monto} MXN agregados</p>
                    <button className="btn-confirmar-pago" onClick={onClose}>Listo</button>
                </div>
            </div>
        );
    }

    return (
        <div className="popup-overlay">
            <div className="popup-card glass-card tienda-modal-container">
                <button className="btn-close-modal" onClick={onClose} disabled={loading}>
                    <FaTimes />
                </button>
                
                <div className="checkout-header">
                    <h2 className="card-title-accent">Billetera Booz</h2>
                    <p className="popup-subtitle">Recarga créditos para tus próximas clases</p>
                </div>

                <form onSubmit={handleProceedToPay} className="checkout-form">
                    {/* MONTO CON DISPLAY DINÁMICO */}
                    <div className="amount-section">
                        <label className="card-subtitle-small">MONTO A RECARGAR (MXN)</label>
                        <div className="amount-input-wrapper">
                            <FaDollarSign className="input-icon" />
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="input-amount-large"
                                required
                                min="50"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* TITULAR */}
                    <div className="input-group-booz">
                        <label className="card-subtitle-small">NOMBRE DEL TITULAR</label>
                        <div className="inner-input">
                            <FaUser />
                            <input 
                                type="text" 
                                placeholder="Nombre como aparece en tarjeta"
                                value={titular}
                                onChange={(e) => setTitular(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* TARJETA (Número) */}
                    <div className="input-group-booz">
                        <label className="card-subtitle-small">NÚMERO DE TARJETA</label>
                        <div className="inner-input">
                            <FaCreditCard />
                            <div className="stripe-element-container">
                                <CardNumberElement options={elementStyles} />
                            </div>
                        </div>
                    </div>

                    <div className="input-row-flex">
                        {/* FECHA */}
                        <div className="input-group-booz">
                            <label className="card-subtitle-small">EXPIRACIÓN</label>
                            <div className="inner-input">
                                <FaCalendarAlt />
                                <div className="stripe-element-container">
                                    <CardExpiryElement options={elementStyles} />
                                </div>
                            </div>
                        </div>
                        {/* CVV */}
                        <div className="input-group-booz">
                            <label className="card-subtitle-small">CVV</label>
                            <div className="inner-input">
                                <FaShieldAlt />
                                <div className="stripe-element-container">
                                    <CardCvcElement options={elementStyles} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MENSAJE DE ERROR DINÁMICO */}
                    {status === 'error' && (
                        <div className="error-banner">
                            <FaExclamationTriangle />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className={`btn-confirmar-pago ${loading ? 'loading' : ''}`} 
                        disabled={loading || !stripe}
                    >
                        {loading ? (
                            <div className="spinner-booz"></div>
                        ) : (
                            <>PAGAR ${monto || '0.00'} MXN <FaLock style={{marginLeft: '10px'}}/></>
                        )}
                    </button>
                    
                    <div className="secure-footer">
                        <p className="secure-text">
                            💳 Transacción protegida por cifrado de 256 bits
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}