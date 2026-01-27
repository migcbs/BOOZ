// ModularFlowComponents.jsx - ADECUADO PARA BOOZ + VERCEL + LIQUID GLASS iOS 26
import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaCheckCircle, FaUserTie } from 'react-icons/fa';
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import StripePaymentForm from './StripePaymentForm'; 
// 🟢 IMPORTACIÓN DINÁMICA
import API_BASE_URL from '../../apiConfig'; 

// --------------------------------------------------------------------------
// PASO 1: Elegir Paquete / Clase Muestra
// --------------------------------------------------------------------------
export const Step1PackageSelection = ({ onNext, isWeekend, onClose, date }) => {
    const paquetes = [
        { id: 'paq_L-V', titulo: "Lunes/Miércoles/Viernes", precio: 800, clases: 12 },
        { id: 'paq_Ma-J', titulo: "Martes/Jueves", precio: 550, clases: 8 },
    ];
    const claseMuestraCosto = 95;
    const dateFormatted = format(date, 'EEEE dd MMM', { locale: es });

    return (
        <div className="modal-step-card glass-card animate-ios-entry">
            <h3 className="step-title">1. Elige tu acceso | {dateFormatted}</h3>
            
            <div className="package-options-grid">
                {!isWeekend ? (
                    paquetes.map(p => (
                        <div key={p.id} className="paquete-option-card glass-button-ios" onClick={() => onNext({ selectionType: 'package', data: p, cost: p.precio, dateKey: format(date, 'yyyy-MM-dd') })}>
                            <h4>{p.titulo}</h4>
                            <p className="package-price">${p.precio} MXN</p>
                            <span className="clases-badge">{p.clases} Clases</span>
                        </div>
                    ))
                ) : (
                    <div className="paquete-option-card glass-button-ios highlight-gold" onClick={() => onNext({ selectionType: 'single', data: { nombre: 'Clase Única' }, cost: 250, dateKey: format(date, 'yyyy-MM-dd') })}>
                        <h4>Clase Única Fin de Semana</h4>
                        <p className="package-price">$250 MXN</p>
                    </div>
                )}
            </div>

            <div className="clase-muestra-box liquid-info">
                <FaInfoCircle size={18} className="info-icon" />
                <p>¿PRIMERA VEZ? PRUEBA UNA <strong>CLASE MUESTRA</strong></p>
                <button 
                    className="btn-sample-ios" 
                    onClick={() => onNext({ selectionType: 'sample', data: { nombre: 'Clase Muestra' }, cost: claseMuestraCosto, dateKey: format(date, 'yyyy-MM-dd') })}
                >
                    RESERVAR POR ${claseMuestraCosto}
                </button>
            </div>
            <button className="btn-close-ios" onClick={onClose}>CANCELAR</button>
        </div>
    );
};

// --------------------------------------------------------------------------
// PASO 2: Selección de Horario (TARJETAS VISUALES + GRUPOS)
// --------------------------------------------------------------------------
export const Step2ScheduleSelection = ({ selection, onNext, availability, isWeekend, onClose }) => {
    const [selectedClase, setSelectedClase] = useState(null);
    const [selectedBed, setSelectedBed] = useState(null); 

    const handleConfirm = () => {
        if (!selectedClase) return;
        const needsBed = isWeekend || selection.selectionType === 'single';
        if (needsBed && !selectedBed) return alert("Por favor, selecciona una camilla.");
        
        onNext({ 
            ...selection, 
            hour: selectedClase.hour, 
            nombreClase: selectedClase.nombre, 
            coach: selectedClase.coachName,
            claseId: selectedClase.id,
            bed: needsBed ? selectedBed : null 
        });
    };

    return (
        <div className="modal-step-card glass-card animate-ios-entry">
            <h3 className="step-title">2. Selecciona tu Grupo</h3>
            
            <div className="clases-grid-scroll">
                {availability && availability.length > 0 ? (
                    availability.map((clase) => (
                        <div 
                            key={clase.id}
                            className={`clase-card-item liquid-button ${selectedClase?.id === clase.id ? 'active' : ''}`}
                            style={{ 
                                borderLeft: `5px solid ${clase.color || '#fff'}`,
                                backgroundImage: clase.imageUrl ? `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), url(${clase.imageUrl})` : 'none',
                            }}
                            onClick={() => setSelectedClase(clase)}
                        >
                            <div className="card-header-ios">
                                <span className="time-pill">{clase.hour}</span>
                                {clase.coachName && (
                                    <span className="coach-badge">
                                        <FaUserTie size={10} /> {clase.coachName}
                                    </span>
                                )}
                            </div>
                            <div className="card-body-ios">
                                <h4>{clase.nombre}</h4>
                                <p className="tematica-text" style={{ color: clase.color }}>{clase.tematica}</p>
                            </div>
                            {selectedClase?.id === clase.id && <FaCheckCircle className="selection-check" />}
                        </div>
                    ))
                ) : (
                    <div className="empty-state-ios">No hay clases programadas para este día.</div>
                )}
            </div>
            
            {(isWeekend || selection.selectionType === 'single') && selectedClase && (
                <div className="bed-selection-ios animate-ios-slide">
                    <h4>Camilla disponible:</h4>
                    <div className="beds-ios-grid">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div 
                                key={i} 
                                className={`bed-pill ${selectedBed === i ? 'active' : ''}`}
                                onClick={() => setSelectedBed(i)}
                            >
                                {i}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="popup-actions-ios">
                <button className="btn-confirm-ios" onClick={handleConfirm} disabled={!selectedClase}>
                    {selection.selectionType === 'credit' ? 'Confirmar Reserva' : 'Continuar al Pago'}
                </button>
                <button className="btn-cancel-ios" onClick={onClose}>Volver</button>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------
// PASO 3: Pago
// --------------------------------------------------------------------------
export const Step3Payment = ({ selection, onNext, onClose }) => {
    const isCreditUse = selection.selectionType === 'credit';

    useEffect(() => { if (isCreditUse) onNext(selection); }, [isCreditUse]);

    if (isCreditUse) return null;

    return (
        <div className="modal-step-card glass-card animate-ios-entry">
            <h3 className="step-title">3. Finalizar Pago</h3>
            <div className="payment-preview-ios">
                <div className="preview-row">
                    <span>Concepto:</span>
                    <strong>{selection.nombreClase || "Acceso Booz"}</strong>
                </div>
                <div className="preview-row">
                    <span>Total:</span>
                    <strong className="price-tag">${selection.cost} MXN</strong>
                </div>
            </div>
            <StripePaymentForm
                paquete={{ titulo: selection.nombreClase, precio: selection.cost }}
                onSuccess={(id) => onNext({ ...selection, stripeId: id })}
                onError={(err) => alert(err)}
            />
            <button className="btn-close-ios" onClick={onClose}>Cancelar Pago</button>
        </div>
    );
};

// --------------------------------------------------------------------------
// PASO 4: Confirmación
// --------------------------------------------------------------------------
export const Step4Confirmation = ({ selection, onClose, updateCredits }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const confirmReserva = async () => {
            const storedUserRaw = localStorage.getItem("user");
            if (!storedUserRaw) return setError("Sesión expirada. Por favor, reingresa.");
            
            const stored = JSON.parse(storedUserRaw);
            const email = stored.email || stored.correo; // 🟢 Doble validación de propiedad email
            
            if (!email) return setError("Usuario no identificado.");

            try {
                // 🟢 ADECUACIÓN PARA VERCEL
                const response = await fetch(`${API_BASE_URL}/reservas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, selection }),
                });

                if (response.ok) {
                    if (selection.selectionType === 'credit') updateCredits();
                    setLoading(false);
                } else {
                    const data = await response.json();
                    setError(data.message || "Error al procesar la reserva.");
                }
            } catch (err) {
                console.error(err);
                setError("Error de red. Revisa tu conexión.");
            }
        };
        confirmReserva();
    }, []);

    if (error) return (
        <div className="modal-step-card glass-card error-ios">
            <h3 style={{color: '#ff4b4b'}}>Lo sentimos</h3>
            <p>{error}</p>
            <button className="btn-confirm-ios" onClick={onClose}>Cerrar</button>
        </div>
    );

    if (loading) return (
        <div className="modal-step-card glass-card loading-ios">
            <div className="ios-spinner-ring"></div>
            <h3>Sincronizando con Booz Studio...</h3>
        </div>
    );

    return (
        <div className="modal-step-card glass-card success-ios animate-ios-entry">
            <FaCheckCircle size={60} color="#34c759" className="success-icon-bounce" />
            <h2 className="step-title">¡Todo listo!</h2>
            <div className="success-receipt">
                <p><strong>Grupo:</strong> {selection.nombreClase}</p>
                <p><strong>Coach:</strong> {selection.coach || 'Staff Booz'}</p>
                <p><strong>Horario:</strong> {selection.hour}</p>
                {selection.bed && <p><strong>Camilla:</strong> #{selection.bed}</p>}
            </div>
            <button className="btn-confirm-ios" onClick={onClose}>Volver al inicio</button>
        </div>
    );
};