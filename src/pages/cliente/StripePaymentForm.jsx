import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaLock, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import authFetch from '../../authFetch';
import './StripePaymentForm.css';

// Estilos del CardElement homologados a Booz
const CARD_STYLE = {
    style: {
        base: {
            color: '#1d1d1f',
            fontFamily: '"Nunito", sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            '::placeholder': { color: '#c7c7cc', fontWeight: '500' },
        },
        invalid: { color: '#FC7358' },
    },
};

export default function StripePaymentForm({ monto, onSuccess, onClose }) {
    const stripe   = useStripe();
    const elements = useElements();

    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [succeeded, setSucceeded] = useState(false);
    const [cardReady, setCardReady] = useState(false);

    // El email viene del usuario autenticado
    const userEmail = (() => {
        try { return JSON.parse(localStorage.getItem('booz_user'))?.email || ''; }
        catch { return ''; }
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || loading) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Pedir el clientSecret al backend
            const res = await authFetch('/create-payment-intent', {
                method: 'POST',
                body: JSON.stringify({ monto, email: userEmail })
            });

            if (!res?.ok) {
                const d = await res?.json();
                throw new Error(d?.error || 'Error al crear el pago');
            }

            const { clientSecret } = await res.json();

            // 2. Confirmar el pago con Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        email: userEmail,
                    },
                },
            });

            if (result.error) {
                setError(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                setSucceeded(true);
                // Dar tiempo para que el webhook procese y luego notificar éxito
                setTimeout(() => {
                    onSuccess(result.paymentIntent.id, monto);
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Estado de éxito
    if (succeeded) return (
        <div className="spf-success">
            <div className="spf-success-icon">
                <FaCheckCircle />
            </div>
            <h3>¡Pago exitoso!</h3>
            <p>Se acreditaron <strong>${monto} créditos</strong> a tu billetera.</p>
            <p className="spf-success-sub">Actualizando tu saldo...</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="spf-form">

            {/* Resumen */}
            <div className="spf-summary">
                <div className="spf-summary-row">
                    <span>Recarga de créditos</span>
                    <span className="spf-summary-monto">${monto} MXN</span>
                </div>
                <div className="spf-summary-row spf-summary-equal">
                    <span>Créditos a recibir</span>
                    <span className="spf-credits-badge">{monto} créditos</span>
                </div>
                <p className="spf-rate-note">1 crédito = $1 MXN · Se aplican de inmediato</p>
            </div>

            {/* Card Element */}
            <div className="spf-field">
                <label className="spf-label">
                    <FaCreditCard size={11} /> Datos de la tarjeta
                </label>
                <div className={`spf-card-wrapper ${cardReady ? 'ready' : ''}`}>
                    <CardElement
                        options={CARD_STYLE}
                        onChange={e => {
                            setCardReady(e.complete);
                            if (e.error) setError(e.error.message);
                            else setError(null);
                        }}
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="spf-error">
                    <span>⚠</span> {error}
                </div>
            )}

            {/* Seguridad */}
            <div className="spf-secure">
                <FaLock size={10} />
                <span>Pago seguro procesado por Stripe · Booz nunca almacena datos de tu tarjeta</span>
            </div>

            {/* Botones */}
            <div className="spf-actions">
                <button type="button" className="spf-btn-cancel" onClick={onClose}>
                    Cancelar
                </button>
                <button
                    type="submit"
                    className={`spf-btn-pay ${cardReady && !loading ? 'ready' : ''}`}
                    disabled={!stripe || !cardReady || loading}
                >
                    {loading ? (
                        <span className="spf-spinner" />
                    ) : (
                        <>
                            <FaLock size={12} />
                            Pagar ${monto} MXN
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}