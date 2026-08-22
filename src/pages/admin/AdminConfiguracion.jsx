import React, { useState, useEffect } from 'react';
import { FaCog, FaMoneyBillWave, FaTags, FaPlus, FaEye, FaEyeSlash, FaPen, FaCheck, FaTimes, FaAddressCard, FaSave } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { apiGet, apiPut, apiPost } from '../../authFetch';

const CONTACTO_FIELDS = [
    { key: 'studioName',     label: 'Nombre / ubicación del estudio', placeholder: 'Booz Studio Central' },
    { key: 'whatsappNumber', label: 'WhatsApp (solo números, con lada país)', placeholder: '522212477126' },
    { key: 'facebookUrl',    label: 'Facebook', placeholder: 'https://www.facebook.com/...' },
    { key: 'instagramUrl',   label: 'Instagram', placeholder: 'https://www.instagram.com/...' },
    { key: 'tiktokUrl',      label: 'TikTok', placeholder: 'https://www.tiktok.com/@...' },
];

export default function AdminConfiguracion() {
    const [config, setConfig]         = useState(null);
    const [criterios, setCriterios]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [nuevoCriterio, setNuevoCriterio] = useState('');
    const [addingCriterio, setAddingCriterio] = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [editValue, setEditValue]   = useState('');
    const [contactoForm, setContactoForm] = useState(null);
    const [savingContacto, setSavingContacto] = useState(false);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [rc, rk] = await Promise.all([
                apiGet('/config'),
                apiGet('/criterios?todos=true'),
            ]);
            const [dc, dk] = await Promise.all([rc.json(), rk.json()]);
            setConfig(dc);
            setContactoForm(dc);
            setCriterios(Array.isArray(dk) ? dk : []);
        } catch (e) {
            console.error('Error cargando configuración:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const toggleEfectivo = async () => {
        if (!config || savingConfig) return;
        const nuevoValor = !config.permitirEfectivo;
        setSavingConfig(true);
        setConfig(c => ({ ...c, permitirEfectivo: nuevoValor }));
        try {
            const res = await apiPut('/config', { permitirEfectivo: nuevoValor });
            if (!res.ok) throw new Error();
        } catch (e) {
            setConfig(c => ({ ...c, permitirEfectivo: !nuevoValor }));
            Swal.fire('Error', 'No se pudo actualizar la configuración.', 'error');
        } finally {
            setSavingConfig(false);
        }
    };

    const crearCriterio = async () => {
        const nombre = nuevoCriterio.trim();
        if (!nombre) return;
        setAddingCriterio(true);
        try {
            const res = await apiPost('/criterios', { nombre });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Error');
            setCriterios(list => [...list, data.criterio]);
            setNuevoCriterio('');
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo crear el criterio.', 'error');
        } finally {
            setAddingCriterio(false);
        }
    };

    const toggleActivo = async (criterio) => {
        try {
            const res = await apiPut(`/criterios/${criterio.id}`, { activo: !criterio.activo });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Error');
            setCriterios(list => list.map(c => c.id === criterio.id ? data.criterio : c));
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo actualizar el criterio.', 'error');
        }
    };

    const saveContacto = async () => {
        setSavingContacto(true);
        try {
            const res = await apiPut('/config', contactoForm);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Error');
            setConfig(data.config);
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1200, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo guardar.', 'error');
        } finally {
            setSavingContacto(false);
        }
    };

    const startEdit = (criterio) => {
        setEditingId(criterio.id);
        setEditValue(criterio.nombre);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveEdit = async (criterio) => {
        const nombre = editValue.trim();
        if (!nombre || nombre === criterio.nombre) return cancelEdit();
        try {
            const res = await apiPut(`/criterios/${criterio.id}`, { nombre });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Error');
            setCriterios(list => list.map(c => c.id === criterio.id ? data.criterio : c));
            cancelEdit();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo renombrar el criterio.', 'error');
        }
    };

    if (loading) {
        return <div className="adm-page-title">Cargando configuración…</div>;
    }

    return (
        <div className="cfg-wrapper animate-ios-entry">
            <h1 className="adm-page-title"><FaCog /> Configuración</h1>
            <p className="adm-page-sub" style={{ marginBottom: 24 }}>
                Personaliza el comportamiento de la plataforma para todas las alumnas.
            </p>

            <div className="adm-card cfg-card">
                <div className="adm-card-header">
                    <h3><FaMoneyBillWave /> Métodos de pago</h3>
                </div>
                <div className="cfg-toggle-row">
                    <div>
                        <p className="cfg-toggle-label">Permitir reservar con efectivo</p>
                        <p className="cfg-toggle-hint">
                            Si lo desactivas, las alumnas solo podrán reservar con créditos o suscripción.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={`cfg-switch ${config?.permitirEfectivo ? 'on' : ''}`}
                        onClick={toggleEfectivo}
                        disabled={savingConfig}
                        aria-pressed={!!config?.permitirEfectivo}
                        aria-label="Permitir reservar con efectivo"
                    >
                        <span className="cfg-switch-knob" />
                    </button>
                </div>
            </div>

            <div className="adm-card cfg-card">
                <div className="adm-card-header">
                    <h3><FaAddressCard /> Contacto y redes sociales</h3>
                </div>
                <p className="cfg-toggle-hint" style={{ marginBottom: 16 }}>
                    Estos datos se usan en toda la plataforma (navbar, botón de WhatsApp, tarjetas de reserva) sin necesitar un nuevo despliegue.
                </p>
                <div className="cfg-contacto-grid">
                    {CONTACTO_FIELDS.map(({ key, label, placeholder }) => (
                        <div key={key} className="adm-field">
                            <label>{label}</label>
                            <input
                                className="cfg-input"
                                value={contactoForm?.[key] || ''}
                                placeholder={placeholder}
                                onChange={e => setContactoForm(f => ({ ...f, [key]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
                <button type="button" className="cfg-btn-add" style={{ marginTop: 16 }} onClick={saveContacto} disabled={savingContacto}>
                    <FaSave /> {savingContacto ? 'Guardando...' : 'Guardar contacto'}
                </button>
            </div>

            <div className="adm-card cfg-card">
                <div className="adm-card-header">
                    <h3><FaTags /> Criterios de clase</h3>
                </div>
                <p className="cfg-toggle-hint" style={{ marginBottom: 16 }}>
                    Estos criterios aparecen como opciones al crear una clase y en la tarjeta de reserva de las alumnas.
                </p>

                <div className="cfg-add-row">
                    <input
                        type="text"
                        placeholder="Nuevo criterio (ej. Silla wunda)"
                        value={nuevoCriterio}
                        onChange={e => setNuevoCriterio(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && crearCriterio()}
                        className="cfg-input"
                    />
                    <button
                        type="button"
                        className="cfg-btn-add"
                        onClick={crearCriterio}
                        disabled={addingCriterio || !nuevoCriterio.trim()}
                    >
                        <FaPlus /> Agregar
                    </button>
                </div>

                <div className="cfg-criterios-list">
                    {criterios.length === 0 && (
                        <p className="cfg-toggle-hint">Aún no hay criterios creados.</p>
                    )}
                    {criterios.map(c => (
                        <div key={c.id} className={`cfg-criterio-chip ${c.activo ? '' : 'inactive'}`}>
                            {editingId === c.id ? (
                                <>
                                    <input
                                        autoFocus
                                        className="cfg-input cfg-input-inline"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') saveEdit(c);
                                            if (e.key === 'Escape') cancelEdit();
                                        }}
                                    />
                                    <button type="button" className="cfg-icon-btn" onClick={() => saveEdit(c)}><FaCheck /></button>
                                    <button type="button" className="cfg-icon-btn" onClick={cancelEdit}><FaTimes /></button>
                                </>
                            ) : (
                                <>
                                    <span className="cfg-criterio-nombre">{c.nombre}</span>
                                    <button type="button" className="cfg-icon-btn" onClick={() => startEdit(c)} title="Renombrar">
                                        <FaPen />
                                    </button>
                                    <button
                                        type="button"
                                        className="cfg-icon-btn"
                                        onClick={() => toggleActivo(c)}
                                        title={c.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        {c.activo ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
