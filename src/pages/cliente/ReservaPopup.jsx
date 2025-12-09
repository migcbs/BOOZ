// ReservaPopup.jsx

import React, { useState, useEffect } from 'react';
// 🟢 IMPORTACIÓN AÑADIDA: Necesaria para el formato de fecha en español
import { format } from "date-fns";
import { es } from 'date-fns/locale'; 

import "./Styles.css"; // Asegúrate de que esta ruta sea correcta para tu CSS

// ====================================================================
// 1. COMPONENTE INTERNO: ProgressBar
// Muestra la ocupación y el estado de disponibilidad (full, low, ok).
// ====================================================================

/**
 * Componente visual de la barra de progreso que cambia de color y texto
 * según la disponibilidad.
 * @param {number} available - Slots disponibles.
 * @param {number} maxSlots - Slots totales.
 */
function ProgressBar({ available, maxSlots }) {
    if (maxSlots === 0) {
        return <div className="progress-bar-container full">
            <span className="progress-bar-label">NO DISPONIBLE</span>
        </div>;
    }
    
    // Si la disponibilidad es menor a 0 (ej. cuando se selecciona una camilla 
    // y quedan 0, el disponible 'visual' es -1), lo limitamos a 0 para el cálculo.
    const actualAvailable = Math.max(0, available); 
    const reserved = maxSlots - actualAvailable;
    const percentage = (reserved / maxSlots) * 100;

    let statusClass = '';
    let statusText = '';

    // Lógica para determinar el estado (se usa 'actualAvailable' para la clase)
    if (actualAvailable === 0) {
        statusClass = 'full';
        statusText = 'COMPLETO';
    } else if (actualAvailable <= maxSlots * 0.25) { // Menos del 25% disponible
        statusClass = 'low';
        statusText = `¡QUEDAN ${actualAvailable} LUGARES!`;
    } else {
        statusClass = 'ok';
        statusText = `OCUPACIÓN: ${reserved} / ${maxSlots}`;
    }

    return (
      <div className={`progress-bar-container ${statusClass}`}>
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
        <span className="progress-bar-label">{statusText}</span>
      </div>
    );
}

// ====================================================================
// 2. COMPONENTE PRINCIPAL: ReservaPopup
// ====================================================================

export default function ReservaPopup({ dayData, close }) {
  // Desestructuramos las props
  const { date, dayName, isWeekend, availability } = dayData; 
  
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null); 
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  
  const isWeekday = !isWeekend;
  
  // Efecto para asegurar que la camilla se reinicie al cambiar de hora
  useEffect(() => {
    setSelectedSpot(null);
  }, [selectedHour]);
  
  const handleConfirm = () => {
    if (!selectedHour || !isReservable) return;

    let reservationDetails = {
      date: date.toISOString().split('T')[0],
      hour: selectedHour.hour,
      type: isWeekday ? 'Paquete' : 'Camilla'
    };
    
    if (isWeekend) {
      reservationDetails.spot = selectedSpot;
    }
    
    console.log("Reserva Confirmada:", reservationDetails);
    
    let message = `Reserva confirmada para el día ${dayName}, ${format(date, 'dd MMM', { locale: es })} a las ${selectedHour.hour}.`;
    if (isWeekend && selectedSpot) {
      message += ` En la camilla número ${selectedSpot}.`;
    }
    setConfirmationMessage(message);
    
    // Aquí se ejecutaría el cierre (simulado) después de la confirmación
    setTimeout(close, 2000); 
  };
  
  // ----------------------------------------------------
  // LÓGICA DE VISUALIZACIÓN DE CAMAS/ESPACIOS 
  // ----------------------------------------------------
  const renderSpotsSelection = () => {
    if (!selectedHour) return null;
    
    // Si es fin de semana, mostramos camillas Y la barra de progreso
    if (isWeekend) {
      const maxSpots = selectedHour.maxSlots;
      const available = selectedHour.available;
      
      /* 🟢 CLAVE REACTIVIDAD: Ajustamos la disponibilidad VIRTUAL para la barra.
         Si el usuario ha seleccionado una camilla, reducimos en 1 la disponibilidad
         para que la barra se actualice visualmente.
      */
      let displayAvailable = available;
      if (selectedSpot !== null && available > 0) {
          // Si el usuario eligió una camilla, la disponibilidad efectiva es una menos
          displayAvailable = available - 1; 
      }
      
      const reservedSpots = maxSpots - available;
      
      // Creación del array de camillas para el grid
      const spots = Array.from({ length: maxSpots }, (_, i) => ({
        id: i + 1,
        isReserved: i < reservedSpots
      }));
      
      return (
        <div className="spot-selection-container">
          
          <h4>Disponibilidad de Camillas:</h4>
          <ProgressBar
              available={displayAvailable} 
              maxSlots={maxSpots}
          />
          
          <h3 style={{ marginTop: '20px' }}>2. Selecciona tu Camilla:</h3>
          <div className="spots-grid">
            {spots.map(spot => (
              <div
                key={spot.id}
                className={`spot-item ${spot.isReserved ? 'reserved' : ''} ${selectedSpot === spot.id ? 'selected' : ''}`}
                onClick={() => {
                    if (spot.isReserved) return;
                    // Esto dispara el re-renderizado y actualiza la ProgressBar
                    setSelectedSpot(selectedSpot === spot.id ? null : spot.id);
                }}
                aria-label={spot.isReserved ? `Camilla ${spot.id} reservada` : `Seleccionar Camilla ${spot.id}`}
              >
                {spot.id}
              </div>
            ))}
          </div>
          
        </div>
      );
    }
    
    // Si es entre semana (solo resumen)
    return (
        <div className="spot-selection-container weekday-summary">
            <h4>2. Resumen de Cupo del Paquete:</h4>
            <ProgressBar 
                available={selectedHour.available}
                maxSlots={selectedHour.maxSlots}
            />
        </div>
    );
  };

  // Se puede reservar si: se eligió hora Y (es día de semana O se eligió camilla).
  const isReservable = selectedHour && (isWeekday || selectedSpot);
  
  // ----------------------------------------------------
  // 3. RENDERIZADO FINAL Y MENSAJE DE CONFIRMACIÓN
  // ----------------------------------------------------
  if (confirmationMessage) {
      return (
          <div className="popup-overlay">
              <div className="popup-card success-card">
                  <h2>¡Reserva Exitosa! 🎉</h2>
                  <p>{confirmationMessage}</p>
                  {/* Este botón podría cerrar el popup de inmediato, o esperar el setTimeout */}
                  <button className="btn-cerrar" onClick={close}>Cerrar</button> 
              </div>
          </div>
      );
  }


  return (
    <div className="popup-overlay">
      <div className="popup-card glass-card">
        
        {/* 🟢 Uso de format y es CORREGIDO */}
        <h3>Reserva para: {dayName}, {format(date, 'dd MMM', { locale: es })}</h3>
        
        {/* 1. SELECCIÓN DE HORARIO */}
        <div className="hour-selection">
          <h4>1. Elige un Horario ({isWeekend ? 'Camilla' : 'Cupo'}):</h4>
          <div className="hour-buttons-grid">
            {availability.map(item => (
              <button 
                key={item.hour}
                className={`btn-hour ${item.available === 0 ? 'full' : ''} ${selectedHour?.hour === item.hour ? 'selected' : ''}`}
                disabled={item.available === 0}
                onClick={() => {
                    // Al seleccionar hora, se actualiza el estado y la ProgressBar se re-renderiza.
                    setSelectedHour(item); 
                }}
              >
                {item.hour} 
                <span className="available-count">({item.available})</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* 2. SELECCIÓN DE CAMILLA / Resumen de Cupo */}
        {selectedHour && renderSpotsSelection()}

        <div className="popup-actions">
          <button 
            className="btn-confirmar" 
            onClick={handleConfirm}
            disabled={!isReservable}
          >
            Confirmar Reserva
          </button>
          <button className="btn-cerrar" onClick={close}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}