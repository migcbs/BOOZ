import React, { useState } from 'react';
import { FaCreditCard, FaTimes, FaDollarSign, FaLock, FaUser, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import './Styles.css';

export default function Tienda({ isModal, onClose, userEmail }) {
    const [monto, setMonto] = useState('');
    const [cardData, setCardData] = useState({
        titular: '',
        numero: '',
        expiracion: '',
        cvv: ''
    });

    // Si no es modal, no renderizamos nada para evitar que se vea en el perfil
    if (!isModal) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCardData({ ...cardData, [name]: value });
    };

    const handleProceedToPay = (e) => {
        e.preventDefault();
        if (!monto || monto < 50) return alert("El monto mínimo de recarga es $50 MXN");
        alert(`Validando tarjeta de ${cardData.titular} por $${monto} MXN...`);
        // Aquí iría la lógica de Stripe
    };

    return (
        <div className="popup-overlay">
            <div className="popup-card glass-card tienda-modal-container">
                <button className="btn-close-modal" onClick={onClose}><FaTimes /></button>
                
                <div className="checkout-header">
                    <h2 className="card-title-accent">Recargar Billetera Booz</h2>
                    <p className="popup-subtitle">Ingresa el monto y los datos de tu tarjeta</p>
                </div>

                <form onSubmit={handleProceedToPay} className="checkout-form">
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
                            />
                        </div>
                    </div>

                    <div className="input-group-booz">
                        <label className="card-subtitle-small">NOMBRE DEL TITULAR</label>
                        <div className="inner-input">
                            <FaUser />
                            <input 
                                type="text" 
                                name="titular"
                                placeholder="Nombre completo"
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group-booz">
                        <label className="card-subtitle-small">NÚMERO DE TARJETA</label>
                        <div className="inner-input">
                            <FaCreditCard />
                            <input 
                                type="text" 
                                name="numero"
                                placeholder="0000 0000 0000 0000"
                                maxLength="16"
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-row-flex">
                        <div className="input-group-booz">
                            <label className="card-subtitle-small">EXPIRACIÓN</label>
                            <div className="inner-input">
                                <FaCalendarAlt />
                                <input type="text" name="expiracion" placeholder="MM/YY" maxLength="5" onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="input-group-booz">
                            <label className="card-subtitle-small">CVV</label>
                            <div className="inner-input">
                                <FaShieldAlt />
                                <input type="password" name="cvv" placeholder="000" maxLength="3" onChange={handleInputChange} required />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-confirmar-pago">
                        PAGAR ${monto || '0.00'} MXN <FaLock style={{marginLeft: '10px'}}/>
                    </button>
                    
                    <div className="secure-footer">
                        <p className="secure-text">🔒 Pago encriptado y seguro vía Stripe</p>
                    </div>
                </form>
            </div>
        </div>
    );
}