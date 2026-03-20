import React, { useEffect, useState } from 'react';
import {
    FaUserAlt, FaEdit, FaTrashAlt, FaSearch,
    FaPhone, FaHeartbeat, FaCoins, FaTimes, FaSave,
    FaInstagram, FaFilter
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Styles.css';
import authFetch from '../../authFetch';
import CoachLayout from './CoachLayout';
import './CoachLayout.css';

export default function Clientes() {
    const [clientes, setClientes]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState("");
    const [filter, setFilter]           = useState("todos");
    const [selected, setSelected]       = useState(null); // expediente abierto
    const [editForm, setEditForm]       = useState(null);
    const [saving, setSaving]           = useState(false);

    const fetchClientes = async () => {
        setLoading(true);
        try {
            // ✅ authFetch agrega el token JWT automáticamente
            const res  = await authFetch('/coach/clientes');
            const data = await res.json();
            setClientes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error:", err);
            Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    const handleDelete = async (id, nombre) => {
        const { isConfirmed } = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: "Se borrarán permanentemente sus datos y reservas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!isConfirmed) return;
        try {
            const res = await authFetch(`/coach/clientes/${id}`, { method: 'DELETE' });
            if (res?.ok) {
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
                setSelected(null);
                fetchClientes();
            }
        } catch { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    };

    const openExpediente = (cliente) => {
        setSelected(cliente);
        setEditForm({ ...cliente });
    };

    const handleSave = async () => {
        if (!editForm) return;
        setSaving(true);
        try {
            const res = await authFetch(`/coach/update-expediente/${editForm.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nombre:              editForm.nombre,
                    apellido:            editForm.apellido,
                    telefono:            editForm.telefono,
                    instagram:           editForm.instagram,
                    creditosDisponibles: editForm.creditosDisponibles,
                    suscripcionActiva:   editForm.suscripcionActiva,
                    lesiones:            editForm.lesiones,
                    alergias:            editForm.alergias,
                    tipoSangre:          editForm.tipoSangre,
                    contactoEmergencia:  editForm.contactoEmergencia
                })
            });
            if (res?.ok) {
                Swal.fire({ icon: 'success', title: '¡Actualizado!', timer: 1200, showConfirmButton: false });
                setSelected(null);
                fetchClientes();
            }
        } catch { Swal.fire('Error', 'No se pudo actualizar', 'error'); }
        finally { setSaving(false); }
    };

    const filtered = clientes.filter(c => {
        const q = `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase();
        const match = q.includes(searchTerm.toLowerCase());
        if (filter === 'activos')   return match && c.suscripcionActiva;
        if (filter === 'inactivos') return match && !c.suscripcionActiva;
        if (filter === 'lesiones')  return match && c.lesiones;
        return match;
    });

    if (loading) return (
        <div className="loader-container-full">
            <div className="spinner-ios" />
            <p style={{ marginTop: 16, color: '#8e8e93', fontWeight: 700 }}>Cargando comunidad Booz...</p>
        </div>
    );

    return (
        <CoachLayout title="Alumnas" subtitle="Gestión de la comunidad Booz">
        <div className="coach-view-container animate-ios-entry" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* ── COLUMNA PRINCIPAL ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card glass-card">
                        <span className="stat-label">Total comunidad</span>
                        <span className="stat-value">{clientes.length}</span>
                    </div>
                    <div className="stat-card glass-card">
                        <span className="stat-label">Alumnas activas</span>
                        <span className="stat-value green">{clientes.filter(c => c.suscripcionActiva).length}</span>
                    </div>
                    <div className="stat-card glass-card">
                        <span className="stat-label">Con lesiones</span>
                        <span className="stat-value" style={{ color: '#FF9500' }}>
                            {clientes.filter(c => c.lesiones).length}
                        </span>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-box-wrapper" style={{ flex: 1, minWidth: 200 }}>
                        <FaSearch className="search-icon" />
                        <input className="coach-input-search" placeholder="Buscar por nombre o email..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="tab-header" style={{ margin: 0, flex: 'none' }}>
                        {[
                            { id: 'todos',    label: 'Todos'    },
                            { id: 'activos',  label: 'Activas'  },
                            { id: 'lesiones', label: 'Lesiones' },
                        ].map(f => (
                            <button key={f.id} className={filter === f.id ? 'active' : ''}
                                onClick={() => setFilter(f.id)}>{f.label}</button>
                        ))}
                    </div>
                </div>

                {/* Tabla */}
                <div className="management-table-wrapper glass-card" style={{ padding: 0 }}>
                    <table className="booz-table">
                        <thead>
                            <tr>
                                <th>Alumna</th>
                                <th>Contacto</th>
                                <th>Plan y créditos</th>
                                <th>Salud</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map(c => (
                                <tr key={c.id} style={{ cursor: 'pointer' }}
                                    onClick={() => openExpediente(c)}>
                                    <td>
                                        <div className="id-cell">
                                            <div className="avatar-main">
                                                {c.profileImageUrl
                                                    ? <img src={c.profileImageUrl} alt="perfil" />
                                                    : <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#8FD9FB' }}>
                                                        {c.nombre.charAt(0)}
                                                      </span>}
                                            </div>
                                            <div>
                                                <p className="name-bold">{c.nombre} {c.apellido}</p>
                                                <p className="email-small">{c.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.82rem', color: '#555' }}>
                                            <FaPhone size={10} style={{ marginRight: 6 }} />
                                            {c.telefono || 'Sin número'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span className={`status-badge ${c.suscripcionActiva ? 'active' : 'inactive'}`}>
                                                {c.planNombre || (c.suscripcionActiva ? 'Activo' : 'Sin plan')}
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FaCoins color="#FFD700" size={11} />
                                                {c.creditosDisponibles || 0} créditos
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`health-badge ${c.lesiones ? 'alert' : 'safe'}`}
                                             title={c.lesiones || 'Sin lesiones reportadas'}>
                                            <FaHeartbeat />
                                        </div>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className="actions-row">
                                            <button className="btn-edit" title="Ver expediente"
                                                onClick={() => openExpediente(c)}>
                                                <FaEdit />
                                            </button>
                                            <button className="btn-del" title="Eliminar"
                                                onClick={() => handleDelete(c.id, c.nombre)}>
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#8e8e93' }}>
                                        No se encontraron alumnas con ese criterio.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── PANEL LATERAL DE EXPEDIENTE ── */}
            {selected && editForm && (
                <div className="glass-card" style={{
                    width: 340, flexShrink: 0, position: 'sticky', top: 24,
                    maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
                    animation: 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both'
                }}>
                    <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>

                    {/* Header expediente */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', color: '#8FD9FB' }}>
                            Expediente
                        </h3>
                        <button className="cc-close-btn" onClick={() => setSelected(null)}><FaTimes /></button>
                    </div>

                    {/* Avatar */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        {selected.profileImageUrl
                            ? <img src={selected.profileImageUrl} alt="perfil"
                                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #8FD9FB' }} />
                            : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(143,217,251,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2rem', fontWeight: 900, color: '#8FD9FB' }}>
                                {selected.nombre.charAt(0)}
                              </div>}
                        <p style={{ margin: '10px 0 2px', fontWeight: 900, color: '#1d1d1f', fontSize: '1rem', textTransform: 'uppercase' }}>
                            {editForm.nombre} {editForm.apellido}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#8e8e93' }}>{selected.email}</p>
                    </div>

                    {/* Campos editables */}
                    {[
                        { label: 'Nombre',     key: 'nombre'     },
                        { label: 'Apellido',   key: 'apellido'   },
                        { label: 'Teléfono',   key: 'telefono'   },
                        { label: 'Instagram',  key: 'instagram'  },
                        { label: 'Tipo sangre',key: 'tipoSangre' },
                        { label: 'Emergencia', key: 'contactoEmergencia' },
                    ].map(({ label, key }) => (
                        <div key={key} style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }}>
                                {label}
                            </label>
                            <input
                                className="coach-input"
                                style={{ marginBottom: 0, fontSize: '0.88rem', padding: '10px 14px' }}
                                value={editForm[key] || ''}
                                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                            />
                        </div>
                    ))}

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }}>
                            Créditos disponibles
                        </label>
                        <input type="number" className="coach-input"
                            style={{ marginBottom: 0, fontSize: '0.88rem', padding: '10px 14px' }}
                            value={editForm.creditosDisponibles || 0}
                            onChange={e => setEditForm(f => ({ ...f, creditosDisponibles: parseInt(e.target.value) || 0 }))} />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }}>
                            Suscripción
                        </label>
                        <select className="coach-input"
                            style={{ marginBottom: 0, fontSize: '0.88rem', padding: '10px 14px' }}
                            value={String(editForm.suscripcionActiva)}
                            onChange={e => setEditForm(f => ({ ...f, suscripcionActiva: e.target.value === 'true' }))}>
                            <option value="true">Activa</option>
                            <option value="false">Inactiva</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 4 }}>
                            ⚠ Lesiones / condiciones
                        </label>
                        <textarea className="coach-input"
                            style={{ marginBottom: 0, fontSize: '0.85rem', padding: '10px 14px', minHeight: 80, resize: 'none', lineHeight: 1.5 }}
                            value={editForm.lesiones || ''}
                            onChange={e => setEditForm(f => ({ ...f, lesiones: e.target.value }))} />
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="coach-btn-primary" style={{ marginTop: 0, flex: 2 }}
                            onClick={handleSave} disabled={saving}>
                            <FaSave size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button style={{
                            flex: 1, padding: '14px', background: 'rgba(255,59,48,0.08)',
                            color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 14,
                            fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem',
                            cursor: 'pointer', textTransform: 'uppercase'
                        }} onClick={() => handleDelete(selected.id, selected.nombre)}>
                            <FaTrashAlt />
                        </button>
                    </div>
                </div>
            )}
        </div>
        </CoachLayout>
    );
}