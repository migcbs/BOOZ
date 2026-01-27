import React, { useState, useEffect } from 'react';
import { format, getDay, isAfter, parseISO } from "date-fns";
import { es } from 'date-fns/locale'; 
import { FaWallet, FaTimes, FaUsers, FaBed, FaCheckCircle, FaClock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import "./Styles.css"; 
// 🟢 IMPORTACIÓN DINÁMICA
import API_BASE_URL from '../../apiConfig'; 

export default function ReservaPopup({ dayData, close }) {
  const [clases, setClases] = useState([]);
  const [selectedClase, setSelectedClase] = useState(null);
  const [selectedPaquete, setSelectedPaquete] = useState(null);
  const [camilla, setCamilla] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const dayOfWeek = getDay(dayData.date); 
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Verificar suscripción vigente
  const tienePlanActivo = user?.suscripcionActiva && 
                         user?.vencimientoPlan && 
                         isAfter(new Date(user.vencimientoPlan), new Date());

  useEffect(() => {
    // Si tiene plan activo y no es fin de semana, pre-seleccionamos su tipo de paquete
    if (tienePlanActivo && !isWeekend && user.paqueteTipo) {
        setSelectedPaquete({ id: user.paqueteTipo, costo: 0 });
    }

    const fetchClases = async () => {
        try {
            // 🟢 ACTUALIZACIÓN PARA VERCEL
            const res = await fetch(`${API_BASE_URL}/clases/disponibles`);
            const data = await res.json();
            const fechaTarget = format(dayData.date, 'yyyy-MM-dd');
            
            // Filtro riguroso por fecha
            const delDia = data.filter(c => {
                const fechaClase = format(new Date(c.fecha), 'yyyy-MM-dd');
                return fechaClase === fechaTarget;
            });

            setClases(delDia);
            if (delDia.length === 1) setSelectedClase(delDia[0]);
        } catch (err) {
            console.error("Error al cargar clases:", err);
            Swal.fire("Error", "No se pudieron cargar las clases del día", "error");
        }
    };

    fetchClases();
  }, [dayData.date, tienePlanActivo, isWeekend, user.paqueteTipo]);

  const confirmar = async () => {
    if (!selectedClase) return Swal.fire("Aviso", "Selecciona un horario", "info");
    if (!selectedPaquete) return Swal.fire("Aviso", "Selecciona un paquete o clase suelta", "info");
    if (isWeekend && !camilla) return Swal.fire("Aviso", "Selecciona una camilla para fin de semana", "warning");

    setLoading(true);
    try {
      // 🟢 ACTUALIZACIÓN PARA VERCEL
      const res = await fetch(`${API_BASE_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || user.correo,
          paqueteId: selectedPaquete.id.toUpperCase(), 
          numeroCamilla: camilla,
          selection: {
            dateKey: format(new Date(selectedClase.fecha), 'yyyy-MM-dd'),
            hour: format(new Date(selectedClase.fecha), 'HH:mm'),
            nombreClase: selectedClase.nombre,
            tematica: selectedClase.tematica
          }
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        // Actualizamos el usuario localmente para reflejar el nuevo saldo/reserva
        localStorage.setItem("user", JSON.stringify(data.userUpdated));
        await Swal.fire({
            icon: 'success',
            title: '¡Reservado!',
            text: 'Tu lugar ha sido asegurado correctamente en Booz Studio',
            confirmButtonColor: '#8FD9FB'
        });
        close();
        window.location.reload();
      } else {
        throw new Error(data.message || "Error desconocido");
      }
    } catch (e) {
      Swal.fire("Error", e.message || "Error de conexión", "error");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card-solid animate-ios-pop">
        <button className="close-x-btn" onClick={close}><FaTimes /></button>
        
        <div className="modal-header-solid">
          <span className="date-badge-mini">{isWeekend ? "FIN DE SEMANA" : "CLASE SEMANAL"}</span>
          <h2>{format(dayData.date, "EEEE dd 'de' MMMM", { locale: es })}</h2>
        </div>

        <div className="modal-body-scroll">
          <h4 className="section-title"><FaClock /> 1. Horarios Disponibles</h4>
          <div className="clases-stack">
            {clases.length > 0 ? clases.map(c => (
                <div key={c.id} 
                     className={`clase-row ${selectedClase?.id === c.id ? 'selected' : ''}`}
                     onClick={() => setSelectedClase(c)}>
                  <div className="clase-info-main">
                    <strong>{c.nombre}</strong>
                    <span className="tematica-txt">{c.tematica || 'Sesión General'}</span>
                  </div>
                  <div className="clase-time">{format(new Date(c.fecha), 'HH:mm')}</div>
                </div>
            )) : <div className="no-clases-msg">No hay sesiones disponibles para esta fecha.</div>}
          </div>

          {isWeekend && selectedClase && (
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

          <h4 className="section-title"><FaWallet /> {isWeekend ? '3.' : '2.'} Método de Acceso</h4>
          <div className="paquetes-stack">
            {isWeekend ? (
              <div className={`paquete-row selected`} onClick={() => setSelectedPaquete({id: 'SUELTA', costo: 95})}>
                <div className="pkg-text"><span>Pago por sesión individual</span></div>
                <div className="pkg-price-tag">$95</div>
              </div>
            ) : (
              <>
                {tienePlanActivo ? (
                  <div className="active-plan-status animate-ios-entry">
                    <div className="active-info">
                      <FaCheckCircle color="#8FD9FB" size={20} />
                      <div>
                        <strong>Plan {user.planNombre || user.paqueteTipo} activo</strong>
                        <p>Válido hasta: {format(new Date(user.vencimientoPlan), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`paquete-row ${selectedPaquete?.id === 'LMV' ? 'selected' : ''}`}
                         onClick={() => setSelectedPaquete({id: 'LMV', costo: 1099})}>
                      <div className="pkg-text"><span>Lunes / Miércoles / Viernes</span></div>
                      <div className="pkg-price-tag">$1099</div>
                    </div>
                    <div className={`paquete-row ${selectedPaquete?.id === 'MJ' ? 'selected' : ''}`}
                         onClick={() => setSelectedPaquete({id: 'MJ', costo: 699})}>
                      <div className="pkg-text"><span>Martes / Jueves</span></div>
                      <div className="pkg-price-tag">$699</div>
                    </div>
                    <div className={`paquete-row ${selectedPaquete?.id === 'SUELTA' ? 'selected' : ''}`}
                         onClick={() => setSelectedPaquete({id: 'SUELTA', costo: 95})}>
                      <div className="pkg-text"><span>Acceso individual</span></div>
                      <div className="pkg-price-tag">$95</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer-solid">
          <button className="btn-primary-booz" 
                  onClick={confirmar} 
                  disabled={loading || !selectedClase || !selectedPaquete}>
            {loading ? "Sincronizando..." : "Confirmar Mi Lugar"}
          </button>
        </div>
      </div>
    </div>
  );
}