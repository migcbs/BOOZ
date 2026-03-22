import React, { useState, useEffect } from 'react';
import { 
    FaUserCircle, FaCreditCard, FaCalendarCheck, FaEnvelope, 
    FaEdit, FaCheckCircle, FaAngleRight, FaPhone, FaBirthdayCake, 
    FaUserMd, FaBolt, FaTimesCircle, FaStethoscope,
    FaClock, FaMapMarkerAlt, 
    FaBed, FaTicketAlt, FaCalendarPlus 
} from 'react-icons/fa';
import { format, parseISO, isBefore, subHours, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProfileEditForm from './ProfileEditForm';
import Tienda from './Tienda';
import './Styles.css';
import authFetch from '../../authFetch';

const getUpcomingBooking = (bookings) => {
    if (!bookings || bookings.length === 0) return null;
    const today = new Date();
    const upcoming = bookings
        .map(b => ({ ...b, dateTime: typeof b.fecha === 'string' ? parseISO(b.fecha) : new Date(b.fecha) }))
        .filter(b => isAfter(b.dateTime, today))
        .sort((a, b) => a.dateTime - b.dateTime);
    return upcoming.length > 0 ? upcoming[0] : null;
};

export default function Perfil() {
    const navigate = useNavigate();
    const [fullUser, setFullUser]     = useState(null);
    const [isEditing, setIsEditing]   = useState(false);
    const [showTienda, setShowTienda] = useState(false);
    const [loading, setLoading]       = useState(true);

    const loadProfileData = async () => {
        // ✅ CORRECCIÓN: clave correcta booz_user
        const sessionUser = JSON.parse(localStorage.getItem('booz_user'));
        const email = sessionUser?.email;

        if (!email) return navigate('/login');

        try {
            // ✅ authFetch agrega el token JWT automáticamente
            const response = await authFetch(`/user/${encodeURIComponent(email)}`);
            if (response && response.ok) {
                const data = await response.json();
                setFullUser(data);
                // ✅ CORRECCIÓN: clave correcta booz_user
                localStorage.setItem('booz_user', JSON.stringify(data));
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProfileData(); }, []);

    const downloadICS = (booking) => {
        const date = booking.dateTime;
        const startDate = format(date, "yyyyMMdd'T'HHmmss");
        const endDate   = format(new Date(date.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `SUMMARY:Clase Booz: ${booking.nombre}`,
            `DESCRIPTION:Temática: ${booking.tematica || 'General'}. Camilla: ${booking.numeroCamilla || 'N/A'}`,
            "LOCATION:Booz Studio Central",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\n");

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `clase-booz-${format(date, 'yyyy-MM-dd')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveProfile = async (updatedData) => {
        try {
            const response = await authFetch(`/coach/update-expediente/${fullUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            const result = await response?.json();

            if (response?.ok && result?.user) {
                setFullUser(result.user);
                localStorage.setItem('booz_user', JSON.stringify(result.user));
                setIsEditing(false);
                Swal.fire({ icon: 'success', title: '¡Perfil actualizado!', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', result?.error || 'No se pudieron guardar los cambios.', 'error');
            }
        } catch (error) {
            console.error('Error guardando perfil:', error);
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        }
    };

    const handleCancelarReserva = async (reservaId, fechaClase) => {
        const ahora       = new Date();
        const claseDate   = typeof fechaClase === 'string' ? parseISO(fechaClase) : new Date(fechaClase);
        const limiteCancelacion = subHours(claseDate, 24);

        if (isAfter(ahora, limiteCancelacion)) {
            return Swal.fire({
                icon: 'error',
                title: 'Cancelación Bloqueada',
                text: 'Faltan menos de 24 horas para la clase. Por política de Booz no es posible reembolsar el crédito.',
                confirmButtonColor: '#FC7358'
            });
        }

        const confirm = await Swal.fire({
            title: '¿Liberar tu lugar?',
            text: "Se te devolverá tu crédito automáticamente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#FC7358'
        });

        if (confirm.isConfirmed) {
            try {
                // ✅ authFetch agrega el token JWT automáticamente
                const response = await authFetch('/reservas/cancelar', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        reservaId, 
                        userEmail: fullUser.email 
                    })
                });

                if (response && response.ok) {
                    await Swal.fire('Cancelada', 'Tu lugar se ha liberado y tu crédito ha vuelto a tu billetera.', 'success');
                    loadProfileData();
                }
            } catch (e) {
                Swal.fire('Error', 'Servidor no disponible.', 'error');
            }
        }
    };

    if (loading) return (
        <div className="loader-container-full">
            <div className="loader-content">
                <img src="/isologo.png" alt="Booz Logo" className="loader-logo-spin" />
            </div>
        </div>
    );

    if (!fullUser) return (
        <div className="profile-page-container">
            No se encontró el usuario.
        </div>
    );

    const upcomingBooking = getUpcomingBooking(fullUser.reservas || []);

    return (
        <div className="profile-page-container animate-ios-entry">
            {showTienda && (
                <Tienda
                    isModal={showTienda}
                    onClose={async () => {
                        setShowTienda(false);
                        // Recargar perfil completo para reflejar créditos actualizados
                        await loadProfileData();
                    }}
                    userEmail={fullUser.email}
                    onCreditosActualizados={(nuevosCreditos) => {
                        setFullUser(u => ({ ...u, creditosDisponibles: nuevosCreditos }));
                    }}
                />
            )}

            {isEditing ? (
                <ProfileEditForm 
                    initialData={fullUser} 
                    onSave={handleSaveProfile} 
                    onCancel={() => setIsEditing(false)} 
                />
            ) : (
                <div className="profile-grid">

                    {/* COLUMNA IZQUIERDA */}
                    <div className="summary-column">
                        <div className="profile-card glass-card personal-info-card">
                            <div className="profile-header-flex">
                                {fullUser.profileImageUrl ? (
                                    <img src={fullUser.profileImageUrl} alt="Perfil" className="profile-pic-booz" />
                                ) : (
                                    <div className="avatar-placeholder"><FaUserCircle /></div>
                                )}
                                <div className="name-box">
                                    <h2 className="profile-name">{fullUser.nombre} {fullUser.apellido}</h2>
                                    <span className="user-role-badge">MIEMBRO BOOZ</span>
                                </div>
                            </div>

                            <div className="contact-details-mini">
                                <p><FaEnvelope /> {fullUser.email}</p>
                                <p><FaPhone /> {fullUser.telefono || 'Sin teléfono'}</p>
                                <p><FaBirthdayCake /> {fullUser.fechaNacimiento 
                                    ? format(parseISO(fullUser.fechaNacimiento), 'dd MMM yyyy', { locale: es }) 
                                    : 'N/A'}
                                </p>
                            </div>

                            <div className="medical-summary-grid">
                                <p className="card-subtitle-small"><FaStethoscope /> FICHA MÉDICA</p>
                                <div className="med-row">
                                    <span><FaBolt /> {fullUser.tipoSangre || 'N/A'}</span>
                                    <span><FaUserMd /> {fullUser.contactoEmergencia || 'N/A'}</span>
                                </div>
                            </div>

                            <button className="btn-edit-booz" onClick={() => setIsEditing(true)}>
                                <FaEdit /> Editar Perfil
                            </button>
                        </div>

                        <div className="profile-card glass-card membership-card">
                            <h3 className="card-title-accent"><FaCreditCard /> Mi Billetera</h3>
                            <div className="wallet-content">
                                <div className="credits-display">
                                    <p className="amount">${fullUser.creditosDisponibles || 0}</p>
                                    <p className="label">Saldo Disponible (MXN)</p>
                                </div>
                                <button className="btn-action-wallet" onClick={() => setShowTienda(true)}>
                                    Recargar Créditos <FaAngleRight />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="bookings-column">
                        <div className={`profile-card upcoming-card-premium glass-card ${upcomingBooking?.posterUrl ? 'has-poster' : ''}`}>

                            {upcomingBooking?.posterUrl && (
                                <div className="upcoming-hero-image">
                                    <img src={upcomingBooking.posterUrl} alt="Poster" className="poster-img-full" />
                                    <div className="poster-overlay-gradient">
                                        <div className="poster-text-content">
                                            <span className="hero-tag-pill">PRÓXIMA SESIÓN</span>
                                            <h3 className="poster-class-title">{upcomingBooking.nombre}</h3>
                                            <p className="poster-class-meta">
                                                <FaClock /> {format(upcomingBooking.dateTime, "EEEE dd 'de' MMMM · HH:mm 'hrs'", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="upcoming-body">
                                <div className="upcoming-header-info">
                                    <h3 className="card-title-accent"><FaCalendarCheck /> Datos del Evento</h3>
                                    {upcomingBooking && (
                                        <button className="btn-add-calendar" onClick={() => downloadICS(upcomingBooking)}>
                                            <FaCalendarPlus /> Calendario
                                        </button>
                                    )}
                                </div>

                                {upcomingBooking ? (
                                    <div className="upcoming-data-grid">
                                        <div className="data-item full">
                                            <FaClock className="item-icon" />
                                            <div>
                                                <label>Fecha y Hora</label>
                                                <p>{format(upcomingBooking.dateTime, "EEEE dd 'de' MMMM · HH:mm 'hrs'", { locale: es })}</p>
                                            </div>
                                        </div>
                                        <div className="data-item">
                                            <FaBed className="item-icon" />
                                            <div>
                                                <label>Camilla</label>
                                                <p>{upcomingBooking.numeroCamilla || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="data-item">
                                            <FaTicketAlt className="item-icon" />
                                            <div>
                                                <label>Paquete</label>
                                                <p>{upcomingBooking.paqueteId || 'Individual'}</p>
                                            </div>
                                        </div>
                                        <div className="data-item full">
                                            <FaMapMarkerAlt className="item-icon" />
                                            <div>
                                                <label>Ubicación</label>
                                                <p>Booz Studio Central</p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn-cancel-reserva-full"
                                            onClick={() => handleCancelarReserva(upcomingBooking.id, upcomingBooking.fecha)}
                                        >
                                            <FaTimesCircle /> Cancelar Reservación
                                        </button>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No tienes clases programadas actualmente.</p>
                                        <button 
                                            className="btn-action-primary" 
                                            onClick={() => navigate('/cliente/inicio')}
                                        >
                                            Ver Horarios Disponibles
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="profile-card glass-card history-card">
                            <h3 className="card-title-accent">Actividad Reciente</h3>
                            <div className="history-list">
                                {fullUser.reservas
                                    ?.filter(r => isBefore(parseISO(r.fecha), new Date()))
                                    .slice(0, 5)
                                    .map(res => (
                                        <div key={res.id} className="history-item">
                                            <div className="history-dot"></div>
                                            <div className="history-info">
                                                <strong>{res.nombre}</strong>
                                                <span>{format(parseISO(res.fecha), 'dd MMM, HH:mm', { locale: es })}</span>
                                            </div>
                                            <FaCheckCircle className="icon-done" style={{ marginLeft: 'auto', color: '#34C759' }} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}