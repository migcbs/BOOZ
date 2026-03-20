import React, { useState, useEffect } from 'react';
import { FaDumbbell, FaPlus, FaTimes, FaSave, FaEdit, FaTrashAlt, FaTag } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Styles.css';
import CoachLayout from './CoachLayout';
import './CoachLayout.css';

// Las temáticas se guardan en localStorage por ahora
// (cuando el backend tenga endpoint /tematicas, se migra fácil)
const STORAGE_KEY = 'booz_tematicas';

const TIPOS = [
    { id: 'movilidad',     label: 'Movilidad',      color: '#8FD9FB' },
    { id: 'fuerza',        label: 'Fuerza',          color: '#A9B090' },
    { id: 'respiracion',   label: 'Respiración',     color: '#34C759' },
    { id: 'rehabilitacion',label: 'Rehabilitación',  color: '#FF9500' },
    { id: 'intensidad',    label: 'Alta intensidad',  color: '#FC7358' },
    { id: 'relajacion',    label: 'Relajación',      color: '#AF52DE' },
];

const DEFAULT_FORM = {
    nombre: '', tipo: 'movilidad', nivel: '2',
    descripcion: '', musica: '', material: ''
};

export default function Rutinas() {
    const [tematicas, setTematicas] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    });
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing]   = useState(null);
    const [form, setForm]         = useState(DEFAULT_FORM);
    const [search, setSearch]     = useState('');

    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tematicas));

    const handleSave = () => {
        if (!form.nombre) return Swal.fire('Aviso', 'El nombre es obligatorio', 'info');

        if (editing !== null) {
            const updated = tematicas.map((t, i) => i === editing ? { ...form } : t);
            setTematicas(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
            const updated = [...tematicas, { ...form, id: Date.now() }];
            setTematicas(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
        setEditing(null);
        Swal.fire({ icon: 'success', title: '¡Guardado!', timer: 1200, showConfirmButton: false });
    };

    const handleEdit = (idx) => {
        setForm({ ...tematicas[idx] });
        setEditing(idx);
        setShowForm(true);
    };

    const handleDelete = async (idx) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Eliminar temática?', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#FC7358', confirmButtonText: 'Eliminar'
        });
        if (!isConfirmed) return;
        const updated = tematicas.filter((_, i) => i !== idx);
        setTematicas(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const filtered = tematicas.filter(t =>
        t.nombre.toLowerCase().includes(search.toLowerCase()) ||
        t.tipo.toLowerCase().includes(search.toLowerCase())
    );

    const tipoInfo = id => TIPOS.find(t => t.id === id) || TIPOS[0];

    return (
        <CoachLayout title="Temáticas" subtitle="Planifica el contenido de tus clases">
            <div className="coach-view-container animate-ios-entry">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 300, textTransform: 'uppercase', letterSpacing: -1 }}>
                        <FaDumbbell color="#A9B090" style={{ marginRight: 12 }} />
                        Temáticas de <b style={{ fontWeight: 900, color: '#8FD9FB' }}>clase</b>
                    </h1>
                    <p style={{ margin: '6px 0 0', color: '#8e8e93', fontSize: '0.85rem', fontWeight: 600 }}>
                        Define las temáticas que puedes asignar a cada clase del calendario
                    </p>
                </div>
                <button className="coach-btn-primary" style={{ marginTop: 0, width: 'auto', padding: '12px 20px' }}
                    onClick={() => { setForm(DEFAULT_FORM); setEditing(null); setShowForm(true); }}>
                    <FaPlus /> Nueva temática
                </button>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="glass-card" style={{ marginBottom: 24, padding: '24px', border: '1.5px solid rgba(143,217,251,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', color: '#8FD9FB' }}>
                            {editing !== null ? 'Editar temática' : 'Nueva temática'}
                        </h3>
                        <button className="cc-close-btn" onClick={() => { setShowForm(false); setEditing(null); }}>
                            <FaTimes />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label className="coach-label-mini">Nombre *</label>
                            <input className="coach-input" style={{ marginBottom: 0 }}
                                placeholder="Ej: Flujo y respiración"
                                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                        </div>
                        <div>
                            <label className="coach-label-mini">Tipo</label>
                            <select className="coach-input" style={{ marginBottom: 0 }}
                                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                                {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="coach-label-mini">Nivel de dificultad (1–5)</label>
                            <select className="coach-input" style={{ marginBottom: 0 }}
                                value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}>
                                {['1','2','3','4','5'].map(n => (
                                    <option key={n} value={n}>{'⬤'.repeat(parseInt(n))}{'○'.repeat(5 - parseInt(n))} — Nivel {n}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="coach-label-mini">Música sugerida</label>
                            <input className="coach-input" style={{ marginBottom: 0 }}
                                placeholder="Ej: Lo-fi chill, Playlist Spotify..."
                                value={form.musica} onChange={e => setForm(f => ({ ...f, musica: e.target.value }))} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="coach-label-mini">Descripción para alumnas</label>
                            <textarea className="coach-input" style={{ marginBottom: 0, minHeight: 80, resize: 'none', lineHeight: 1.5 }}
                                placeholder="¿Qué trabajarán? ¿Qué esperar de esta clase?"
                                value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="coach-label-mini">Material necesario</label>
                            <input className="coach-input" style={{ marginBottom: 0 }}
                                placeholder="Ej: Banda de resistencia, pelota pequeña..."
                                value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                        <button className="coach-btn-primary" style={{ marginTop: 0, flex: 2 }} onClick={handleSave}>
                            <FaSave /> Guardar temática
                        </button>
                        <button style={{
                            flex: 1, padding: '14px', background: '#f2f2f7', color: '#8e8e93',
                            border: 'none', borderRadius: 14, fontFamily: 'var(--font-main)',
                            fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase'
                        }} onClick={() => { setShowForm(false); setEditing(null); }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Búsqueda */}
            {tematicas.length > 0 && (
                <div className="search-box-wrapper" style={{ marginBottom: 20 }}>
                    <span className="search-icon" style={{ fontSize: '0.9rem', color: '#aeaeb2' }}>🔍</span>
                    <input className="coach-input-search" placeholder="Buscar temática..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            )}

            {/* Grid de temáticas */}
            {filtered.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
                    <FaTag size={40} color="#e5e5ea" style={{ marginBottom: 16 }} />
                    <h3 style={{ color: '#1d1d1f', margin: '0 0 8px', textTransform: 'uppercase' }}>
                        {tematicas.length === 0 ? 'Sin temáticas aún' : 'Sin resultados'}
                    </h3>
                    <p style={{ color: '#8e8e93', fontSize: '0.85rem', margin: 0 }}>
                        {tematicas.length === 0
                            ? 'Crea tu primera temática para asignarla a las clases del calendario.'
                            : 'No hay temáticas que coincidan con tu búsqueda.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {filtered.map((t, idx) => {
                        const tipo = tipoInfo(t.tipo);
                        return (
                            <div key={t.id || idx} className="glass-card" style={{
                                padding: '20px', borderLeft: `4px solid ${tipo.color}`,
                                animation: `fadeInUp 0.4s ease ${idx * 0.04}s both`
                            }}>
                                <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', color: '#1d1d1f', textTransform: 'uppercase' }}>
                                            {t.nombre}
                                        </p>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            <span style={{
                                                background: `${tipo.color}18`, color: tipo.color,
                                                padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800
                                            }}>{tipo.label}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#aeaeb2', fontWeight: 700, letterSpacing: 1 }}>
                                                {'⬤'.repeat(parseInt(t.nivel || 2))}{'○'.repeat(5 - parseInt(t.nivel || 2))}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn-edit" style={{ padding: 8 }} onClick={() => handleEdit(idx)}><FaEdit /></button>
                                        <button className="btn-del"  style={{ padding: 8 }} onClick={() => handleDelete(idx)}><FaTrashAlt /></button>
                                    </div>
                                </div>

                                {t.descripcion && (
                                    <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>
                                        {t.descripcion}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {t.musica && (
                                        <span style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 600 }}>
                                            🎵 {t.musica}
                                        </span>
                                    )}
                                    {t.material && (
                                        <span style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 600 }}>
                                            🎯 {t.material}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        </CoachLayout>
    );
}