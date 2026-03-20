import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    FaChevronLeft, FaChevronRight, FaPlus, FaTimes,
    FaCopy, FaTrashAlt, FaEdit, FaImage, FaUsers,
    FaCalendarAlt, FaClock, FaPalette, FaLayerGroup,
    FaRegCalendarAlt, FaSave
} from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays,
         isSameMonth, isToday, isSameDay, parseISO, getDay, addDays as dateFnsAddDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import authFetch from '../../authFetch';
import './CoachCalendar.css';
import CoachLayout from './CoachLayout';
import './CoachLayout.css';

const PAQUETES = [
    { id: 'LMV', label: 'Lunes · Miércoles · Viernes', dias: [1,3,5] },
    { id: 'MJ',  label: 'Martes · Jueves',             dias: [2,4]   },
];

const HORARIOS = ['06:00','07:00','08:00','09:00','10:00','17:00','18:00','19:00','20:00','21:00'];

const DEFAULT_FORM = {
    nombre: '', tematica: '', descripcion: '',
    tipo: 'suelta', paqueteRef: 'LMV',
    hora: '07:00', fechaInicio: '',
    color: '#8FD9FB', imageUrl: '', cupoMaximo: 8
};

// ──────────────────────────────────────────────
// MODAL PORTAL
// ──────────────────────────────────────────────
function Modal({ onClose, children }) {
    return ReactDOM.createPortal(
        <div className="cc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cc-modal">{children}</div>
        </div>,
        document.body
    );
}

// ──────────────────────────────────────────────
// FORMULARIO CREAR / EDITAR CLASE
// ──────────────────────────────────────────────
function ClaseForm({ initialData, fecha, onSave, onClose, onDelete }) {
    const [form, setForm] = useState(() => ({
        ...DEFAULT_FORM,
        fechaInicio: fecha ? format(fecha, 'yyyy-MM-dd') : '',
        ...initialData
    }));
    const [preview, setPreview] = useState(initialData?.imageUrl || null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleImage = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5_000_000) return Swal.fire('Error', 'Máximo 5MB', 'error');
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            set('imageUrl', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!form.nombre) return Swal.fire('Aviso', 'El nombre es obligatorio', 'info');
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    const isEdit = !!initialData?.id;

    return (
        <div className="cc-form">
            {/* Header */}
            <div className="cc-form-header">
                <h2>{isEdit ? 'Editar clase' : 'Nueva clase'}</h2>
                <button className="cc-close-btn" onClick={onClose}><FaTimes /></button>
            </div>

            {/* Flyer preview */}
            <div className="cc-flyer-zone" onClick={() => fileRef.current.click()}
                 style={{ backgroundImage: preview ? `url(${preview})` : 'none' }}>
                {!preview && (
                    <div className="cc-flyer-placeholder">
                        <FaImage size={28} />
                        <span>Subir flyer de la clase</span>
                        <small>JPG, PNG — máx 5MB</small>
                    </div>
                )}
                {preview && <div className="cc-flyer-overlay"><FaImage /> Cambiar flyer</div>}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImage} />
            </div>

            {/* Nombre y temática */}
            <div className="cc-field-row">
                <div className="cc-field">
                    <label>Nombre de la clase *</label>
                    <input className="cc-input" placeholder="Ej: Pilates Flow" value={form.nombre}
                        onChange={e => set('nombre', e.target.value)} />
                </div>
                <div className="cc-field">
                    <label>Temática</label>
                    <input className="cc-input" placeholder="Ej: Movilidad y respiraciónon" value={form.tematica}
                        onChange={e => set('tematica', e.target.value)} />
                </div>
            </div>

            <div className="cc-field">
                <label>Descripción (visible para el alumno)</label>
                <textarea className="cc-input cc-textarea" placeholder="¿Qué trabajarán en esta clase?"
                    value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
            </div>

            {/* Tipo */}
            <div className="cc-tabs">
                <button className={form.tipo === 'suelta' ? 'active' : ''}
                    onClick={() => set('tipo', 'suelta')}>
                    <FaRegCalendarAlt /> Clase única / fin de semana
                </button>
                <button className={form.tipo === 'paquete' ? 'active' : ''}
                    onClick={() => set('tipo', 'paquete')}>
                    <FaLayerGroup /> Paquete semanal
                </button>
            </div>

            {form.tipo === 'paquete' && (
                <div className="cc-field">
                    <label>Días del paquete</label>
                    <div className="cc-paquete-options">
                        {PAQUETES.map(p => (
                            <div key={p.id}
                                 className={`cc-paquete-card ${form.paqueteRef === p.id ? 'active' : ''}`}
                                 onClick={() => set('paqueteRef', p.id)}>
                                <strong>{p.id}</strong>
                                <span>{p.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hora, fecha, cupo */}
            <div className="cc-field-row">
                <div className="cc-field">
                    <label><FaClock size={11} /> Hora</label>
                    <select className="cc-input" value={form.hora} onChange={e => set('hora', e.target.value)}>
                        {HORARIOS.map(h => <option key={h} value={h}>{h} hrs</option>)}
                    </select>
                </div>
                <div className="cc-field">
                    <label><FaCalendarAlt size={11} /> Fecha {form.tipo === 'paquete' ? 'inicio' : ''}</label>
                    <input type="date" className="cc-input" value={form.fechaInicio}
                        onChange={e => set('fechaInicio', e.target.value)} />
                </div>
                <div className="cc-field">
                    <label><FaUsers size={11} /> Cupo máximo</label>
                    <input type="number" className="cc-input" min={1} max={30} value={form.cupoMaximo}
                        onChange={e => set('cupoMaximo', parseInt(e.target.value) || 1)} />
                </div>
            </div>

            {/* Color */}
            <div className="cc-field">
                <label><FaPalette size={11} /> Color de la clase</label>
                <div className="cc-colors">
                    {['#8FD9FB','#A9B090','#FC7358','#34C759','#FF9500','#AF52DE','#FF2D55','#5AC8FA'].map(c => (
                        <button key={c} className={`cc-color-dot ${form.color === c ? 'selected' : ''}`}
                            style={{ background: c }} onClick={() => set('color', c)} />
                    ))}
                    <input type="color" className="cc-color-custom" value={form.color}
                        onChange={e => set('color', e.target.value)} title="Color personalizado" />
                </div>
            </div>

            {/* Acciones */}
            <div className="cc-form-actions">
                {isEdit && (
                    <>
                        <button className="cc-btn-danger" onClick={() => onDelete(initialData.id)}>
                            <FaTrashAlt /> Eliminar
                        </button>
                        <button className="cc-btn-secondary" onClick={() => onSave({ ...form, duplicate: true })}>
                            <FaCopy /> Duplicar
                        </button>
                    </>
                )}
                <button className="cc-btn-primary" onClick={handleSave} disabled={saving}>
                    <FaSave /> {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear clase'}
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// EVENTO EN EL CALENDARIO
// ──────────────────────────────────────────────
function EventoChip({ clase, onClick, onDragStart }) {
    const pct = clase.cupoMaximo > 0
        ? Math.round((clase.inscritos / clase.cupoMaximo) * 100) : 0;
    const llena = clase.inscritos >= clase.cupoMaximo;

    return (
        <div className={`cc-evento ${llena ? 'llena' : ''}`}
             style={{ borderLeftColor: clase.color || '#8FD9FB' }}
             draggable
             onDragStart={e => onDragStart(e, clase)}
             onClick={e => { e.stopPropagation(); onClick(clase); }}>
            <span className="cc-evento-hora">{format(new Date(clase.fecha), 'HH:mm')}</span>
            <span className="cc-evento-nombre">{clase.nombre}</span>
            <span className={`cc-evento-cupo ${llena ? 'full' : pct > 70 ? 'high' : ''}`}>
                {clase.inscritos}/{clase.cupoMaximo}
            </span>
        </div>
    );
}

// ──────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────
export default function CoachCalendar({ embedded = false }) {
    const [currentDate, setCurrentDate]   = useState(new Date());
    const [clases, setClases]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [modal, setModal]               = useState(null); // { tipo: 'crear'|'editar', data?, fecha? }
    const [draggingId, setDraggingId]     = useState(null);
    const [view, setView]                 = useState('month'); // 'month' | 'week'

    const loadClases = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await authFetch('/clases/disponibles');
            const data = await res.json();
            setClases(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error cargando clases:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadClases(); }, [loadClases]);

    // Días a renderizar
    const days = (() => {
        if (view === 'month') {
            const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
            return Array.from({ length: 35 }, (_, i) => addDays(start, i));
        } else {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            return Array.from({ length: 7 }, (_, i) => addDays(start, i));
        }
    })();

    const clasesDelDia = day =>
        clases.filter(c => isSameDay(new Date(c.fecha), day))
              .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // ── Crear clase ──
    const handleSave = async (form) => {
        const endpoint = form.tipo === 'paquete' ? 'crear-paquete' : 'crear-suelta';
        try {
            const res = await authFetch(`/coach/${endpoint}`, {
                method: 'POST',
                body: JSON.stringify({
                    nombre:      form.nombre,
                    tematica:    form.tematica,
                    descripcion: form.descripcion,
                    paqueteRef:  form.tipo === 'paquete' ? form.paqueteRef : 'SUELTA',
                    hora:        form.hora,
                    fechaInicio: form.fechaInicio,
                    color:       form.color,
                    imageUrl:    form.imageUrl,
                    cupoMaximo:  form.cupoMaximo
                })
            });
            if (res?.ok) {
                await Swal.fire({ icon: 'success', title: '¡Clase creada!', timer: 1500, showConfirmButton: false });
                setModal(null);
                loadClases();
            } else {
                const d = await res?.json();
                Swal.fire('Error', d?.error || 'No se pudo crear', 'error');
            }
        } catch { Swal.fire('Error', 'Error de conexión', 'error'); }
    };

    // ── Editar clase (actualizar datos) ──
    const handleUpdate = async (form) => {
        if (form.duplicate) {
            // Duplicar al día siguiente
            const nextDay = format(dateFnsAddDays(new Date(form.fechaInicio), 1), 'yyyy-MM-dd');
            await handleSave({ ...form, fechaInicio: nextDay, tipo: 'suelta', duplicate: false });
            return;
        }
        // Por ahora: eliminar y recrear (el backend no tiene PUT de clase)
        // En una versión futura se puede agregar PUT /coach/clases/:id
        Swal.fire('Info', 'Para editar, elimina la clase y crea una nueva con los cambios. Próximamente: edición directa.', 'info');
    };

    // ── Eliminar clase ──
    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Eliminar esta clase?',
            text: 'Se eliminará del calendario.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FC7358',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!isConfirmed) return;
        try {
            const res = await authFetch(`/admin/clases/${id}`, { method: 'DELETE' });
            if (res?.ok) {
                setModal(null);
                loadClases();
                Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1200, showConfirmButton: false });
            }
        } catch { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    };

    // ── Drag & Drop ──
    const handleDragStart = (e, clase) => {
        setDraggingId(clase.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e, targetDay) => {
        e.preventDefault();
        if (!draggingId) return;
        const clase = clases.find(c => c.id === draggingId);
        if (!clase) return;

        const { isConfirmed } = await Swal.fire({
            title: `Mover "${clase.nombre}"`,
            text: `¿Mover al ${format(targetDay, "EEEE dd 'de' MMMM", { locale: es })}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8FD9FB',
            confirmButtonText: 'Mover'
        });

        if (isConfirmed) {
            // Crear la clase en el nuevo día y eliminar la original
            const hora = format(new Date(clase.fecha), 'HH:mm');
            const res = await authFetch('/coach/crear-suelta', {
                method: 'POST',
                body: JSON.stringify({
                    nombre:      clase.nombre,
                    tematica:    clase.tematica,
                    descripcion: clase.descripcion,
                    paqueteRef:  'SUELTA',
                    hora,
                    fechaInicio: format(targetDay, 'yyyy-MM-dd'),
                    color:       clase.color,
                    imageUrl:    clase.imageUrl,
                    cupoMaximo:  clase.cupoMaximo
                })
            });
            if (res?.ok) {
                await authFetch(`/admin/clases/${clase.id}`, { method: 'DELETE' });
                loadClases();
            }
        }
        setDraggingId(null);
    };

    const nav = delta => {
        if (view === 'month') setCurrentDate(d => addDays(d, delta * 30));
        else setCurrentDate(d => addDays(d, delta * 7));
    };

    const DIAS_HEADER = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

    const calendarContent = (
        <div className="cc-container animate-ios-entry">

            {/* Header */}
            <div className="cc-header">
                <div className="cc-header-left">
                    <h1 className="cc-title">
                        {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Semana del' dd MMM", { locale: es }).toUpperCase()}
                    </h1>
                    <div className="cc-view-toggle">
                        <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Mes</button>
                        <button className={view === 'week'  ? 'active' : ''} onClick={() => setView('week')}>Semana</button>
                    </div>
                </div>
                <div className="cc-header-right">
                    <button className="cc-nav-btn" onClick={() => nav(-1)}><FaChevronLeft /></button>
                    <button className="cc-nav-btn cc-today-btn" onClick={() => setCurrentDate(new Date())}>Hoy</button>
                    <button className="cc-nav-btn" onClick={() => nav(1)}><FaChevronRight /></button>
                    <button className="cc-btn-new" onClick={() => setModal({ tipo: 'crear', fecha: new Date() })}>
                        <FaPlus /> Nueva clase
                    </button>
                </div>
            </div>

            {/* Días de la semana */}
            <div className="cc-weekdays">
                {DIAS_HEADER.map(d => <div key={d} className="cc-weekday">{d}</div>)}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="cc-loading">
                    <div className="cc-spinner" />
                    <p>Cargando clases...</p>
                </div>
            ) : (
                <div className={`cc-grid ${view}`}>
                    {days.map(day => {
                        const eventos = clasesDelDia(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isHoy = isToday(day);
                        const esFinde = [0, 6].includes(getDay(day));

                        return (
                            <div
                                key={day.toString()}
                                className={`cc-day 
                                    ${!isCurrentMonth ? 'other-month' : ''}
                                    ${isHoy ? 'today' : ''}
                                    ${esFinde ? 'weekend' : ''}
                                    ${eventos.length > 0 ? 'has-events' : ''}
                                `}
                                onClick={() => setModal({ tipo: 'crear', fecha: day })}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => handleDrop(e, day)}
                            >
                                <div className="cc-day-number">
                                    <span>{format(day, 'd')}</span>
                                </div>
                                <div className="cc-day-eventos">
                                    {eventos.slice(0, view === 'month' ? 3 : 10).map(c => (
                                        <EventoChip
                                            key={c.id}
                                            clase={c}
                                            onClick={clase => setModal({ tipo: 'editar', data: clase })}
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                    {view === 'month' && eventos.length > 3 && (
                                        <span className="cc-more">+{eventos.length - 3} más</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <Modal onClose={() => setModal(null)}>
                    <ClaseForm
                        initialData={modal.data}
                        fecha={modal.fecha}
                        onSave={modal.tipo === 'editar' ? handleUpdate : handleSave}
                        onClose={() => setModal(null)}
                        onDelete={handleDelete}
                    />
                </Modal>
            )}
        </div>
    );

    if (embedded) return calendarContent;

    return (
        <CoachLayout title="Calendario" subtitle="Gestiona y programa las clases">
            {calendarContent}
        </CoachLayout>
    );
}