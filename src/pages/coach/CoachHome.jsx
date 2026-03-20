import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUserCircle, FaSignOutAlt, FaCalendarAlt, FaUsers,
    FaClock, FaChartBar, FaDumbbell, FaCheckCircle,
    FaWhatsapp, FaUserPlus, FaSearch
} from "react-icons/fa";
import { format, parseISO, isToday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import "./Styles.css";
import authFetch from '../../authFetch';
import CoachLayout from './CoachLayout';
import './CoachLayout.css';

export default function CoachHome() {
    const navigate = useNavigate();
    const [clientes, setClientes]           = useState([]);
    const [clasesHoy, setClasesHoy]         = useState([]);
    const [clasesActivas, setClasesActivas] = useState([]);
    const [espera, setEspera]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [searchTerm, setSearchTerm]       = useState("");
    const [selectedClaseId, setSelectedClaseId] = useState("");

    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('booz_user')) || {}; }
        catch { return {}; }
    })();

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [rc, rk, re] = await Promise.all([
                authFetch('/clases/disponibles'),
                authFetch('/coach/clientes'),
                authFetch('/admin/lista-espera'),
            ]);
            const dc = await rc.json();
            const dk = await rk.json();
            const de = await re.json();

            const clases = Array.isArray(dc) ? dc : [];
            setClasesActivas(clases.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
            setClasesHoy(clases.filter(c => isToday(new Date(c.fecha))));
            setClientes(Array.isArray(dk) ? dk : []);
            setEspera(Array.isArray(de) ? de : []);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("booz_token");
        localStorage.removeItem("booz_user");
        navigate("/login");
    };

    const inscribirAlumnoManual = async (cliente) => {
        if (!selectedClaseId) return Swal.fire('Atención', 'Selecciona la clase destino', 'info');
        try {
            const res = await authFetch('/reservas', {
                method: "POST",
                body: JSON.stringify({ email: cliente.email, claseId: selectedClaseId, metodoPago: 'CORTESIA' })
            });
            if (res?.ok) {
                Swal.fire({ icon: 'success', title: `¡${cliente.nombre} inscrita!`, timer: 1500, showConfirmButton: false });
                refreshData();
            } else {
                const d = await res?.json();
                Swal.fire('Error', d?.message || 'No se pudo inscribir', 'error');
            }
        } catch { Swal.fire('Error', 'Error de conexión', 'error'); }
    };

    const resolverEspera = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Resolver este lugar?', icon: 'question',
            showCancelButton: true, confirmButtonColor: '#8FD9FB', confirmButtonText: 'Confirmar'
        });
        if (!isConfirmed) return;
        try {
            await authFetch(`/admin/lista-espera/${id}`, { method: 'DELETE' });
            refreshData();
        } catch { Swal.fire('Error', 'No se pudo actualizar', 'error'); }
    };

    const clasesEstaSemana = clasesActivas.filter(c =>
        isThisWeek(new Date(c.fecha), { weekStartsOn: 1 })
    );

    const filteredClientes = clientes.filter(c =>
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const quickLinks = [
        { icon: <FaCalendarAlt size={22} />, label: 'Calendario',     sub: `${clasesEstaSemana.length} clases esta semana`, path: '/coach/calendario', color: '#8FD9FB' },
        { icon: <FaUsers size={22} />,       label: 'Alumnas',         sub: `${clientes.length} registradas`,               path: '/coach/clientes',   color: '#A9B090' },
        { icon: <FaClock size={22} />,       label: 'Lista de espera', sub: `${espera.length} esperando`,                  path: '/coach/espera',     color: '#FF9500' },
        { icon: <FaChartBar size={22} />,    label: 'Estadísticas',    sub: 'Ver métricas del estudio',                    path: '/coach/stats',      color: '#AF52DE' },
        { icon: <FaDumbbell size={22} />,    label: 'Temáticas',       sub: 'Planifica el contenido',                      path: '/coach/rutinas',    color: '#34C759' },
    ];

    return (
        <CoachLayout>

            {/* El header lo maneja CoachLayout */}
            <div className="ch-greeting">
                <h1 className="work-title">Hola, <b>{storedUser.nombre || 'Coach'}</b></h1>
                <p style={{ color: '#8e8e93', fontSize: '0.9rem', fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>
                    {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div className="spinner-ios" style={{ borderTopColor: '#8FD9FB' }} />
                    <p style={{ color: '#8e8e93', fontWeight: 700, fontSize: 14 }}>Cargando datos...</p>
                </div>
            ) : (
                <>
                    {/* MÉTRICAS */}
                    <div className="stats-row" style={{ marginBottom: 30 }}>
                        {[
                            { label: 'Clases hoy',      value: clasesHoy.length,                                     color: '#8FD9FB' },
                            { label: 'Esta semana',     value: clasesEstaSemana.length,                              color: '#A9B090' },
                            { label: 'Alumnas activas', value: clientes.filter(c => c.suscripcionActiva).length,     color: '#34C759' },
                            { label: 'En espera',       value: espera.length, color: espera.length > 0 ? '#FF9500' : '#aeaeb2' },
                        ].map(m => (
                            <div key={m.label} className="stat-card glass-card">
                                <span className="stat-label">{m.label}</span>
                                <span className="stat-value" style={{ color: m.color }}>{m.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* ACCESOS RÁPIDOS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 30 }}>
                        {quickLinks.map(link => (
                            <button key={link.path} onClick={() => navigate(link.path)}
                                className="ch-quick-link"
                                style={{ borderLeft: `4px solid ${link.color}` }}>
                                <span style={{ color: link.color }}>{link.icon}</span>
                                <div>
                                    <p className="ch-ql-label">{link.label}</p>
                                    <p className="ch-ql-sub">{link.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="coach-grid">

                        {/* CLASES DE HOY */}
                        <div className="glass-card">
                            <h3 className="card-subtitle">
                                <FaCalendarAlt color="#8FD9FB" /> Clases de hoy
                            </h3>
                            {clasesHoy.length === 0 ? (
                                <p style={{ color: '#8e8e93', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                                    No hay clases programadas para hoy.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {clasesHoy.map(c => {
                                        const pct = Math.round((c.inscritos / Math.max(c.cupoMaximo, 1)) * 100);
                                        return (
                                            <div key={c.id} className="ch-clase-card"
                                                style={{ borderLeftColor: c.color || '#8FD9FB' }}>
                                                {c.imageUrl && (
                                                    <img src={c.imageUrl} alt={c.nombre} className="ch-clase-img" />
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p className="ch-clase-nombre">{c.nombre}</p>
                                                    <p className="ch-clase-meta">
                                                        {format(new Date(c.fecha), 'HH:mm')} hrs
                                                        {c.tematica && ` · ${c.tematica}`}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 900, color: pct >= 100 ? '#FC7358' : '#8FD9FB' }}>
                                                        {c.inscritos}/{c.cupoMaximo}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '0.62rem', color: '#aeaeb2', fontWeight: 700 }}>alumnas</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* LISTA DE ESPERA RÁPIDA */}
                        <div className="glass-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 className="card-subtitle" style={{ margin: 0 }}>
                                    <FaClock color="#FF9500" /> Lista de espera
                                </h3>
                                {espera.length > 0 && (
                                    <button onClick={() => navigate('/coach/espera')}
                                        style={{ background: 'none', border: 'none', color: '#8FD9FB', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
                                        Ver todo →
                                    </button>
                                )}
                            </div>
                            {espera.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <FaCheckCircle size={28} color="#34C759" style={{ marginBottom: 8 }} />
                                    <p style={{ color: '#8e8e93', fontSize: '0.82rem', margin: 0 }}>Sin solicitudes pendientes</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {espera.slice(0, 4).map(item => (
                                        <div key={item.id} className="client-card-mini" style={{ borderLeft: '4px solid #FF9500' }}>
                                            <div className="client-text">
                                                <strong>{item.user.nombre} {item.user.apellido}</strong>
                                                <span>{item.clase.nombre}</span>
                                                <span style={{ color: '#FF9500', fontSize: '10px' }}>
                                                    {format(parseISO(item.clase.fecha), 'eeee dd/MM HH:mm', { locale: es })}
                                                </span>
                                            </div>
                                            <div className="client-btns">
                                                {item.user.telefono && (
                                                    <a href={`https://wa.me/${item.user.telefono}`} target="_blank" rel="noreferrer"
                                                        className="btn-icon-med"
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                        <FaWhatsapp color="#25D366" />
                                                    </a>
                                                )}
                                                <button className="btn-icon-add"
                                                    onClick={() => resolverEspera(item.id)}
                                                    style={{ background: '#FF9500', color: 'white' }}>
                                                    <FaCheckCircle />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* INSCRIPCIÓN MANUAL */}
                        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                            <h3 className="card-subtitle">
                                <FaUserPlus color="#A9B090" /> Inscripción manual rápida
                            </h3>
                            <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                                <select className="coach-input" style={{ flex: 2, marginBottom: 0 }}
                                    value={selectedClaseId} onChange={e => setSelectedClaseId(e.target.value)}>
                                    <option value="">— Selecciona la clase destino —</option>
                                    {clasesActivas.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {format(new Date(c.fecha), 'eeee dd/MM', { locale: es })} · {format(new Date(c.fecha), 'HH:mm')} · {c.nombre}
                                        </option>
                                    ))}
                                </select>
                                <div className="search-box-wrapper" style={{ flex: 1, minWidth: 180 }}>
                                    <FaSearch className="search-icon" />
                                    <input className="coach-input-search" placeholder="Buscar alumna..."
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {filteredClientes.slice(0, 9).map(c => (
                                    <div key={c.id} className="client-card-mini">
                                        <div className="avatar-mini" style={{ fontWeight: 900, fontSize: '1rem', color: '#8FD9FB', background: 'rgba(143,217,251,0.1)' }}>
                                            {c.profileImageUrl ? <img src={c.profileImageUrl} alt="perfil" /> : c.nombre.charAt(0)}
                                        </div>
                                        <div className="client-text">
                                            <strong>{c.nombre} {c.apellido}</strong>
                                            <span className="user-email">{c.email}</span>
                                            <span className={c.creditosDisponibles > 0 ? "plan-active" : "plan-none"}>
                                                {c.creditosDisponibles || 0} créditos
                                            </span>
                                        </div>
                                        <div className="client-btns">
                                            <button className="btn-icon-add" onClick={() => inscribirAlumnoManual(c)}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </CoachLayout>
    );
}