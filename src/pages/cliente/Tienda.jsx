import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { FaTimes, FaWallet, FaBolt } from 'react-icons/fa';
import StripePaymentForm from './StripePaymentForm';
import authFetch from '../../authFetch';
import Swal from 'sweetalert2';
import './Tienda.css';

// Carga Stripe una sola vez con tu clave pública
const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
    ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
    : null;

// Montos predefinidos de recarga rápida
const MONTOS_RAPIDOS = [100, 200, 500, 1000];

export default function Tienda({ isModal, onClose, onCreditosActualizados }) {
    const [montoSeleccionado, setMontoSeleccionado] = useState(null);
    const [montoCustom,       setMontoCustom]       = useState('');
    const [showForm,          setShowForm]          = useState(false);
    const [loadingRefresh,    setLoadingRefresh]    = useState(false);

    const montoFinal = montoSeleccionado || parseInt(montoCustom) || 0;

    const handleMontoRapido = (m) => {
        setMontoSeleccionado(m);
        setMontoCustom('');
    };

    const handleCustom = (v) => {
        setMontoCustom(v);
        setMontoSeleccionado(null);
    };

    const handleContinuar = () => {
        if (montoFinal < 10) {
            Swal.fire('Aviso', 'El monto mínimo de recarga es $10 MXN', 'info');
            return;
        }
        setShowForm(true);
    };

    const handleSuccess = async (paymentIntentId, monto) => {
        // Esperar a que el webhook procese (normalmente < 2s)
        setLoadingRefresh(true);
        await new Promise(r => setTimeout(r, 2000));

        // Refrescar los créditos del usuario desde la API
        try {
            const res  = await authFetch('/me');
            const data = await res.json();
            if (data?.creditosDisponibles !== undefined) {
                // Actualizar localStorage con los nuevos créditos
                const stored = JSON.parse(localStorage.getItem('booz_user') || '{}');
                localStorage.setItem('booz_user', JSON.stringify({
                    ...stored,
                    creditosDisponibles: data.creditosDisponibles
                }));
                if (onCreditosActualizados) onCreditosActualizados(data.creditosDisponibles);
            }
        } catch (e) { console.error('Error al refrescar créditos:', e); }

        setLoadingRefresh(false);

        Swal.fire({
            icon: 'success',
            title: '¡Recarga exitosa!',
            html: `<p>Se acreditaron <b style="color:#8FD9FB">${monto} créditos</b> a tu billetera Booz.</p>`,
            confirmButtonColor: '#8FD9FB',
            confirmButtonText: 'Perfecto'
        }).then(() => onClose());
    };

    const content = (
        <div className="tienda-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="tienda-modal">

                {/* Header */}
                <div className="tienda-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaWallet color="#8FD9FB" size={18} />
                        <h2 className="tienda-title">Recargar billetera</h2>
                    </div>
                    <button className="tienda-close" onClick={onClose}><FaTimes /></button>
                </div>

                {!showForm ? (
                    /* ── Selector de monto ── */
                    <div className="tienda-body">
                        <p className="tienda-subtitle">
                            Elige cuánto quieres recargar. Cada peso = 1 crédito.
                        </p>

                        {/* Montos rápidos */}
                        <div className="tienda-montos-grid">
                            {MONTOS_RAPIDOS.map(m => (
                                <button
                                    key={m}
                                    className={`tienda-monto-btn ${montoSeleccionado === m ? 'active' : ''}`}
                                    onClick={() => handleMontoRapido(m)}
                                >
                                    {m === 500 && <span className="tienda-popular-badge"><FaBolt size={9} /> Popular</span>}
                                    <span className="tienda-monto-valor">${m}</span>
                                    <span className="tienda-monto-sub">{m} créditos</span>
                                </button>
                            ))}
                        </div>

                        {/* Monto personalizado */}
                        <div className="tienda-custom">
                            <label className="tienda-label">Otro monto (mín. $10)</label>
                            <div className="tienda-custom-input-wrapper">
                                <span className="tienda-peso-sign">$</span>
                                <input
                                    type="number"
                                    min="10"
                                    max="50000"
                                    placeholder="0"
                                    value={montoCustom}
                                    onChange={e => handleCustom(e.target.value)}
                                    className="tienda-custom-input"
                                />
                                <span className="tienda-mxn-label">MXN</span>
                            </div>
                        </div>

                        {/* Resumen */}
                        {montoFinal >= 10 && (
                            <div className="tienda-resumen">
                                <span>Vas a recargar</span>
                                <span className="tienda-resumen-monto">{montoFinal} créditos por ${montoFinal} MXN</span>
                            </div>
                        )}

                        <button
                            className={`tienda-btn-continuar ${montoFinal >= 10 ? 'active' : ''}`}
                            disabled={montoFinal < 10}
                            onClick={handleContinuar}
                        >
                            Continuar al pago →
                        </button>
                    </div>
                ) : (
                    /* ── Formulario de pago ── */
                    <div className="tienda-body">
                        <button
                            className="tienda-back-btn"
                            onClick={() => setShowForm(false)}
                        >
                            ← Cambiar monto
                        </button>
                        <Elements stripe={stripePromise}>
                            <StripePaymentForm
                                monto={montoFinal}
                                onSuccess={handleSuccess}
                                onClose={onClose}
                            />
                        </Elements>
                    </div>
                )}

                {loadingRefresh && (
                    <div className="tienda-loading-overlay">
                        <div className="tienda-spinner" />
                        <p>Confirmando tu recarga...</p>
                    </div>
                )}
            </div>
        </div>
    );

    return isModal ? ReactDOM.createPortal(content, document.body) : content;
}