import ReactDOM from 'react-dom';
import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaTimes, FaClock, FaBed, FaTicketAlt, FaMapMarkerAlt, FaTag, FaInfoCircle } from 'react-icons/fa';
import './Reserva.css';

export default function DetalleReservaPopup({ booking, close }) {
  if (!booking) return null;

  const fechaObj = booking.dateTime
    ? booking.dateTime
    : (typeof booking.fecha === 'string' ? parseISO(booking.fecha) : new Date(booking.fecha));

  return ReactDOM.createPortal(
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="popup-card-solid animate-ios-pop">

        <button className="close-x-btn" onClick={close} aria-label="Cerrar">
          <FaTimes />
        </button>

        {booking.imageUrl ? (
          <div className="popup-flyer">
            <img src={booking.imageUrl} alt={booking.nombre} className="popup-flyer-img" />
            <div className="popup-flyer-overlay">
              <span className="date-badge-mini" style={{ position: 'relative', zIndex: 1 }}>
                DETALLE DE RESERVA
              </span>
              <h2 style={{ color: '#fff', margin: '6px 0 0', textTransform: 'capitalize' }}>
                {booking.nombre}
              </h2>
            </div>
          </div>
        ) : (
          <div className="modal-header-solid">
            <span className="date-badge-mini">DETALLE DE RESERVA</span>
            <h2>{booking.nombre}</h2>
          </div>
        )}

        <div className="modal-body-scroll">
          <h4 className="section-title"><FaInfoCircle /> Información de la clase</h4>

          <div className="upcoming-data-grid" style={{ marginBottom: 8 }}>
            <div className="data-item full">
              <FaClock className="item-icon" />
              <div>
                <label>Fecha y Hora</label>
                <p>{format(fechaObj, "EEEE dd 'de' MMMM · HH:mm 'hrs'", { locale: es })}</p>
              </div>
            </div>

            <div className="data-item">
              <FaBed className="item-icon" />
              <div>
                <label>Camilla</label>
                <p>{booking.numeroCamilla || 'N/A'}</p>
              </div>
            </div>

            <div className="data-item">
              <FaTicketAlt className="item-icon" />
              <div>
                <label>Paquete</label>
                <p>{booking.paqueteRef || 'Individual'}</p>
              </div>
            </div>

            <div className="data-item full">
              <FaMapMarkerAlt className="item-icon" />
              <div>
                <label>Ubicación</label>
                <p>Booz Studio Central</p>
              </div>
            </div>

            {booking.tematica && (
              <div className="data-item full">
                <FaTag className="item-icon" />
                <div>
                  <label>Temática</label>
                  <p>{booking.tematica}</p>
                </div>
              </div>
            )}
          </div>

          {booking.criterios?.length > 0 && (
            <>
              <h4 className="section-title">Criterios</h4>
              <div className="criterio-pills-row">
                {booking.criterios.map(c => (
                  <span key={c} className="criterio-pill">{c}</span>
                ))}
              </div>
            </>
          )}

          {booking.descripcion && (
            <>
              <h4 className="section-title">Descripción</h4>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>
                {booking.descripcion}
              </p>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
