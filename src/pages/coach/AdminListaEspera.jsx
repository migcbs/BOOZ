import React, { useState, useEffect } from 'react';
import { FaUserClock, FaWhatsapp, FaCheckCircle, FaTrashAlt, FaClock } from 'react-icons/fa';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import './Styles.css';
import authFetch from '../../authFetch';
import CoachLayout from './CoachLayout';
import './CoachLayout.css';

export default function ListaEspera() {
    const [espera, setEspera]   = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLista = async () => {
        setLoading(true);
        try {
            // ✅ authFetch agrega el token JWT
            const res  = await authFetch('/admin/lista-espera');
            const data = await res.json();
            setEspera(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error al cargar lista:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLista(); }, []);

    const liberarLugar = async (item) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Asignar lugar?',
            html: `<p>Se confirmará el lugar de <b>${item.user.nombre}</b> en <b>${item.clase.nombre}</b> y se eliminará de la lista.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8FD9FB',
            confirmButtonText: 'Confirmar lugar',
            cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        try {
            // Crear la reserva para el usuario
            const resReserva = await authFetch('/reservas', {
                method: 'POST',
                body: JSON.stringify({
                    email:     item.user.email,
                    claseId:   item.claseId,
                    metodoPago: 'CORTESIA'
                })
            });

            if (resReserva?.ok) {
                // Eliminar de la lista de espera
                await authFetch(`/admin/lista-espera/${item.id}`, { method: 'DELETE' });
                Swal.fire({ icon: 'success', title: '¡Lugar asignado!', timer: 1500, showConfirmButton: false });
                fetchLista();
            } else {
                const d = await resReserva?.json();
                Swal.fire('Error', d?.message || 'No se pudo asignar el lugar', 'error');
            }
        } catch { Swal.fire('Error', 'Error de conexión', 'error'); }
    };

    const eliminarDeLista = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Eliminar de la lista?',
            text: 'Se perderá el turno de esta alumna.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FC7358',
            confirmButtonText: 'Eliminar'
        });

        if (!isConfirmed) return;

        try {
            await authFetch(`/admin/lista-espera/${id}`, { method: 'DELETE' });
            fetchLista();
        } catch { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    };

    if (loading) return (
        <div className="loader-container-full">
            <div className="spinner-ios" />
            <p style={{ marginTop: 16, color: '#8e8e93', fontWeight: 700 }}>Cargando lista de espera...</p>
        </div>
    );

    return (
        <CoachLayout title="Lista de espera" subtitle="Alumnas esperando un lugar">
            <div className="coach-view-container animate-ios-entry">

            {/* Header */}
            <div style={{ marginBottom: 30 }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0, fontSize: '1.6rem', fontWeight: 300, textTransform: 'uppercase', letterSpacing: -1 }}>
                    <FaUserClock color="#FF9500" size={28} />
                    Lista de <b style={{ fontWeight: 900, color: '#8FD9FB' }}>espera</b>
                </h1>
                <p style={{ color: '#8e8e93', margin: '6px 0 0', fontSize: '0.88rem', fontWeight: 600 }}>
                    {espera.length} alumna{espera.length !== 1 ? 's' : ''} esperando un lugar
                </p>
            </div>

            {/* Lista */}
            {espera.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
                    <FaCheckCircle size={48} color="#34C759" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: '#1d1d1f', margin: '0 0 8px', textTransform: 'uppercase' }}>Todo al día</h3>
                    <p style={{ color: '#8e8e93', fontSize: '0.88rem', margin: 0 }}>
                        No hay alumnas en lista de espera actualmente.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {espera.map((item, idx) => (
                        <div key={item.id} className="glass-card"
                             style={{ padding: '20px 22px', borderLeft: '4px solid #FF9500', animation: `fadeInUp 0.4s ease ${idx * 0.05}s both` }}>
                            <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

                            {/* Info alumna */}
                            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                                <div style={{
                                    width: 46, height: 46, borderRadius: '50%',
                                    background: 'rgba(255,149,0,0.10)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem', fontWeight: 900, color: '#FF9500', flexShrink: 0
                                }}>
                                    {item.user.nombre.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 900, color: '#1d1d1f', fontSize: '0.95rem', textTransform: 'uppercase' }}>
                                        {item.user.nombre} {item.user.apellido}
                                    </p>
                                    <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#8e8e93' }}>{item.user.email}</p>
                                    {item.user.telefono && (
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>📱 {item.user.telefono}</p>
                                    )}
                                </div>
                                {/* Tiempo de espera */}
                                <div style={{
                                    background: 'rgba(255,149,0,0.08)', padding: '4px 10px',
                                    borderRadius: 20, display: 'flex', alignItems: 'center',
                                    gap: 5, flexShrink: 0
                                }}>
                                    <FaClock size={10} color="#FF9500" />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FF9500' }}>
                                        {formatDistanceToNow(parseISO(item.createdAt), { locale: es, addSuffix: true })}
                                    </span>
                                </div>
                            </div>

                            {/* Info clase */}
                            <div style={{
                                background: 'rgba(143,217,251,0.06)', borderRadius: 12,
                                padding: '12px 14px', marginBottom: 14,
                                border: '1px solid rgba(143,217,251,0.15)'
                            }}>
                                <p style={{ margin: 0, fontWeight: 800, color: '#1d1d1f', fontSize: '0.88rem', textTransform: 'uppercase' }}>
                                    {item.clase.nombre}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#8FD9FB', fontWeight: 700 }}>
                                    {format(parseISO(item.clase.fecha), "EEEE dd 'de' MMMM · HH:mm 'hrs'", { locale: es })}
                                </p>
                            </div>

                            {/* Acciones */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                {/* WhatsApp */}
                                {item.user.telefono && (
                                    <a href={`https://wa.me/${item.user.telefono}?text=${encodeURIComponent(`Hola ${item.user.nombre}, te avisamos que hay un lugar disponible en la clase ${item.clase.nombre}. ¿Confirmas tu asistencia?`)}`}
                                       target="_blank" rel="noreferrer"
                                       style={{
                                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                                           width: 42, height: 42, borderRadius: 12,
                                           background: 'rgba(37,211,102,0.1)', color: '#25D366',
                                           textDecoration: 'none', transition: 'all 0.3s ease',
                                           border: '1px solid rgba(37,211,102,0.2)', flexShrink: 0
                                       }}>
                                        <FaWhatsapp size={18} />
                                    </a>
                                )}

                                {/* Asignar lugar */}
                                <button onClick={() => liberarLugar(item)} style={{
                                    flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8FD9FB, #5BC4F5)',
                                    color: '#fff', border: 'none', borderRadius: 12,
                                    fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8, textTransform: 'uppercase',
                                    boxShadow: '0 6px 16px rgba(143,217,251,0.25)'
                                }}>
                                    <FaCheckCircle /> Asignar lugar
                                </button>

                                {/* Eliminar */}
                                <button onClick={() => eliminarDeLista(item.id)} style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: 'rgba(252,115,88,0.08)', color: '#FC7358',
                                    border: '1px solid rgba(252,115,88,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.3s ease'
                                }}>
                                    <FaTrashAlt size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </CoachLayout>
    );
}