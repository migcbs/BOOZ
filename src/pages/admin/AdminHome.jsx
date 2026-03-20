import React, { useState, useEffect, useCallback } from 'react';
import {
    FaUsers, FaChartLine, FaUserPlus, FaUserShield,
    FaTrashAlt, FaSearch, FaCreditCard, FaCalendarAlt,
    FaWallet, FaCheckCircle, FaFileMedical, FaHistory,
    FaEnvelope, FaSignOutAlt, FaClock, FaTimes, FaSave,
    FaDownload, FaHeartbeat, FaBars, FaUserClock, FaWhatsapp,
    FaEye, FaEyeSlash, FaChevronRight, FaPhone
} from 'react-icons/fa';
import { format, isToday, isThisWeek, isThisMonth, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './Styles.css';
import authFetch from '../../authFetch';
import CoachCalendar from '../coach/CoachCalendar';
import AdminFinanzas from './AdminFinanzas';

// ── TABS ──────────────────────────────────────────────────
const TABS = [
    { id: 'dashboard', label: 'Dashboard',    icon: <FaChartLine />  },
    { id: 'users',     label: 'Alumnas',      icon: <FaUsers />      },
    { id: 'espera',    label: 'Espera',        icon: <FaUserClock />  },
    { id: 'clases',    label: 'Calendario',   icon: <FaCalendarAlt />},
    { id: 'alta',      label: 'Nuevo usuario',icon: <FaUserPlus />   },
    { id: 'staff',     label: 'Equipo',       icon: <FaUserShield /> },
    { id: 'sales',     label: 'Finanzas',     icon: <FaWallet />     },
];

// ── VALIDACIONES ──────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE   = /^[0-9+\-\s()]{7,20}$/;

function validate(form, tipo) {
    const errors = {};
    if (!form.nombre?.trim())   errors.nombre   = 'El nombre es obligatorio';
    if (!form.apellido?.trim()) errors.apellido = 'El apellido es obligatorio';
    if (!form.email?.trim())    errors.email    = 'El email es obligatorio';
    else if (!EMAIL_RE.test(form.email)) errors.email = 'Email inválido';
    if (tipo === 'nuevo') {
        if (!form.password?.trim())     errors.password = 'La contraseña es obligatoria';
        else if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    }
    if (form.telefono && !TEL_RE.test(form.telefono)) errors.telefono = 'Teléfono inválido';
    return errors;
}

// ── CAMPO DE FORMULARIO ───────────────────────────────────
function Field({ label, error, children }) {
    return (
        <div className="adm-field">
            <label>{label}</label>
            {children}
            {error && <span className="adm-field-error">{error}</span>}
        </div>
    );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export default function AdminHome() {
    const navigate = useNavigate();

    // Data
    const [allUsers,   setAllUsers]   = useState([]);
    const [allClases,  setAllClases]  = useState([]);
    const [espera,     setEspera]     = useState([]);
    const [salesStats, setSalesStats] = useState({ LMV: 0, MJ: 0, SUELTA: 0, totalIngresos: 0 });
    const [loading,    setLoading]    = useState(true);

    // UI
    const [activeTab,    setActiveTab]    = useState('dashboard');
    const [searchTerm,   setSearchTerm]   = useState('');
    const [sidebarOpen,  setSidebarOpen]  = useState(false);
    const [filterActivo, setFilterActivo] = useState('todos'); // todos | activos | inactivos | lesiones

    // Panel lateral expediente
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm,     setEditForm]     = useState(null);
    const [editErrors,   setEditErrors]   = useState({});
    const [saving,       setSaving]       = useState(false);

    // Formulario alta de usuario
    const [altaForm,   setAltaForm]   = useState({ nombre: '', apellido: '', email: '', password: '', telefono: '', instagram: '', role: 'cliente', lesiones: '', alergias: '', tipoSangre: '' });
    const [altaErrors, setAltaErrors] = useState({});
    const [altaSaving, setAltaSaving] = useState(false);
    const [showPass,   setShowPass]   = useState(false);

    const storedAdmin = (() => { try { return JSON.parse(localStorage.getItem('booz_user')) || {}; } catch { return {}; } })();

    // ── Carga de datos ──
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [ru, rs, rc, re] = await Promise.all([
                authFetch('/admin/usuarios-sistema'),
                authFetch('/admin/stats-ventas'),
                authFetch('/clases/disponibles'),
                authFetch('/admin/lista-espera'),
            ]);
            const [du, ds, dc, de] = await Promise.all([ru.json(), rs.json(), rc.json(), re.json()]);
            setAllUsers(Array.isArray(du)  ? du  : []);
            setAllClases(Array.isArray(dc) ? dc  : []);
            setEspera(Array.isArray(de)    ? de  : []);
            setSalesStats(ds && typeof ds === 'object' ? ds : { LMV: 0, MJ: 0, SUELTA: 0, totalIngresos: 0 });
        } catch (err) { console.error('Admin load error:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Logout ──
    const handleLogout = () => {
        localStorage.removeItem('booz_token');
        localStorage.removeItem('booz_user');
        navigate('/login');
    };

    // ── Abrir expediente ──
    const openExpediente = (user) => {
        setSelectedUser(user);
        setEditForm({ ...user });
        setEditErrors({});
    };

    // ── Guardar expediente ──
    const handleSaveExpediente = async () => {
        const errs = {};
        if (!editForm.nombre?.trim())   errs.nombre   = 'Obligatorio';
        if (!editForm.apellido?.trim()) errs.apellido = 'Obligatorio';
        if (editForm.telefono && !TEL_RE.test(editForm.telefono)) errs.telefono = 'Inválido';
        if (Object.keys(errs).length) { setEditErrors(errs); return; }
        setSaving(true);
        try {
            const res = await authFetch(`/coach/update-expediente/${editForm.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nombre: editForm.nombre, apellido: editForm.apellido,
                    telefono: editForm.telefono, instagram: editForm.instagram,
                    creditosDisponibles: editForm.creditosDisponibles,
                    suscripcionActiva: editForm.suscripcionActiva,
                    lesiones: editForm.lesiones, alergias: editForm.alergias,
                    tipoSangre: editForm.tipoSangre,
                    contactoEmergencia: editForm.contactoEmergencia,
                })
            });
            if (res?.ok) {
                Swal.fire({ icon: 'success', title: '¡Actualizado!', timer: 1200, showConfirmButton: false });
                setSelectedUser(null);
                loadData();
            } else {
                const d = await res?.json();
                Swal.fire('Error', d?.error || 'No se pudo actualizar', 'error');
            }
        } catch { Swal.fire('Error', 'Error de conexión', 'error'); }
        finally { setSaving(false); }
    };

    // ── Eliminar usuario ──
    const handleDeleteUser = async (id, nombre) => {
        const { isConfirmed } = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: 'Se borrarán sus reservas y cuenta permanentemente.',
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#FF3B30', confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!isConfirmed) return;
        try {
            const res = await authFetch(`/coach/clientes/${id}`, { method: 'DELETE' });
            if (res?.ok) {
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
                setSelectedUser(null);
                loadData();
            }
        } catch { Swal.fire('Error', '', 'error'); }
    };

    // ── Resolver lista de espera ──
    const handleResolverEspera = async (item) => {
        const { isConfirmed } = await Swal.fire({
            title: `¿Asignar lugar a ${item.user.nombre}?`,
            html: `<p>Clase: <b>${item.clase.nombre}</b></p>`,
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#8FD9FB', confirmButtonText: 'Asignar lugar'
        });
        if (!isConfirmed) return;
        try {
            const resReserva = await authFetch('/reservas', {
                method: 'POST',
                body: JSON.stringify({ email: item.user.email, claseId: item.claseId, metodoPago: 'CORTESIA' })
            });
            if (resReserva?.ok) {
                await authFetch(`/admin/lista-espera/${item.id}`, { method: 'DELETE' });
                Swal.fire({ icon: 'success', title: '¡Lugar asignado!', timer: 1500, showConfirmButton: false });
                loadData();
            } else {
                const d = await resReserva?.json();
                Swal.fire('Error', d?.message || 'No se pudo asignar', 'error');
            }
        } catch { Swal.fire('Error', 'Error de conexión', 'error'); }
    };

    const handleEliminarEspera = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Eliminar de la lista?', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#FC7358', confirmButtonText: 'Eliminar'
        });
        if (!isConfirmed) return;
        try {
            await authFetch(`/admin/lista-espera/${id}`, { method: 'DELETE' });
            loadData();
        } catch { Swal.fire('Error', '', 'error'); }
    };

    // ── Alta de usuario ──
    const handleAltaUsuario = async (e) => {
        e.preventDefault();
        const errs = validate(altaForm, 'nuevo');
        if (Object.keys(errs).length) { setAltaErrors(errs); return; }
        setAltaSaving(true);
        try {
            const endpoint = altaForm.role === 'cliente' ? '/signup' : '/signup';
            const res = await authFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(altaForm)
            });
            if (res?.ok) {
                Swal.fire({ icon: 'success', title: `¡${altaForm.role === 'cliente' ? 'Alumna' : 'Staff'} registrada!`, timer: 1800, showConfirmButton: false });
                setAltaForm({ nombre: '', apellido: '', email: '', password: '', telefono: '', instagram: '', role: 'cliente', lesiones: '', alergias: '', tipoSangre: '' });
                setAltaErrors({});
                loadData();
            } else {
                const d = await res?.json();
                Swal.fire('Error', d?.error || d?.message || 'No se pudo crear el usuario', 'error');
            }
        } catch { Swal.fire('Error', 'Error de conexión', 'error'); }
        finally { setAltaSaving(false); }
    };

    // ── Exportar CSV ──
    const exportCSV = () => {
        const headers = ['Nombre','Apellido','Email','Teléfono','Plan','Créditos','Suscripción','Lesiones'];
        const rows = clientes.map(u => [
            u.nombre, u.apellido, u.email, u.telefono || '',
            u.planNombre || 'Regular', u.creditosDisponibles || 0,
            u.suscripcionActiva ? 'Activa' : 'Inactiva',
            u.lesiones ? `"${u.lesiones}"` : ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `booz-alumnas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Datos derivados ──
    const clientes      = allUsers.filter(u => u.role === 'cliente');
    const staff         = allUsers.filter(u => u.role === 'coach' || u.role === 'admin');
    const activas       = clientes.filter(u => u.suscripcionActiva);
    const clasesHoy     = allClases.filter(c => { try { return isToday(new Date(c.fecha)); } catch { return false; } });
    const clasesSemana  = allClases.filter(c => { try { return isThisWeek(new Date(c.fecha), { weekStartsOn: 1 }); } catch { return false; } });
    const ocupacionProm = allClases.length > 0
        ? Math.round(allClases.reduce((s, c) => s + (c.inscritos / Math.max(c.cupoMaximo, 1)), 0) / allClases.length * 100) : 0;

    const filteredUsers = clientes.filter(u => {
        const q = `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase();
        const matchSearch = q.includes(searchTerm.toLowerCase());
        if (filterActivo === 'activos')   return matchSearch && u.suscripcionActiva;
        if (filterActivo === 'inactivos') return matchSearch && !u.suscripcionActiva;
        if (filterActivo === 'lesiones')  return matchSearch && u.lesiones;
        return matchSearch;
    });

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #f2f2f7', borderTop: '3px solid #8FD9FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#8e8e93', fontWeight: 700, fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>Cargando Booz Admin...</p>
        </div>
    );

    return (
        <div className="adm-wrapper">

            {/* ── SIDEBAR ── */}
            <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="adm-sidebar-top">
                    <div className="adm-logo">
                        <span className="adm-logo-b">B</span>
                        <div>
                            <p className="adm-logo-title">BOOZ</p>
                            <p className="adm-logo-sub">Admin Panel</p>
                        </div>
                    </div>
                    <nav className="adm-nav">
                        {TABS.map(t => (
                            <button key={t.id}
                                className={`adm-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                                onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}>
                                {t.icon}
                                <span>{t.label}</span>
                                {t.id === 'espera' && espera.length > 0 && (
                                    <span className="adm-nav-badge">{espera.length}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="adm-sidebar-bottom">
                    <div className="adm-admin-info">
                        <div className="adm-admin-avatar">{storedAdmin.nombre?.charAt(0) || 'A'}</div>
                        <div>
                            <p className="adm-admin-name">{storedAdmin.nombre || 'Admin'}</p>
                            <p className="adm-admin-role">Administrador</p>
                        </div>
                    </div>
                    <button className="adm-logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt /> <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* ── MAIN ── */}
            <main className="adm-main">

                {/* Topbar */}
                <div className="adm-topbar">
                    <button className="adm-hamburger" onClick={() => setSidebarOpen(o => !o)}><FaBars /></button>
                    <div className="adm-topbar-search">
                        <FaSearch />
                        <input placeholder="Buscar alumnas, clases..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {searchTerm && <button onClick={() => setSearchTerm('')}><FaTimes /></button>}
                    </div>
                    <p className="adm-topbar-date">{format(new Date(), "EEEE dd MMM", { locale: es })}</p>
                </div>

                {/* ══════════════════════════════════════
                    TAB: DASHBOARD
                ══════════════════════════════════════ */}
                {activeTab === 'dashboard' && (
                    <div className="adm-content animate-ios-entry">
                        <h1 className="adm-page-title">Resumen ejecutivo</h1>

                        <div className="adm-metrics">
                            {[
                                { label: 'Alumnas',      value: clientes.length,     color: '#8FD9FB', sub: `${activas.length} activas`         },
                                { label: 'Clases hoy',   value: clasesHoy.length,    color: '#A9B090', sub: `${clasesSemana.length} esta semana` },
                                { label: 'En espera',    value: espera.length,       color: espera.length > 0 ? '#FF9500' : '#aeaeb2', sub: espera.length > 0 ? 'Requieren atención' : 'Todo al día' },
                                { label: 'Ocupación',    value: `${ocupacionProm}%`, color: ocupacionProm > 70 ? '#34C759' : '#FF9500', sub: 'Promedio general' },
                                { label: 'Ingresos est.', value: `$${(salesStats.totalIngresos || 0).toLocaleString()}`, color: '#8FD9FB', sub: 'Total estimado' },
                            ].map(m => (
                                <div key={m.label} className="adm-metric-card">
                                    <span className="adm-metric-label">{m.label}</span>
                                    <span className="adm-metric-value" style={{ color: m.color }}>{m.value}</span>
                                    <span className="adm-metric-sub">{m.sub}</span>
                                </div>
                            ))}
                        </div>

                        <div className="adm-grid2">
                            {/* Lista de espera rápida */}
                            <div className="adm-card">
                                <div className="adm-card-header">
                                    <h3><FaUserClock color="#FF9500" /> Solicitudes en espera</h3>
                                    {espera.length > 0 && <span className="adm-badge-orange">{espera.length}</span>}
                                </div>
                                {espera.length === 0 ? (
                                    <div className="adm-empty"><FaCheckCircle size={28} color="#34C759" /><p>Sin solicitudes pendientes</p></div>
                                ) : espera.slice(0, 4).map(item => (
                                    <div key={item.id} className="adm-espera-row">
                                        <div className="adm-espera-avatar">{item.user.nombre.charAt(0)}</div>
                                        <div className="adm-espera-info">
                                            <strong>{item.user.nombre} {item.user.apellido}</strong>
                                            <span>{item.clase.nombre}</span>
                                        </div>
                                        <div className="adm-espera-actions">
                                            {item.user.telefono && (
                                                <a href={`https://wa.me/${item.user.telefono}`} target="_blank" rel="noreferrer" className="adm-icon-btn green"><FaWhatsapp /></a>
                                            )}
                                            <button className="adm-icon-btn blue" onClick={() => handleResolverEspera(item)}><FaCheckCircle /></button>
                                        </div>
                                    </div>
                                ))}
                                {espera.length > 4 && (
                                    <button className="adm-ver-todo" onClick={() => setActiveTab('espera')}>
                                        Ver todos ({espera.length}) <FaChevronRight />
                                    </button>
                                )}
                            </div>

                            {/* Últimos registros */}
                            <div className="adm-card">
                                <div className="adm-card-header">
                                    <h3><FaHistory color="#A9B090" /> Últimos registros</h3>
                                </div>
                                {allUsers.slice(-5).reverse().map((u, i) => (
                                    <div key={i} className="adm-espera-row" style={{ cursor: 'pointer' }} onClick={() => openExpediente(u)}>
                                        <div className="adm-espera-avatar" style={{ background: u.suscripcionActiva ? 'rgba(143,217,251,0.12)' : '#f2f2f7', color: u.suscripcionActiva ? '#8FD9FB' : '#aeaeb2' }}>
                                            {u.nombre?.charAt(0)}
                                        </div>
                                        <div className="adm-espera-info">
                                            <strong>{u.nombre} {u.apellido}</strong>
                                            <span>{u.email}</span>
                                        </div>
                                        <span className={`adm-status-pill ${u.suscripcionActiva ? 'active' : 'inactive'}`}>
                                            {u.suscripcionActiva ? 'Activa' : 'Sin plan'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Clases de hoy */}
                            <div className="adm-card" style={{ gridColumn: '1 / -1' }}>
                                <div className="adm-card-header">
                                    <h3><FaCalendarAlt color="#8FD9FB" /> Clases de hoy</h3>
                                    <button className="adm-ver-todo" onClick={() => setActiveTab('clases')}>Ver calendario <FaChevronRight /></button>
                                </div>
                                {clasesHoy.length === 0 ? (
                                    <p style={{ color: '#8e8e93', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No hay clases programadas para hoy.</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                        {clasesHoy.map(c => {
                                            const pct = Math.round((c.inscritos / Math.max(c.cupoMaximo, 1)) * 100);
                                            return (
                                                <div key={c.id} className="adm-clase-chip" style={{ borderLeftColor: c.color || '#8FD9FB' }}>
                                                    {c.imageUrl && <img src={c.imageUrl} alt={c.nombre} className="adm-clase-chip-img" />}
                                                    <div style={{ flex: 1 }}>
                                                        <p className="adm-clase-chip-nombre">{c.nombre}</p>
                                                        <p className="adm-clase-chip-hora">{format(new Date(c.fecha), 'HH:mm')} hrs</p>
                                                    </div>
                                                    <div className="adm-clase-chip-cupo" style={{ color: pct >= 100 ? '#FC7358' : '#8FD9FB' }}>
                                                        {c.inscritos}/{c.cupoMaximo}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: ALUMNAS
                ══════════════════════════════════════ */}
                {activeTab === 'users' && (
                    <div className="adm-content animate-ios-entry" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="adm-page-header">
                                <div>
                                    <h1 className="adm-page-title">Directorio Booz</h1>
                                    <p className="adm-page-sub">{filteredUsers.length} alumnas</p>
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {/* Filtros */}
                                    <div className="adm-filter-pills">
                                        {[
                                            { id: 'todos',    label: 'Todas'    },
                                            { id: 'activos',  label: 'Activas'  },
                                            { id: 'inactivos',label: 'Sin plan' },
                                            { id: 'lesiones', label: 'Lesiones' },
                                        ].map(f => (
                                            <button key={f.id} className={filterActivo === f.id ? 'active' : ''} onClick={() => setFilterActivo(f.id)}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="adm-btn-export" onClick={exportCSV}><FaDownload /> CSV</button>
                                    <button className="adm-btn-primary-sm" onClick={() => setActiveTab('alta')}>
                                        <FaUserPlus /> Nueva alumna
                                    </button>
                                </div>
                            </div>

                            <div className="adm-table-card">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Alumna</th>
                                            <th>Teléfono</th>
                                            <th>Plan</th>
                                            <th>Créditos</th>
                                            <th>Salud</th>
                                            <th>Espera</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#8e8e93' }}>No se encontraron alumnas</td></tr>
                                        ) : filteredUsers.map(user => {
                                            const waiting = espera.find(e => e.userId === user.id);
                                            const pct = Math.min(100, ((user.creditosDisponibles || 0) / 20) * 100);
                                            return (
                                                <tr key={user.id} onClick={() => openExpediente(user)}>
                                                    <td data-label="Alumna">
                                                        <div className="adm-user-cell">
                                                            <div className="adm-avatar" style={{ background: user.suscripcionActiva ? 'rgba(143,217,251,0.12)' : '#f2f2f7', color: user.suscripcionActiva ? '#8FD9FB' : '#aeaeb2' }}>
                                                                {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" /> : user.nombre?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="adm-user-name">{user.nombre} {user.apellido}</p>
                                                                <p className="adm-user-email">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td data-label="Teléfono" className="adm-td-muted">{user.telefono || '—'}</td>
                                                    <td data-label="Plan">
                                                        <span className={`adm-status-pill ${user.suscripcionActiva ? 'active' : 'inactive'}`}>
                                                            {user.planNombre || (user.suscripcionActiva ? 'Activo' : 'Sin plan')}
                                                        </span>
                                                    </td>
                                                    <td data-label="Créditos">
                                                        <div className="adm-credits-cell">
                                                            <span>{user.creditosDisponibles || 0}</span>
                                                            <div className="adm-credits-bar">
                                                                <div style={{ width: `${pct}%`, background: '#8FD9FB', height: '100%', borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td data-label="Salud">
                                                        <div className={`adm-health-dot ${user.lesiones ? 'alert' : 'ok'}`} title={user.lesiones || 'Sin lesiones'}>
                                                            <FaHeartbeat />
                                                        </div>
                                                    </td>
                                                    <td data-label="Espera">
                                                        {waiting
                                                            ? <span className="adm-waiting-tag"><FaClock size={9} /> {waiting.clase.nombre}</span>
                                                            : <span style={{ color: '#e5e5ea' }}>—</span>}
                                                    </td>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <button className="adm-icon-btn red" onClick={() => handleDeleteUser(user.id, user.nombre)}><FaTrashAlt /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Panel lateral expediente */}
                        {selectedUser && editForm && (
                            <div className="adm-side-panel">
                                <div className="adm-panel-header">
                                    <h3>Expediente</h3>
                                    <button className="adm-panel-close" onClick={() => setSelectedUser(null)}><FaTimes /></button>
                                </div>
                                <div className="adm-panel-avatar">
                                    <div className="adm-panel-av-circle">
                                        {selectedUser.profileImageUrl ? <img src={selectedUser.profileImageUrl} alt="" /> : selectedUser.nombre?.charAt(0)}
                                    </div>
                                    <p className="adm-panel-name">{editForm.nombre} {editForm.apellido}</p>
                                    <p className="adm-panel-email">{selectedUser.email}</p>
                                </div>
                                {[
                                    { label: 'Nombre',    key: 'nombre'    },
                                    { label: 'Apellido',  key: 'apellido'  },
                                    { label: 'Teléfono',  key: 'telefono'  },
                                    { label: 'Instagram', key: 'instagram' },
                                    { label: 'Tipo sangre', key: 'tipoSangre' },
                                    { label: 'Contacto emergencia', key: 'contactoEmergencia' },
                                ].map(({ label, key }) => (
                                    <div key={key} className="adm-panel-field">
                                        <label>{label}</label>
                                        <input value={editForm[key] || ''}
                                            onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                                        {editErrors[key] && <span className="adm-field-error">{editErrors[key]}</span>}
                                    </div>
                                ))}
                                <div className="adm-panel-field">
                                    <label>Créditos disponibles</label>
                                    <input type="number" min={0} value={editForm.creditosDisponibles || 0}
                                        onChange={e => setEditForm(f => ({ ...f, creditosDisponibles: parseInt(e.target.value) || 0 }))} />
                                </div>
                                <div className="adm-panel-field">
                                    <label>Suscripción</label>
                                    <select value={String(editForm.suscripcionActiva)}
                                        onChange={e => setEditForm(f => ({ ...f, suscripcionActiva: e.target.value === 'true' }))}>
                                        <option value="true">Activa</option>
                                        <option value="false">Inactiva</option>
                                    </select>
                                </div>
                                <div className="adm-panel-field">
                                    <label style={{ color: '#FC7358' }}>⚠ Lesiones / condiciones</label>
                                    <textarea value={editForm.lesiones || ''}
                                        onChange={e => setEditForm(f => ({ ...f, lesiones: e.target.value }))} />
                                </div>
                                <div className="adm-panel-field">
                                    <label>Alergias</label>
                                    <textarea value={editForm.alergias || ''}
                                        onChange={e => setEditForm(f => ({ ...f, alergias: e.target.value }))} />
                                </div>
                                <div className="adm-panel-actions">
                                    <button className="adm-btn-submit" style={{ flex: 2 }} onClick={handleSaveExpediente} disabled={saving}>
                                        <FaSave /> {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                    <button className="adm-btn-delete" onClick={() => handleDeleteUser(selectedUser.id, selectedUser.nombre)}>
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: LISTA DE ESPERA
                ══════════════════════════════════════ */}
                {activeTab === 'espera' && (
                    <div className="adm-content animate-ios-entry">
                        <div className="adm-page-header">
                            <div>
                                <h1 className="adm-page-title">Lista de espera</h1>
                                <p className="adm-page-sub">{espera.length} alumna{espera.length !== 1 ? 's' : ''} esperando</p>
                            </div>
                        </div>
                        {espera.length === 0 ? (
                            <div className="adm-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
                                <FaCheckCircle size={48} color="#34C759" style={{ marginBottom: 16 }} />
                                <h3 style={{ textTransform: 'uppercase', color: '#1d1d1f', marginBottom: 8 }}>Todo al día</h3>
                                <p style={{ color: '#8e8e93', fontSize: '0.85rem' }}>No hay alumnas en lista de espera actualmente.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                                {espera.map((item, idx) => (
                                    <div key={item.id} className="adm-card" style={{ padding: '20px 22px', borderLeft: '4px solid #FF9500' }}>
                                        {/* Info alumna */}
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                                            <div className="adm-espera-avatar" style={{ background: 'rgba(255,149,0,0.10)', color: '#FF9500', fontSize: '1.1rem', width: 44, height: 44, borderRadius: '50%' }}>
                                                {item.user.nombre.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', color: '#1d1d1f' }}>
                                                    {item.user.nombre} {item.user.apellido}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#8e8e93' }}>{item.user.email}</p>
                                                {item.user.telefono && <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#555' }}><FaPhone size={10} style={{ marginRight: 4 }} />{item.user.telefono}</p>}
                                            </div>
                                            {item.createdAt && (
                                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.08)', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
                                                    {formatDistanceToNow(parseISO(item.createdAt), { locale: es, addSuffix: true })}
                                                </span>
                                            )}
                                        </div>
                                        {/* Info clase */}
                                        <div style={{ background: 'rgba(143,217,251,0.06)', borderRadius: 12, padding: '11px 14px', marginBottom: 14, border: '1px solid rgba(143,217,251,0.15)' }}>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', color: '#1d1d1f' }}>{item.clase.nombre}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#8FD9FB', fontWeight: 700 }}>
                                                {format(parseISO(item.clase.fecha), "EEEE dd 'de' MMMM · HH:mm 'hrs'", { locale: es })}
                                            </p>
                                        </div>
                                        {/* Acciones */}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {item.user.telefono && (
                                                <a href={`https://wa.me/${item.user.telefono}?text=${encodeURIComponent(`Hola ${item.user.nombre}, te avisamos que hay un lugar disponible en ${item.clase.nombre}. ¿Confirmas?`)}`}
                                                    target="_blank" rel="noreferrer" className="adm-icon-btn green" style={{ width: 42, height: 42, borderRadius: 12 }}>
                                                    <FaWhatsapp size={16} />
                                                </a>
                                            )}
                                            <button onClick={() => handleResolverEspera(item)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8FD9FB, #5BC4F5)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', boxShadow: '0 6px 16px rgba(143,217,251,0.25)' }}>
                                                <FaCheckCircle /> Asignar lugar
                                            </button>
                                            <button onClick={() => handleEliminarEspera(item.id)} className="adm-icon-btn red" style={{ width: 42, height: 42, borderRadius: 12 }}>
                                                <FaTrashAlt size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: CALENDARIO
                ══════════════════════════════════════ */}
                {activeTab === 'clases' && (
                    <div className="adm-content animate-ios-entry" style={{ padding: 0 }}>
                        <CoachCalendar embedded={true} />
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: ALTA DE USUARIO
                ══════════════════════════════════════ */}
                {activeTab === 'alta' && (
                    <div className="adm-content animate-ios-entry">
                        <h1 className="adm-page-title">Dar de alta</h1>

                        {/* Toggle tipo */}
                        <div className="adm-type-toggle" style={{ maxWidth: 400, marginBottom: 28 }}>
                            <button className={altaForm.role === 'cliente' ? 'active' : ''} onClick={() => setAltaForm(f => ({ ...f, role: 'cliente' }))}>
                                <FaUsers style={{ marginRight: 6 }} /> Alumna / cliente
                            </button>
                            <button className={altaForm.role !== 'cliente' ? 'active' : ''} onClick={() => setAltaForm(f => ({ ...f, role: 'coach' }))}>
                                <FaUserShield style={{ marginRight: 6 }} /> Staff / coach
                            </button>
                        </div>

                        <div className="adm-grid2" style={{ alignItems: 'start' }}>
                            {/* Formulario */}
                            <div className="adm-card">
                                <h3 style={{ marginBottom: 20, fontSize: '0.88rem', fontWeight: 900, textTransform: 'uppercase', color: '#8FD9FB' }}>
                                    Datos {altaForm.role === 'cliente' ? 'de la alumna' : 'del colaborador'}
                                </h3>
                                <form className="adm-form" onSubmit={handleAltaUsuario} noValidate>

                                    <div className="adm-field-row">
                                        <Field label="Nombre *" error={altaErrors.nombre}>
                                            <input value={altaForm.nombre}
                                                onChange={e => setAltaForm(f => ({ ...f, nombre: e.target.value }))}
                                                onBlur={() => {
                                                    if (!altaForm.nombre.trim()) setAltaErrors(e => ({ ...e, nombre: 'Obligatorio' }));
                                                    else setAltaErrors(e => { const n = { ...e }; delete n.nombre; return n; });
                                                }}
                                                className={altaErrors.nombre ? 'error' : ''}
                                                placeholder="Ej: Sofía" />
                                        </Field>
                                        <Field label="Apellido *" error={altaErrors.apellido}>
                                            <input value={altaForm.apellido}
                                                onChange={e => setAltaForm(f => ({ ...f, apellido: e.target.value }))}
                                                onBlur={() => {
                                                    if (!altaForm.apellido.trim()) setAltaErrors(e => ({ ...e, apellido: 'Obligatorio' }));
                                                    else setAltaErrors(e => { const n = { ...e }; delete n.apellido; return n; });
                                                }}
                                                className={altaErrors.apellido ? 'error' : ''}
                                                placeholder="Ej: Martínez" />
                                        </Field>
                                    </div>

                                    <Field label="Email *" error={altaErrors.email}>
                                        <input type="email" value={altaForm.email}
                                            onChange={e => setAltaForm(f => ({ ...f, email: e.target.value }))}
                                            onBlur={() => {
                                                if (!altaForm.email.trim()) setAltaErrors(e => ({ ...e, email: 'Obligatorio' }));
                                                else if (!EMAIL_RE.test(altaForm.email)) setAltaErrors(e => ({ ...e, email: 'Email inválido' }));
                                                else setAltaErrors(e => { const n = { ...e }; delete n.email; return n; });
                                            }}
                                            className={altaErrors.email ? 'error' : ''}
                                            placeholder="ejemplo@correo.com" />
                                    </Field>

                                    <Field label="Contraseña * (mín. 6 caracteres)" error={altaErrors.password}>
                                        <div className="adm-pass-wrapper">
                                            <input type={showPass ? 'text' : 'password'} value={altaForm.password}
                                                onChange={e => setAltaForm(f => ({ ...f, password: e.target.value }))}
                                                onBlur={() => {
                                                    if (!altaForm.password) setAltaErrors(e => ({ ...e, password: 'Obligatorio' }));
                                                    else if (altaForm.password.length < 6) setAltaErrors(e => ({ ...e, password: 'Mínimo 6 caracteres' }));
                                                    else setAltaErrors(e => { const n = { ...e }; delete n.password; return n; });
                                                }}
                                                className={altaErrors.password ? 'error' : ''}
                                                placeholder="••••••••" />
                                            <button type="button" className="adm-pass-toggle" onClick={() => setShowPass(s => !s)}>
                                                {showPass ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </Field>

                                    <div className="adm-field-row">
                                        <Field label="Teléfono" error={altaErrors.telefono}>
                                            <input value={altaForm.telefono}
                                                onChange={e => setAltaForm(f => ({ ...f, telefono: e.target.value }))}
                                                onBlur={() => {
                                                    if (altaForm.telefono && !TEL_RE.test(altaForm.telefono)) setAltaErrors(e => ({ ...e, telefono: 'Inválido' }));
                                                    else setAltaErrors(e => { const n = { ...e }; delete n.telefono; return n; });
                                                }}
                                                className={altaErrors.telefono ? 'error' : ''}
                                                placeholder="+52 222 123 4567" />
                                        </Field>
                                        <Field label="Instagram">
                                            <input value={altaForm.instagram}
                                                onChange={e => setAltaForm(f => ({ ...f, instagram: e.target.value }))}
                                                placeholder="@usuario" />
                                        </Field>
                                    </div>

                                    {altaForm.role !== 'cliente' && (
                                        <Field label="Rol">
                                            <select value={altaForm.role} onChange={e => setAltaForm(f => ({ ...f, role: e.target.value }))}>
                                                <option value="coach">Coach</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </Field>
                                    )}

                                    {altaForm.role === 'cliente' && (
                                        <>
                                            <div className="adm-field-row">
                                                <Field label="Tipo de sangre">
                                                    <select value={altaForm.tipoSangre} onChange={e => setAltaForm(f => ({ ...f, tipoSangre: e.target.value }))}>
                                                        <option value="">No especificado</option>
                                                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </Field>
                                                <Field label="Contacto emergencia">
                                                    <input value={altaForm.contactoEmergencia || ''}
                                                        onChange={e => setAltaForm(f => ({ ...f, contactoEmergencia: e.target.value }))}
                                                        placeholder="Nombre y teléfono" />
                                                </Field>
                                            </div>
                                            <Field label="Lesiones / condiciones médicas">
                                                <textarea value={altaForm.lesiones}
                                                    onChange={e => setAltaForm(f => ({ ...f, lesiones: e.target.value }))}
                                                    placeholder="Describe lesiones, operaciones recientes, condiciones relevantes..." />
                                            </Field>
                                            <Field label="Alergias">
                                                <textarea value={altaForm.alergias}
                                                    onChange={e => setAltaForm(f => ({ ...f, alergias: e.target.value }))}
                                                    placeholder="Medicamentos, materiales, alimentos..." />
                                            </Field>
                                        </>
                                    )}

                                    {/* Resumen de errores */}
                                    {Object.keys(altaErrors).length > 0 && (
                                        <div className="adm-errors-summary">
                                            {Object.values(altaErrors).map((e, i) => <p key={i}>• {e}</p>)}
                                        </div>
                                    )}

                                    <button type="submit" className="adm-btn-submit" disabled={altaSaving}>
                                        <FaUserPlus />
                                        {altaSaving ? 'Registrando...' : `Dar de alta ${altaForm.role === 'cliente' ? 'alumna' : altaForm.role}`}
                                    </button>
                                </form>
                            </div>

                            {/* Info lateral */}
                            <div className="adm-card">
                                <h3 style={{ marginBottom: 16, fontSize: '0.88rem', fontWeight: 900, textTransform: 'uppercase', color: '#1d1d1f' }}>
                                    Equipo actual
                                </h3>
                                {staff.map(s => (
                                    <div key={s.id} className="adm-espera-row">
                                        <div className="adm-avatar" style={{ background: s.role === 'admin' ? 'rgba(143,217,251,0.12)' : 'rgba(169,176,144,0.12)', color: s.role === 'admin' ? '#8FD9FB' : '#A9B090' }}>
                                            {s.nombre?.charAt(0)}
                                        </div>
                                        <div className="adm-espera-info">
                                            <strong>{s.nombre} {s.apellido}</strong>
                                            <span style={{ color: s.role === 'admin' ? '#8FD9FB' : '#A9B090', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>{s.role}</span>
                                        </div>
                                        <a href={`mailto:${s.email}`} className="adm-icon-btn" style={{ background: '#f7f8fa', color: '#555' }}><FaEnvelope /></a>
                                    </div>
                                ))}
                                <div style={{ marginTop: 20, padding: '14px', background: 'rgba(143,217,251,0.05)', borderRadius: 14, border: '1px dashed rgba(143,217,251,0.3)' }}>
                                    <p style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, lineHeight: 1.6 }}>
                                        Los usuarios reciben su acceso inmediatamente con el email y contraseña que registres aquí.
                                        Las alumnas pueden cambiar su contraseña desde su perfil.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: EQUIPO
                ══════════════════════════════════════ */}
                {activeTab === 'staff' && (
                    <div className="adm-content animate-ios-entry">
                        <div className="adm-page-header">
                            <h1 className="adm-page-title">Equipo Booz</h1>
                            <button className="adm-btn-primary-sm" onClick={() => setActiveTab('alta')}>
                                <FaUserPlus /> Añadir staff
                            </button>
                        </div>
                        <div className="adm-table-card">
                            <table className="adm-table">
                                <thead>
                                    <tr><th>Colaborador</th><th>Rol</th><th>Email</th><th>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    {staff.length === 0 ? (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#8e8e93' }}>No hay staff registrado</td></tr>
                                    ) : staff.map(s => (
                                        <tr key={s.id}>
                                            <td data-label="Colaborador">
                                                <div className="adm-user-cell">
                                                    <div className="adm-avatar" style={{ background: s.role === 'admin' ? 'rgba(143,217,251,0.12)' : 'rgba(169,176,144,0.12)', color: s.role === 'admin' ? '#8FD9FB' : '#A9B090' }}>
                                                        {s.nombre?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="adm-user-name">{s.nombre} {s.apellido}</p>
                                                        <p className="adm-user-email">{s.telefono || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Rol">
                                                <span className={`adm-status-pill ${s.role === 'admin' ? 'active' : 'inactive'}`}>{s.role}</span>
                                            </td>
                                            <td data-label="Email" className="adm-td-muted">{s.email}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <a href={`mailto:${s.email}`} className="adm-icon-btn" style={{ background: '#f7f8fa', color: '#555' }}><FaEnvelope /></a>
                                                    {s.id !== storedAdmin.id && (
                                                        <button className="adm-icon-btn red" onClick={() => handleDeleteUser(s.id, s.nombre)}><FaTrashAlt /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: FINANZAS
                ══════════════════════════════════════ */}
                {activeTab === 'sales' && (
                    <div className="adm-content animate-ios-entry">
                        <AdminFinanzas salesStats={salesStats} />
                    </div>
                )}

            </main>
        </div>
    );
}