// Perfil.jsx

import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaCreditCard, FaCalendarCheck, FaDumbbell, FaEnvelope, FaMapMarkerAlt, FaEdit, FaTimesCircle, FaCheckCircle, FaAngleRight, FaCalendarTimes, FaPhone, FaBirthdayCake, FaUserMd, FaBolt } from 'react-icons/fa';
import { format, parseISO, differenceInDays, isBefore, subHours, getDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import ProfileEditForm from './ProfileEditForm';
import './Styles.css';

// --------------------------------------------------------------------------
// 🟢 DATOS MOCK Y HELPERS
// --------------------------------------------------------------------------

// 🟢 DATOS MOCK
const MOCK_MEMBERSHIP_DATA = {
    credits: 5000, 
    packageName: "Paquete Anual - Acceso Total (5000 MXN)",
    expirationDate: "2026-01-01", 
};
const MOCK_BOOKINGS = [
    { id: 101, date: "2025-12-06", hour: "10:00 AM", coach: "Coach Ana (Finde)", bed: 3, status: "Confirmada", type: "Clase Fin de Semana" }, 
    { id: 102, date: "2025-12-09", hour: "6:00 PM", coach: "Coach Luis", bed: 5, status: "Confirmada", type: "Clase Regular" }, 
    { id: 103, date: "2025-11-20", hour: "4:00 PM", coach: "Coach Ana", bed: 1, status: "Completada", type: "Clase Muestra" },
    { id: 104, date: "2025-12-10", hour: "7:00 AM", coach: "Coach Luis", bed: null, status: "Cancelada", type: "Clase Regular" }
];
const PACKAGE_DAY_MAP = {
    'LUNES_MIÉRCOLES_VIERNES': [1, 3, 5],
    'MARTES_JUEVES': [2, 4],
};


// Helper para encontrar la próxima clase confirmada
const getUpcomingBooking = (bookings) => {
    const today = new Date();
    const upcoming = bookings
        .filter(b => b.status === "Confirmada")
        .map(b => {
            // Simplificación de formato de hora para parseISO
            let timePart = b.hour.toLowerCase().replace(/ /g, '');
            // Se asume que el backend ajusta el ISO string, aquí solo se intenta construir el formato básico
            const dateTimeString = `${b.date}T${timePart.replace('am', '').replace('pm', '')}`; 
            
            return {
                ...b,
                // Usamos la fecha y hora completa para una comparación precisa
                dateTime: parseISO(b.date + 'T00:00:00') 
            };
        })
        .filter(b => b.dateTime && isBefore(today, b.dateTime)) // Solo futuras
        .sort((a, b) => a.dateTime - b.dateTime);
        
    return upcoming.length > 0 ? upcoming[0] : null;
};

// Helper para calcular las próximas N clases del paquete + reservas individuales confirmadas
const getNextPackageClasses = (planType, confirmedBookings, count = 5) => {
    const today = new Date();
    const planDays = PACKAGE_DAY_MAP[planType] || [];
    let upcomingClasses = [];
    
    // 1. Calcular las próximas clases regulares del paquete (máximo 30 iteraciones)
    let currentDate = new Date(today);
    let iterations = 0;
    while (upcomingClasses.length < count && iterations < 30) {
        currentDate = addDays(currentDate, 1); 
        const currentDayOfWeek = getDay(currentDate); 

        if (planDays.includes(currentDayOfWeek)) {
            // Se asume la hora de la clase base
            const classTime = "19:00"; 
            const dateISO = format(currentDate, 'yyyy-MM-dd');
            upcomingClasses.push({
                date: parseISO(`${dateISO}T${classTime}:00`),
                type: 'Clase Base (Paquete)',
                coach: 'Coach Asignado (7:00 PM)', 
                status: 'Confirmada',
            });
        }
        iterations++;
    }
    
    // 2. Filtrar e integrar reservas de fin de semana (Sábado=6, Domingo=0) confirmadas y futuras
    const confirmedWeekends = confirmedBookings
        .map(b => {
            const dateISO = b.date;
            let time24h = b.hour; // Simplificación, asumiendo hora 24h
            if (b.hour.includes('AM') || b.hour.includes('PM')) {
                // Aquí iría la lógica real de conversión AM/PM a 24h
                time24h = b.hour.split(' ')[0] + ':00';
            }

            return {
                ...b,
                dateTime: parseISO(`${dateISO}T${time24h}:00`),
                dateObj: parseISO(dateISO)
            };
        })
        .filter(b => 
            b.status === "Confirmada" && 
            (getDay(b.dateObj) === 0 || getDay(b.dateObj) === 6) && 
            isBefore(today, b.dateTime) 
        )
        .map(b => ({
            date: b.dateTime, 
            type: 'Reserva Fin de Semana',
            coach: b.coach,
            status: 'Confirmada',
        }));

    // 3. Combinar, ordenar y eliminar duplicados (solo las primeras 'count')
    const combined = [...upcomingClasses, ...confirmedWeekends];
    combined.sort((a, b) => a.date - b.date);
    
    const uniqueDates = [];
    return combined.filter(item => {
        // Usar un identificador de fecha/hora único
        const dateKey = item.date.toISOString();
        if (!uniqueDates.includes(dateKey)) {
            uniqueDates.push(dateKey);
            return true;
        }
        return false;
    }).slice(0, count); 
};


// 🟢 SUBCOMPONENTE: Contador de Reloj
const ClockWidget = ({ days, expirationDate }) => (
    <div className="clock-widget-container">
        <div className="clock-face">
            <div className="days-label card-subtitle-small">DÍAS RESTANTES</div>
            <div className="days-number">{days}</div>
        </div>
        <p className="expiration-note">Expira: {format(expirationDate, 'dd/MMM/yyyy', { locale: es })}</p>
    </div>
);

// 🟢 SUBCOMPONENTE: Resumen de Información Personal
const PersonalSummary = ({ user, setIsEditing }) => (
    <div className="profile-card glass-card personal-info-card">
        <img 
            src={user.profileImageUrl || "https://i.pravatar.cc/150?img=49"} 
            alt="Foto de Perfil" 
            className="profile-picture"
        />
        <h2 className="profile-name">{user.nombre} {user.apellido}</h2>
        
        <div className="contact-details">
            <p><FaEnvelope /> {user.correo}</p>
            <p><FaPhone /> {user.telefono}</p>
            <p><FaBirthdayCake /> {format(parseISO(user.fechaNacimiento), 'dd MMMM yyyy', { locale: es })}</p>
            <p><FaMapMarkerAlt /> Coatepec, Ver.</p> 
        </div>

        <div className="medical-summary">
            <p className="card-subtitle-small">DATOS ADICIONALES</p>
            <p><FaUserMd /> <strong>Contacto de Emergencia:</strong> {user.contactoEmergencia}</p>
            <p><strong>Condición Médica:</strong> {user.condicion === 'otro' ? user.condicionOtro : user.condicion || 'Ninguna'}</p>
            <p><strong>Lesiones Previas:</strong> {user.lesiones || 'Ninguna'}</p>
        </div>
        
        <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
            <FaEdit />
        </button>
    </div>
);

// 🟢 SUBCOMPONENTE: Resumen de Membresía
const MembershipSummary = ({ membershipData, daysRemaining, expirationDate, handleBuyMoreOrReserve, handleCancelMembership }) => (
    <div className="profile-card glass-card membership-card">
        <h3 className="card-title-accent"><FaCreditCard /> Resumen</h3>
        
        {/* 🟢 Refinamiento: Eliminamos los asteriscos. Usamos <strong> para sutil negrita, o simplemente dejamos texto */}
        <p className="package-name">
            <strong>{membershipData.packageName}</strong>
        </p>
        
        <p className="credits-count-arcade">
            {membershipData.credits.toLocaleString('es-MX', { minimumFractionDigits: 0 })} 
            <FaDumbbell style={{ color: '#FFD700', marginLeft: '10px' }} />
        </p>
        
        <ClockWidget days={daysRemaining} expirationDate={expirationDate} />
        
        <button className="btn-buy-more" onClick={handleBuyMoreOrReserve}>
            Comprar Más Créditos <FaAngleRight />
        </button>

        {membershipData.packageName !== "Paquete Anual - Cancelación Pendiente" && (
            <button className="btn-cancel-membership" onClick={handleCancelMembership}>
                <FaCalendarTimes /> Cancelar mi Paquete Actual
            </button>
        )}
    </div>
);

// 🟢 SUBCOMPONENTE: Próxima Reserva Destacada
const UpcomingBookingCard = ({ booking, handleCancelBooking, canCancel, handleBuyMoreOrReserve }) => {
    if (!booking) {
        return (
            <div className="profile-card upcoming-card glass-card">
                <div className="no-booking-message">
                    <FaCalendarCheck size={30} style={{ marginBottom: '10px', color: '#89CFF0' }}/>
                    <h3 className="card-title-accent">¡No tienes clases confirmadas!</h3>
                    <p>Reserva tu lugar ahora para no perder tu entrenamiento.</p>
                    
                    <button className="btn-buy-more" onClick={handleBuyMoreOrReserve} style={{ marginTop: '20px' }}>
                        Reservar Clase Ahora <FaAngleRight />
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="profile-card upcoming-card glass-card">
    <h2 className="card-title-accent"><FaCalendarCheck /> ¡Tu Próxima Clase!</h2>
    
    <p className="next-class-date">
        {/* 🟢 Reemplazado **...** por <strong> */}
        <strong>{format(booking.dateTime, 'EEEE, dd MMMM, hh:mm a', { locale: es })}</strong>
    </p>
    <p className="detail-row">
        <FaDumbbell /> <strong>Tipo:</strong> {booking.type}
    </p>
    <p className="detail-row">
        <FaUserMd /> <strong>Coach:</strong> {booking.coach}
    </p>
    
    {canCancel(booking.dateTime) ? (
        <button 
            className="btn-cancel-upcoming" 
            onClick={() => handleCancelBooking(booking.id, booking.dateTime)}
        >
            <FaTimesCircle /> Cancelar Reserva
        </button>
    ) : (
        <button className="btn-cancel-disabled" disabled>
            <FaCalendarTimes /> Cancelación Cerrada 
        </button>
    )}
</div>
    );
};



// 🟢 SUBCOMPONENTE: Historial de Clases
const HistoryCard = ({ bookings }) => (
    <div className="profile-card glass-card history-card">
        <h3 className="card-title-accent">Historial de Clases Pasadas</h3>
        <ul className="booking-list">
            {bookings
                .filter(b => b.status === "Completada" || b.status === "Cancelada")
                .map(b => (
                    <li key={b.id} className="booking-item">
                        <span className="booking-status-icon">
                            {b.status === 'Completada' ? <FaCheckCircle style={{ color: '#34c759' }} /> : 
                            <FaTimesCircle style={{ color: '#FF6347' }} />}
                        </span>
                        <span className="booking-details">
                            {/* Cambio de **{fecha}** a <strong>{fecha}</strong> */}
                            <strong>{format(parseISO(b.date), 'dd MMM', { locale: es })}</strong> - {b.hour}
                            <span className="coach-name"> / {b.coach}</span>
                        </span>
                        <span className={`booking-status ${b.status.toLowerCase()}`}>{b.status}</span>
                    </li>
                ))
            }
        </ul>
    </div>
);

// 🟢 SUBCOMPONENTE: Calendario Próximo
const NextScheduleCard = ({ nextClassesSchedule, handleBuyMoreOrReserve }) => (
    <div className="profile-card glass-card next-schedule-card">
        <h3 className="card-title-accent"><FaCalendarCheck /> Próximas Clases</h3>
        
        <ul className="booking-list">
            {nextClassesSchedule.map((c, index) => (
                <li key={index} className="booking-item">
                    <span className="booking-status-icon" style={{ color: c.type.includes('Fin de Semana') ? '#FFD700' : '#89CFF0' }}>
                        <FaBolt />
                    </span>
                    <span className="booking-details">
                        {/* 🟢 Reemplazado **...** por <strong> */}
                        <strong>{format(c.date, 'EEEE, dd MMMM, hh:mm a', { locale: es })}</strong>
                        <span className="coach-name"> / {c.coach}</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginLeft: '10px' }}> ({c.type})</span>
                    </span>
                </li>
            ))}
        </ul>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="btn-edit-profile" onClick={handleBuyMoreOrReserve}>
                Ver Calendario Completo
            </button>
        </div>
    </div>
);


// --------------------------------------------------------------------------
// COMPONENTE PRINCIPAL: PÁGINA DE PERFIL DEL CLIENTE
// --------------------------------------------------------------------------
export default function Perfil() {
    
    const navigate = useNavigate();
    
    const [fullUser, setFullUser] = useState(null);
    const [membershipData, setMembershipData] = useState(MOCK_MEMBERSHIP_DATA);
    const [bookings, setBookings] = useState(MOCK_BOOKINGS); 
    const [isEditing, setIsEditing] = useState(false); 

    // 🟢 FUNCIÓN DE CARGA DE DATOS AL INICIO
    useEffect(() => {
        const sessionUser = JSON.parse(localStorage.getItem('user'));
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');

        if (sessionUser) {
            const userFullData = allUsers.find(u => u.correo === sessionUser.correo);
            if (userFullData) {
                setFullUser(userFullData);
            } else {
                console.error("No se encontraron datos completos para el usuario en sesión.");
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (!fullUser) {
        return <div className="profile-page-container">Cargando datos del perfil...</div>;
    }

    const upcomingBooking = getUpcomingBooking(bookings);

    // 🟢 Función para guardar los cambios del formulario de edición
    const handleSaveProfile = (updatedUserData) => {
        setFullUser(updatedUserData);
        
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = allUsers.map(u => 
            u.correo === updatedUserData.correo ? updatedUserData : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        setIsEditing(false);
        alert("¡Perfil actualizado con éxito!");
    };


    // 🟢 Función para verificar si la cancelación es permitida (S/D y +24h)
    const canCancel = (bookingDateTime) => {
        const twentyFourHoursBefore = subHours(bookingDateTime, 24);
        const now = new Date();
        const dayOfWeek = getDay(bookingDateTime);

        const isWeekendClass = dayOfWeek === 0 || dayOfWeek === 6;
        const isOutside24HourWindow = isBefore(now, twentyFourHoursBefore);

        return isWeekendClass && isOutside24HourWindow;
    };


    const handleCancelBooking = (bookingId, bookingDateTime) => {
        
        if (!canCancel(bookingDateTime)) {
            alert("No es posible cancelar. Las clases de fin de semana solo permiten cancelación hasta 24 horas antes.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas cancelar la reserva ${bookingId}? Se regresarán los créditos a tu cuenta.`)) return;

        const newBookings = bookings.map(b => 
            b.id === bookingId ? { ...b, status: 'Cancelada' } : b
        );
        
        setBookings(newBookings);
        setMembershipData(prev => ({
            ...prev,
            credits: prev.credits + 1 
        }));
        
        alert(`Reserva ${bookingId} cancelada exitosamente. Se ha restaurado 1 crédito.`);
    };
    
    // 🟢 FUNCIÓN: Cancelación de Membresía
    const handleCancelMembership = () => {
        if (!window.confirm("ADVERTENCIA: ¿Estás seguro de que deseas cancelar tu Paquete Actual? Perderás los beneficios al expirar el plan.")) return;
        
        setMembershipData(prev => ({
            ...prev,
            packageName: "Paquete Anual - Cancelación Pendiente",
        }));
        
        alert("¡Tu paquete ha sido marcado para cancelación! Seguirás teniendo acceso hasta la fecha de expiración.");
    };


    // Botón de Compra/Reserva que navega al Calendario
    const handleBuyMoreOrReserve = () => {
        navigate('/cliente/home');
        // Pequeño timeout para asegurar que la navegación comience antes del scroll
        window.setTimeout(() => {
            const element = document.getElementById('calendario-section');
            if (element) {
                window.scrollTo({
                    top: element.offsetTop - 100,
                    behavior: 'smooth',
                });
            }
        }, 50);
    };

    // CÁLCULO DE DÍAS RESTANTES
    const expirationDate = parseISO(membershipData.expirationDate);
    const today = new Date();
    const daysRemaining = differenceInDays(expirationDate, today);

    // 🟢 CALENDARIO PERSONALIZADO: 
    const userPlanType = 'LUNES_MIÉRCOLES_VIERNES'; 
    const confirmedBookings = bookings.filter(b => b.status === "Confirmada");
    const nextClassesSchedule = getNextPackageClasses(userPlanType, confirmedBookings, 5); 

    // 🟢 Si estamos editando, renderizamos el formulario de edición
    if (isEditing) {
        return (
            <div className="profile-page-container">
                <ProfileEditForm 
                    initialData={fullUser} 
                    onSave={handleSaveProfile} 
                    onCancel={() => setIsEditing(false)} 
                />
            </div>
        );
    }
    
    // 🟢 RENDERIZADO NORMAL DEL PERFIL
    return (
        <div className="profile-page-container">
          
            
            <div className="profile-grid">
                
                {/* === COLUMNA IZQUIERDA: RESUMEN Y ACCIÓN RÁPIDA (Orden Móvil 2) === */}
                <div className="summary-column">
                    
                    {/* Tarjeta 1: Información Personal */}
                    <PersonalSummary user={fullUser} setIsEditing={setIsEditing} />

                    {/* Tarjeta 2: Resumen de Créditos/Paquete */}
                    <MembershipSummary 
                        membershipData={membershipData}
                        daysRemaining={daysRemaining}
                        expirationDate={expirationDate}
                        handleBuyMoreOrReserve={handleBuyMoreOrReserve}
                        handleCancelMembership={handleCancelMembership}
                    />

                </div>

                {/* === COLUMNA DERECHA: RESERVAS (Orden Móvil 1) === */}
                <div className="bookings-column">
                    
                    {/* Tarjeta 3: Próxima Reserva (Destacado) */}
                    <UpcomingBookingCard
                        booking={upcomingBooking}
                        handleCancelBooking={handleCancelBooking}
                        canCancel={canCancel}
                        handleBuyMoreOrReserve={handleBuyMoreOrReserve}
                    />
                    
                    {/* Tarjeta 4: Calendario Personalizado de Clases Próximas */}
                    <NextScheduleCard 
                        nextClassesSchedule={nextClassesSchedule} 
                        handleBuyMoreOrReserve={handleBuyMoreOrReserve}
                    />
                    
                    {/* Tarjeta 5: Historial de Clases Pasadas */}
                    <HistoryCard bookings={bookings} />
                </div>
            </div>
        </div>
    );
}