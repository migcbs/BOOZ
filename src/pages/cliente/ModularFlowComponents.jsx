// ModularFlowComponents.jsx (NUEVO ARCHIVO - Contiene los 4 pasos del modal de compra/reserva)

import React, { useState, useEffect } from 'react';
// 🟢 Importaciones consolidadas: FaCreditCard ya está aquí.
import { FaInfoCircle, FaCalendarAlt, FaCreditCard, FaCheckCircle, FaWhatsapp } from 'react-icons/fa';
import { format } from "date-fns";
import { es } from 'date-fns/locale';

// 🟢 Importación del componente de formulario de pago
import StripePaymentForm from './StripePaymentForm'; 


// --------------------------------------------------------------------------
// PASO 1: Elegir Paquete / Clase Muestra
// --------------------------------------------------------------------------
export const Step1PackageSelection = ({ onNext, isWeekend, onClose, date }) => {
    
    const paquetes = [
        { id: 'paq_L-V', titulo: "Lunes/Miércoles/Viernes", precio: 800, clases: 12 },
        { id: 'paq_Ma-J', titulo: "Martes/Jueves", precio: 550, clases: 8 },
    ];
    const claseMuestraCosto = 150;
    const dateFormatted = format(date, 'EEEE dd MMM', { locale: es });

    return (
        <div className="modal-step-card glass-card">
            <h3 className="step-title">1. Elije - {dateFormatted}</h3>
            <p className="modal-subtitle">
                {isWeekend 
                    ? "Elige reservar una clase única (pago) o la clase muestra."
                    : "Acceso entre semana: Compra un paquete o la Clase Muestra."
                }
            </p>

            {/* OPCIONES DE PAQUETES (Entre semana) */}
            {!isWeekend && (
                <div className="package-options-grid">
                    {paquetes.map(p => (
                        <div key={p.id} className="paquete-option-card" onClick={() => onNext({ selectionType: 'package', data: p, cost: p.precio, dateKey: format(date, 'yyyy-MM-dd') })}>
                            <h4>{p.titulo}</h4>
                            <p className="package-price">${p.precio} MXN ({p.clases} Clases)</p>
                            <button className="btn-select-package">Comprar Paquete</button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* OPCIÓN DE CLASE ÚNICA (Fin de semana) */}
            {isWeekend && (
                 <div className="paquete-option-card" onClick={() => onNext({ selectionType: 'single', data: { nombre: 'Clase Única' }, cost: 250, dateKey: format(date, 'yyyy-MM-dd') })}>
                    <h4>Clase Única Fin de Semana</h4>
                    <p className="package-price">Costo: $250 MXN. Elige tu camilla.</p>
                    <button className="btn-select-package">Reservar Clase Única</button>
                </div>
            )}

            <hr className="divider-line" />
            
            {/* OPCIÓN CLASE MUESTRA (Gancho agresivo) */}
            <div className="clase-muestra-box">
                <FaInfoCircle size={20} style={{ color: '#a9b090', marginRight: '10px' }} />
                <h4>¿Aún no te decides? ¡Pruébanos!</h4>
                <p>Reserva tu **Clase Muestra (Horario 4:00 PM)** por solo **${claseMuestraCosto} MXN**.</p>
                <button 
                    className="btn-clase-muestra" 
                    onClick={() => onNext({ selectionType: 'sample', data: { nombre: 'Clase Muestra' }, cost: claseMuestraCosto, time: '4:00 PM', dateKey: format(date, 'yyyy-MM-dd') })}
                >
                    Clase Muestra (${claseMuestraCosto})
                </button>
            </div>
            
            <button className="btn-cerrar-modal-simple" onClick={onClose}>Cancelar</button>
        </div>
    );
};

// --------------------------------------------------------------------------
// PASO 2: Selección de Horario (y Camilla)
// --------------------------------------------------------------------------
export const Step2ScheduleSelection = ({ selection, onNext, availability, isWeekend, onClose }) => {
    
    const isCreditUse = selection.selectionType === 'credit';
    const isSample = selection.selectionType === 'sample';
    
    // Filtramos la disponibilidad para la clase muestra si aplica
    const availableHours = isSample 
        ? availability.filter(item => item.hour === '4:00 PM')
        : availability;

    const [selectedHour, setSelectedHour] = useState(isSample ? availableHours[0] : null);
    // 💡 NOTA: En un entorno real, las camillas se cargarían desde la API según selectedHour.
    const [selectedBed, setSelectedBed] = useState(null); 
    const [availableBeds] = useState(8); 

    const handleConfirm = () => {
        if (!selectedHour) return alert("Selecciona un horario.");
        
        const needsBed = isWeekend || selection.selectionType === 'single';
        if (needsBed && !isCreditUse && !selectedBed) return alert("Selecciona una camilla.");
        
        onNext({ ...selection, hour: selectedHour.hour, bed: needsBed ? selectedBed : null });
    };

    return (
        <div className="modal-step-card glass-card">
            <h3 className="step-title">2. Selecciona Horario {isWeekend && 'y Camilla'}</h3>
            <p className="modal-subtitle">
                <FaCalendarAlt style={{ marginRight: '5px' }} /> 
                {isCreditUse ? `Usarás 1 de tus ${selection.credits} créditos.` : `Compra o reserva ${selection.data.nombre}`}
                {isSample && ` Horario fijo para la clase muestra.`}
            </p>

            <div className="horarios-grid">
                {availableHours.map(item => (
                    <button 
                        key={item.hour}
                        className={`btn-hour ${item.available === 0 ? 'full' : ''} ${selectedHour?.hour === item.hour ? 'selected' : ''}`}
                        disabled={item.available === 0 || isSample && item.hour !== '4:00 PM'}
                        onClick={() => setSelectedHour(item)}
                    >
                        {item.hour} ({item.available})
                    </button>
                ))}
            </div>
            
            {/* LÓGICA DE SELECCIÓN DE CAMILLA (Solo Fin de Semana o Clase Única) */}
            {(isWeekend || selection.selectionType === 'single') && selectedHour && (
                <div className="bed-selection-area">
                    <h4>Camillas disponibles (8 totales):</h4>
                    <div className="camillas-simuladas">
                        {Array.from({ length: availableBeds }, (_, i) => (
                            <div 
                                key={i} 
                                className={`camilla-item ${selectedBed === i + 1 ? 'selected' : 'available'}`}
                                onClick={() => setSelectedBed(i + 1)}
                            >
                                Cama {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="popup-actions">
                <button 
                    className="btn-confirmar" 
                    onClick={handleConfirm} 
                    disabled={!selectedHour || (isWeekend && !selectedBed && !isCreditUse)}
                >
                    {isCreditUse ? 'Usar Crédito y Reservar' : 'Continuar al Pago'}
                </button>
                <button className="btn-cerrar" onClick={onClose}>Cancelar</button>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------
// PASO 3: Pago (Con Stripe Modular)
// --------------------------------------------------------------------------
export const Step3Payment = ({ selection, onNext, onClose }) => {
    
    const isCreditUse = selection.selectionType === 'credit';
    if (isCreditUse) {
        // Si usa crédito, salta directamente (Lógica inmutable)
        console.log(`API CALL: Reservar con crédito para ${selection.hour} en ${selection.dateKey}`);
        onNext({}); // Pasa directamente al paso 4 (Confirmación)
        return null; 
    }

    const cost = selection.cost;
    const isPackagePurchase = selection.selectionType === 'package';
    
    // 💡 Función de éxito de PAGO (llamada desde StripePaymentForm)
    const handlePaymentSuccess = (paymentIntentId) => {
        // En un caso real: Llamada a API final para registrar el ID de Pago y completar la transacción.
        console.log(`API CALL: Pago exitoso con ID ${paymentIntentId}. Finalizando reserva/compra.`);
        
        // Pasa al paso 4 (Confirmación)
        onNext(selection); // Pasa la selección completa al último paso para mostrar detalles
    };

    // 💡 Función de manejo de error (llamada desde StripePaymentForm)
    const handlePaymentError = (errorMessage) => {
        alert(`Error en el pago: ${errorMessage}. Por favor, intente de nuevo.`);
    };

    // Creamos el objeto `paquete` que el formulario espera
    const stripePackageData = {
        titulo: isPackagePurchase ? selection.data.titulo : selection.data.nombre,
        precio: cost,
        // Incluimos todos los detalles de la reserva/compra
        details: selection
    };

    return (
        <div className="modal-step-card glass-card">
            <h3 className="step-title">3. Finalizar Pago</h3>
            <p className="modal-subtitle">
                <FaCreditCard style={{ marginRight: '5px' }} /> 
                {isPackagePurchase ? `Comprando Paquete ${stripePackageData.titulo}` : `${stripePackageData.titulo} a las ${selection.hour}`}
            </p>
            
            {/* 🟢 INTEGRACIÓN DEL FORMULARIO DE STRIPE */}
            <StripePaymentForm
                paquete={stripePackageData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
            />

            <div className="popup-actions" style={{ marginTop: '20px' }}>
                <button className="btn-cerrar" onClick={onClose} type="button" style={{ width: 'auto' }}>
                    Cancelar Compra
                </button>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------
// PASO 4: Confirmación
// --------------------------------------------------------------------------
export const Step4Confirmation = ({ selection, onClose, updateCredits }) => {
    
    // Lógica para reflejar en el perfil/base de datos
    useEffect(() => {
        // Si fue una reserva con crédito, se descuenta.
        if (selection.selectionType === 'credit') {
            updateCredits(); 
        }
        // 💡 Lógica Perfil: Enviar datos de 'selection' a la API para reflejar en el calendario mensual del cliente.
        console.log("API CALL: Éxito! Actualizar perfil y calendario con:", selection);
        
    }, [selection, updateCredits]);

    // Aseguramos que tenemos los datos correctos para el mensaje final
    const finalSelection = selection.selectionType === 'package' ? selection : selection;

    return (
        <div className="modal-step-card glass-card success-card">
            <h2 className="step-title"><FaCheckCircle style={{ color: '#34c759', marginRight: '10px' }} /> ¡Éxito!</h2>
            <h3>
                {selection.selectionType === 'package' 
                    ? 'Tu Paquete ha sido comprado' 
                    : 'Tu Reserva ha sido confirmada'}
            </h3>
            <p className="final-message">
                Tu horario de **{finalSelection.hour}** ({format(finalSelection.date, 'dd MMM', { locale: es })}) ha sido reservado. 
                Toda la información y el calendario mensual se **refleja en tu Perfil**.
            </p>
            {finalSelection.selectionType === 'package' && (
                <p className="final-message-detail">
                    ¡Ahora tienes **{finalSelection.data.clases} créditos** disponibles!
                </p>
            )}
            
            <div className="popup-actions">
                <button className="btn-confirmar" onClick={onClose}>
                    Ver Mi Perfil / Calendario
                </button>
            </div>
        </div>
    );
};