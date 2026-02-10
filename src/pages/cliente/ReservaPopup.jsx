import React, { useState, useEffect } from 'react';
import { format, getDay, isAfter } from "date-fns";
import { es } from 'date-fns/locale'; 
import { FaWallet, FaTimes, FaBed, FaCheckCircle, FaClock, FaUserClock, FaMoneyBillWave } from 'react-icons/fa';
import Swal from 'sweetalert2';
import "./Reserva.css"; 
import API_BASE_URL from '../../apiConfig'; 

export default function ReservaPopup({ dayData, close }) {
  const [clases, setClases] = useState([]);
  const [selectedClase, setSelectedClase] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null); // 'CREDITOS' o 'EFECTIVO'
  const [camilla, setCamilla] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const dayOfWeek = getDay(dayData.date); 
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 1. Verificar si tiene plan activo (L-V)
  const tienePlanActivo = user?.suscripcionActiva && 
                         user?.vencimientoPlan && 
                         isAfter(new Date(user.vencimientoPlan), new Date());

  // 2. Determinar si la clase seleccionada está llena
  const estaLlena = selectedClase?.inscritos >= selectedClase?.cupoMaximo;

  useEffect(() => {
    const fetchClases = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/clases/disponibles`);
            const data = await res.json();
            const fechaTarget = format(dayData.date, 'yyyy-MM-dd');
            
            const delDia = data.filter(c => format(new Date(c.fecha), 'yyyy-MM-dd') === fechaTarget);
            setClases(delDia);
            if (delDia.length === 1) setSelectedClase(delDia[0]);
        } catch (err) {
            Swal.fire("Error", "No se pudieron cargar las clases", "error");
        }
    };
    fetchClases();
  }, [dayData.date]);

const confirmar = async () => {
  if (!selectedClase) return Swal.fire("Aviso", "Selecciona un horario", "info");
  if (isWeekend && !camilla) return Swal.fire("Aviso", "Selecciona una camilla", "warning");

  setLoading(true);
  
  // Definimos qué tipo de acceso estamos usando para que el backend sepa qué descontar
  const tipoAcceso = isWeekend ? 'CREDITO' : (tienePlanActivo ? 'PLAN' : metodoPago);

  try {
    const res = await fetch(`${API_BASE_URL}/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email || user.correo,
        claseId: selectedClase.id || selectedClase._id, // Asegúrate de enviar el ID correcto
        numeroCamilla: camilla,
        metodoPago: tipoAcceso, // 'PLAN', 'CREDITOS' o 'EFECTIVO'
        fechaClase: selectedClase.fecha // Enviamos la fecha para validaciones de cupo
      })
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      // Importante: El backend debe devolver el usuario actualizado
      localStorage.setItem("user", JSON.stringify(data.userUpdated));
      await Swal.fire({
          icon: 'success',
          title: '¡Reservado!',
          text: 'Tu lugar ha sido asegurado.',
          confirmButtonColor: '#8FD9FB'
      });
      close();
      window.location.reload();
    } else {
      // Esto captura el error 500 y te muestra el mensaje real del backend
      throw new Error(data.message || "Error interno del servidor (500)");
    }
  } catch (e) {
    Swal.fire("Error", e.message, "error");
  } finally { 
    setLoading(false); 
  }
};

  return (
    <div className="popup-overlay">
      <div className="popup-card-solid animate-ios-pop">
        <button className="close-x-btn" onClick={close}><FaTimes /></button>
        
        <div className="modal-header-solid">
          <span className="date-badge-mini">{isWeekend ? "FIN DE SEMANA" : "SESIÓN SEMANAL"}</span>
          <h2>{format(dayData.date, "EEEE dd 'de' MMMM", { locale: es })}</h2>
        </div>

        <div className="modal-body-scroll">
          <h4 className="section-title"><FaClock /> 1. Horarios Disponibles</h4>
          <div className="clases-stack">
            {clases.map(c => (
                <div key={c.id} 
                     className={`clase-row ${selectedClase?.id === c.id ? 'selected' : ''}`}
                     onClick={() => setSelectedClase(c)}>
                  <div className="clase-info-main">
                    <strong>{c.nombre}</strong>
                    <span className="tematica-txt">{c.cupoMaximo - c.inscritos} lugares disponibles</span>
                  </div>
                  <div className="clase-time">{format(new Date(c.fecha), 'HH:mm')}</div>
                </div>
            ))}
          </div>

          {isWeekend && (
            <div className="camilla-section animate-ios-entry">
              <h4 className="section-title"><FaBed /> 2. Camilla Asignada</h4>
              <div className="camilla-selector-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button key={n} 
                            className={`camilla-node ${camilla === n ? 'active' : ''}`}
                            onClick={() => setCamilla(n)}>{n}</button>
                ))}
              </div>
            </div>
          )}

          <h4 className="section-title"><FaWallet /> {isWeekend ? '3.' : '2.'} Confirmación de Pago</h4>
          <div className="paquetes-stack">
            {isWeekend ? (
              <div className="active-plan-status">
                <div className="active-info">
                  <FaCheckCircle color="#8FD9FB" size={20} />
                  <div>
                    <strong>Pago con Créditos</strong>
                    <p>Tienes {user.creditos} créditos disponibles</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {tienePlanActivo ? (
                  <div className="active-plan-status animate-ios-entry">
                    <div className="active-info">
                      <FaCheckCircle color="#8FD9FB" size={20} />
                      <div>
                        <strong>Incluido en tu Plan {user.paqueteTipo}</strong>
                        <p>Vence el: {format(new Date(user.vencimientoPlan), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="payment-options-row">
                    <div className={`pay-card ${metodoPago === 'CREDITOS' ? 'active' : ''}`}
                         onClick={() => setMetodoPago('CREDITOS')}>
                        <FaWallet />
                        <span>Créditos ({user.creditos})</span>
                    </div>
                    <div className={`pay-card ${metodoPago === 'EFECTIVO' ? 'active' : ''}`}
                         onClick={() => setMetodoPago('EFECTIVO')}>
                        <FaMoneyBillWave />
                        <span>Efectivo</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer-solid">
          <button className={`btn-primary-booz ${estaLlena ? 'waitlist-mode' : ''}`}
                  onClick={confirmar} 
                  disabled={loading || !selectedClase}>
            {loading ? "Procesando..." : (estaLlena ? "Unirse a Lista de Espera" : "Confirmar Mi Lugar")}
          </button>
        </div>
      </div>
    </div>
  );
}