import ReactDOM from 'react-dom';
import React, { useState, useEffect } from 'react';
import { format, getDay, isAfter } from "date-fns";
import { es } from 'date-fns/locale';
import { FaWallet, FaTimes, FaBed, FaCheckCircle, FaClock, FaMoneyBillWave, FaTag } from 'react-icons/fa';
import Swal from 'sweetalert2';
import "./Reserva.css";
import authFetch from '../../authFetch';

export default function ReservaPopup({ dayData, close }) {
  const [clases, setClases]               = useState([]);
  const [selectedClase, setSelectedClase] = useState(null);
  const [metodoPago, setMetodoPago]       = useState(null);
  const [camilla, setCamilla]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [loadingClases, setLoadingClases] = useState(true);
  const [showJumpWarning, setShowJumpWarning] = useState(false);

  // ✅ CORRECCIÓN: clave booz_user con fallback seguro
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("booz_user")) || {}; }
    catch { return {}; }
  })();

  const dayOfWeek  = getDay(dayData.date);
  const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6;

  // ✅ CORRECCIÓN: campo correcto creditosDisponibles
  const creditos = user?.creditosDisponibles || 0;

  const tienePlanActivo = user?.suscripcionActiva &&
                          user?.vencimientoPlan &&
                          isAfter(new Date(user.vencimientoPlan), new Date());

  const estaLlena = selectedClase
    ? selectedClase.inscritos >= selectedClase.cupoMaximo
    : false;

  useEffect(() => {
    const fetchClases = async () => {
      try {
        setLoadingClases(true);
        const res  = await authFetch('/clases/disponibles');
        const data = await res.json();
        const fechaTarget = format(dayData.date, 'yyyy-MM-dd');
        const delDia = data.filter(c =>
          format(new Date(c.fecha), 'yyyy-MM-dd') === fechaTarget
        );
        setClases(delDia);
        if (delDia.length === 1) setSelectedClase(delDia[0]);
      } catch (err) {
        Swal.fire("Error", "No se pudieron cargar las clases", "error");
      } finally {
        setLoadingClases(false);
      }
    };
    fetchClases();
  }, [dayData.date]);

  const confirmar = async () => {
    if (!selectedClase) return Swal.fire("Aviso", "Selecciona un horario", "info");
    if (isWeekend && !camilla) return Swal.fire("Aviso", "Selecciona una camilla", "warning");
    if (!isWeekend && !tienePlanActivo && !metodoPago) {
      return Swal.fire("Aviso", "Selecciona un método de pago", "info");
    }

    setLoading(true);

    const tipoAcceso = isWeekend
      ? 'CREDITOS'
      : tienePlanActivo ? 'SUSCRIPCION' : metodoPago;

    try {
      const res = await authFetch('/reservas', {
        method: 'POST',
        body: JSON.stringify({
          email:         user.email,
          claseId:       selectedClase.id,
          numeroCamilla: camilla,
          metodoPago:    tipoAcceso,
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ CORRECCIÓN: actualizar booz_user
        localStorage.setItem("booz_user", JSON.stringify(data.userUpdated));
        await Swal.fire({
          icon: 'success',
          title: '¡Reservado!',
          text: 'Tu lugar ha sido asegurado.',
          confirmButtonColor: '#8FD9FB',
          timer: 2000,
          showConfirmButton: false
        });
        close();
      } else {
        throw new Error(data.message || "Error al procesar la reserva");
      }
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="popup-card-solid animate-ios-pop">

        {/* CERRAR */}
        <button className="close-x-btn" onClick={close} aria-label="Cerrar">
          <FaTimes />
        </button>

        {/* FLYER — se muestra cuando la clase seleccionada tiene imagen */}
        {selectedClase?.imageUrl && (
          <div className="popup-flyer">
            <img src={selectedClase.imageUrl} alt={selectedClase.nombre} className="popup-flyer-img" />
            <div className="popup-flyer-overlay">
              <span className="date-badge-mini" style={{ position: 'relative', zIndex: 1 }}>
                {isWeekend ? "FIN DE SEMANA" : "SESIÓN SEMANAL"}
              </span>
              <h2 style={{ color: '#fff', margin: '6px 0 0', textTransform: 'capitalize' }}>
                {format(dayData.date, "EEEE dd 'de' MMMM", { locale: es })}
              </h2>
            </div>
          </div>
        )}

        {/* HEADER — solo cuando no hay flyer */}
        {!selectedClase?.imageUrl && (
          <div className="modal-header-solid">
            <span className="date-badge-mini">
              {isWeekend ? "FIN DE SEMANA" : "SESIÓN SEMANAL"}
            </span>
            <h2>{format(dayData.date, "EEEE dd 'de' MMMM", { locale: es })}</h2>
            <div className="user-credits-mini">
              <FaWallet size={12} />
              <span>{creditos} crédito{creditos !== 1 ? 's' : ''} disponibles</span>
            </div>
          </div>
        )}
        {selectedClase?.imageUrl && (
          <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'center' }}>
            <div className="user-credits-mini">
              <FaWallet size={12} />
              <span>{creditos} crédito{creditos !== 1 ? 's' : ''} disponibles</span>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="modal-body-scroll">

          {/* PASO 1 — Horarios */}
          <h4 className="section-title"><FaClock /> Horarios disponibles</h4>

          {loadingClases ? (
            <div className="modal-loading">
              <div className="calendar-spinner small" />
              <span>Cargando clases...</span>
            </div>
          ) : clases.length === 0 ? (
            <div className="empty-modal-state">
              No hay clases disponibles para este día.
            </div>
          ) : (
            <div className="clases-stack">
              {clases.map(c => {
                const llena = c.inscritos >= c.cupoMaximo;
                return (
                  <div
                    key={c.id}
                    className={`clase-row ${selectedClase?.id === c.id ? 'selected' : ''} ${llena ? 'full' : ''}`}
                    onClick={() => { if (!llena) { setSelectedClase(c); setShowJumpWarning(false); } }}
                  >
                    {/* Dot de color de la clase */}
                    <div
                      className="clase-color-dot"
                      style={{ background: c.color || '#8FD9FB' }}
                    />
                    <div className="clase-info-main">
                      <strong>{c.nombre}</strong>
                      <span className="tematica-txt">
                        {llena
                          ? 'Clase llena'
                          : `${c.cupoMaximo - c.inscritos} lugar${c.cupoMaximo - c.inscritos !== 1 ? 'es' : ''}`}
                      </span>
                    </div>
                    <div className="clase-time">
                      {format(new Date(c.fecha), 'HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PASO 2 — Camillas (solo fines de semana) */}
          {isWeekend && (
            <div className="camilla-section">
              <h4 className="section-title"><FaBed /> Elige tu camilla</h4>
              <div className="camilla-selector-grid">
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button
                    key={n}
                    className={`camilla-node ${camilla === n ? 'active' : ''}`}
                    onClick={() => setCamilla(camilla === n ? null : n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3 — Pago */}
          <h4 className="section-title">
            <FaWallet /> {isWeekend ? 'Confirmar pago' : 'Método de acceso'}
          </h4>

          {isWeekend ? (
            <div className="active-plan-status">
              <FaCheckCircle color="#8FD9FB" size={18} />
              <div>
                <strong>Se descontará 1 crédito</strong>
                <p>Tienes {creditos} crédito{creditos !== 1 ? 's' : ''} en tu billetera</p>
              </div>
            </div>
          ) : tienePlanActivo ? (
            <div className="active-plan-status">
              <FaCheckCircle color="#34C759" size={18} />
              <div>
                <strong>Incluido en tu plan {user.paqueteTipo}</strong>
                <p>Vence el {format(new Date(user.vencimientoPlan), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          ) : (
            <div className="payment-options-row">
              <div
                className={`pay-card ${metodoPago === 'CREDITOS' ? 'active' : ''}`}
                onClick={() => setMetodoPago('CREDITOS')}
              >
                <FaWallet size={20} />
                <span>{creditos} crédito{creditos !== 1 ? 's' : ''}</span>
              </div>
              <div
                className={`pay-card ${metodoPago === 'EFECTIVO' ? 'active' : ''}`}
                onClick={() => setMetodoPago('EFECTIVO')}
              >
                <FaMoneyBillWave size={20} />
                <span>Efectivo</span>
              </div>
            </div>
          )}

        </div>

        {/* AVISO JUMP&FLOW */}
        {showJumpWarning && selectedClase?.tematica === 'Jump&Flow' && (
          <div className="jumpflow-warning">
            <div className="jumpflow-warning-header">
              <span className="jumpflow-warning-icon">⚡</span>
              <strong>Requisitos para Jump&Flow</strong>
            </div>
            <p>Antes de confirmar, asegúrate de cumplir con lo siguiente:</p>
            <ul>
              <li>✨ NO tener lesiones en rodillas/tobillos.</li>
              <li>✨ Poder realizar cardio HIIT (elevar la frecuencia cardiaca).</li>
            </ul>
            <div className="jumpflow-warning-actions">
              <button className="jumpflow-btn-cancel" onClick={() => setShowJumpWarning(false)}>
                Cancelar
              </button>
              <button className="jumpflow-btn-confirm" onClick={() => { setShowJumpWarning(false); confirmar(); }}>
                Sí, cumplo los requisitos
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="modal-footer-solid">
          <button
            className={`btn-primary-booz ${estaLlena ? 'waitlist-mode' : ''}`}
            onClick={() => {
              if (!estaLlena && selectedClase?.tematica === 'Jump&Flow') {
                setShowJumpWarning(true);
              } else {
                confirmar();
              }
            }}
            disabled={loading || !selectedClase || showJumpWarning}
          >
            {loading
              ? "Procesando..."
              : estaLlena
                ? "Unirse a lista de espera"
                : "Confirmar mi lugar"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}