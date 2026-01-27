import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { 
    FaUserPlus, FaCalendarPlus, FaSearch, FaStethoscope, 
    FaSignOutAlt, FaUserCircle, FaPalette, FaCloudUploadAlt,
    FaUsers, FaDumbbell
} from "react-icons/fa";
import Swal from 'sweetalert2'; 
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import "./Styles.css";
// 🟢 IMPORTACIÓN DINÁMICA
import API_BASE_URL from '../../apiConfig'; 

export default function CoachHome() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [clasesActivas, setClasesActivas] = useState([]); 
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClaseId, setSelectedClaseId] = useState("");
    const [tab, setTab] = useState("paquete");

    const [form, setForm] = useState({
        nombre: "",
        tematica: "",
        descripcion: "",
        paqueteRef: "LMV",
        hora: "06:00",
        fechaInicio: format(new Date(), 'yyyy-MM-dd'),
        color: "#8FD9FB",
        imageUrl: ""
    });

    const HORARIOS_PRESET = ["06:00", "07:00", "08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"];

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            // 🟢 ACTUALIZACIÓN PARA VERCEL
            const resClientes = await fetch(`${API_BASE_URL}/coach/clientes`);
            const dataClientes = await resClientes.json();
            setClientes(dataClientes);

            const resClases = await fetch(`${API_BASE_URL}/clases/disponibles`);
            const dataClases = await resClases.json();
            const sortedClases = dataClases.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            setClasesActivas(sortedClases);
        } catch (err) {
            console.error("Error al refrescar datos:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2000000) {
                return Swal.fire({ icon: 'warning', title: 'Imagen pesada', text: 'Máximo 2MB para asegurar la carga en el servidor.', confirmButtonColor: '#8FD9FB' });
            }
            const reader = new FileReader();
            reader.onloadend = () => setForm({ ...form, imageUrl: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const verExpediente = (c) => {
        Swal.fire({
            title: `<b style="font-family: 'Nunito', sans-serif;text-transform: uppercase;">${c.nombre} ${c.apellido}</b>`,
            html: `
                <div class="expediente-modal" style="text-align: left; font-size: 14px; line-height: 1.6; font-family: 'Nunito', sans-serif; padding: 10px; text-transform: uppercase;">
                    <p><b style="color: black;">Instagram:</b> <span style="color: #B49044;">@${c.instagram || 'no_registrado'}</span></p>
                    <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 15px 0;" />
                    <p><b style="color: black;">Lesiones:</b> <span style="color: #FF3B30; font-weight: 600;">${c.lesiones || 'Ninguna reportada'}</span></p>
                    <p><b>Alergias:</b> ${c.alergias || 'Ninguna'}</p>
                    <p><b>Tipo de Sangre:</b> <span style="color: #B49044;">${c.tipoSangre || 'N/A'}</span></p>
                    <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 15px 0;" />
                    <div style="background: rgba(143, 217, 251, 0.1); padding: 12px; border-radius: 15px;">
                        <p style="margin: 0;"><b>Plan:</b> ${c.planNombre || 'Regular'}</p>
                        <p style="margin: 0;"><b>Saldo Créditos:</b> $${c.creditosDisponibles || 0}</p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#8FD9FB'
        });
    };

    const handlePublicar = async () => {
        if (!form.nombre || !form.fechaInicio) return Swal.fire('Error', 'Faltan datos obligatorios', 'error');
        const endpoint = tab === "paquete" ? "crear-paquete" : "crear-suelta";
        
        try {
            // 🟢 ACTUALIZACIÓN PARA VERCEL
            const response = await fetch(`${API_BASE_URL}/coach/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Programación Exitosa', text: tab === 'paquete' ? 'Mes generado correctamente' : 'Clase publicada', timer: 2000, showConfirmButton: false });
                setForm({ ...form, nombre: "", tematica: "", imageUrl: "" });
                refreshData();
            }
        } catch (error) { 
            Swal.fire('Error', 'No se pudo conectar con el servidor', 'error'); 
        }
    };

    const inscribirAlumnoManual = async (cliente) => {
        if (!selectedClaseId) return Swal.fire('Aviso', 'Selecciona primero una clase del listado', 'info');
        const claseDestino = clasesActivas.find(c => c.id === selectedClaseId);
        
        try {
            // 🟢 ACTUALIZACIÓN PARA VERCEL (Ruta de reservas compartida)
            const response = await fetch(`${API_BASE_URL}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: cliente.email || cliente.correo,
                    paqueteId: 'SUELTA', 
                    selection: {
                        dateKey: format(new Date(claseDestino.fecha), 'yyyy-MM-dd'),
                        hour: format(new Date(claseDestino.fecha), 'HH:mm'),
                        nombreClase: claseDestino.nombre,
                        tematica: claseDestino.tematica
                    }
                })
            });
            if (response.ok) {
                Swal.fire('¡Sincronizado!', `${cliente.nombre} ha sido inscrito manualmente.`, 'success');
                refreshData();
            }
        } catch (e) { 
            Swal.fire('Error', 'Error de red al inscribir', 'error'); 
        }
    };

    const filteredClientes = clientes.filter(c => 
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="coach-container page-content-padded animate-ios-entry" style={{fontFamily: "'Nunito', sans-serif"}}>
            
            <header className="dashboard-header-work">
                <div className="header-left">
                    <div className="role-indicator">
                        <FaUserCircle className="role-icon" color="#8FD9FB" />
                        <span>Panel <b>Coach</b></span>
                    </div>
                    <h1 className="work-title">Gestión de Centro</h1>
                </div>
                <div className="header-right">
                    <button className="btn-work-logout" onClick={handleLogout} title="Cerrar Sesión">
                        <FaSignOutAlt />
                    </button>
                </div>
            </header>
            
            <div className="coach-grid">
                
                {/* COLUMNA 1: CONFIGURACIÓN DE CLASES */}
                <div className="glass-card" style={{borderRadius: '30px'}}>
                    <h3 className="card-subtitle"><FaCalendarPlus color="#8FD9FB" /> Programación</h3>
                    
                    <div className="tab-header">
                        <button className={tab === 'paquete' ? 'active' : ''} onClick={() => setTab('paquete')}>Mensual (Auto)</button>
                        <button className={tab === 'suelta' ? 'active' : ''} onClick={() => setTab('suelta')}>Clase Única</button>
                    </div>

                    <div className="form-container-coach">
                        <input className="coach-input" placeholder="Nombre de la sesión (ej. Morning Flow)" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                        <input className="coach-input" placeholder="Temática (ej. Core & Stability)" value={form.tematica} onChange={e => setForm({...form, tematica: e.target.value})} />
                        
                        {tab === 'paquete' && (
                            <select className="coach-input" value={form.paqueteRef} onChange={e => setForm({...form, paqueteRef: e.target.value})}>
                                <option value="LMV">Lunes - Miércoles - Viernes</option>
                                <option value="MJ">Martes - Jueves</option>
                            </select>
                        )}

                        <div className="coach-row-inputs">
                            <select className="coach-input" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})}>
                                {HORARIOS_PRESET.map(h => <option key={h} value={h}>{h} hrs</option>)}
                            </select>
                            <input type="date" className="coach-input" value={form.fechaInicio} onChange={e => setForm({...form, fechaInicio: e.target.value})} />
                        </div>

                        <div className="coach-row-inputs" style={{ alignItems: 'center', gap: '15px' }}>
                            <div className="color-picker-wrapper">
                                <input 
                                    type="color" 
                                    className="color-picker-custom" 
                                    value={form.color} 
                                    onChange={e => setForm({...form, color: e.target.value})} 
                                />
                            </div>

                            <label htmlFor="image-upload" className={`coach-label-file-button ${form.imageUrl ? 'active' : ''}`}>
                                <FaCloudUploadAlt className="upload-icon" />
                                <span>{form.imageUrl ? 'Imagen Lista' : 'Subir Póster'}</span>
                            </label>
                            
                            <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
                        </div>

                        <button className="coach-btn-primary" onClick={handlePublicar} style={{background: '#8FD9FB', borderRadius: '15px'}}>
                            {tab === 'paquete' ? 'Generar Mes Completo' : 'Publicar Clase'}
                        </button>
                    </div>
                </div>

                {/* COLUMNA 2: INSCRIPCIÓN DE ALUMNOS */}
                <div className="glass-card" style={{borderRadius: '30px'}}>
                    <h3 className="card-subtitle"><FaUserPlus color="#A9B090" /> Inscripción Rápida</h3>
                    
                    <select className="coach-input" value={selectedClaseId} onChange={e => setSelectedClaseId(e.target.value)}>
                        <option value="">-- Selecciona la Clase Destino --</option>
                        {clasesActivas.map(c => (
                            <option key={c.id} value={c.id}>
                                {format(new Date(c.fecha), 'HH:mm')} hrs - {c.nombre} ({format(new Date(c.fecha), 'dd/MM', {locale: es})})
                            </option>
                        ))}
                    </select>

                    <div className="search-wrapper-coach" style={{marginTop: '15px'}}>
                        <FaSearch className="icon-search" />
                        <input className="coach-input-search" placeholder="Buscar alumno por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="client-list-container">
                        {filteredClientes.length > 0 ? filteredClientes.map(cliente => (
                            <div key={cliente.id} className="client-card-mini">
                                <div className="client-text">
                                    <strong>{cliente.nombre} {cliente.apellido}</strong>
                                    <span className={cliente.suscripcionActiva ? 'plan-active' : 'plan-none'}>
                                        {cliente.planNombre || (cliente.suscripcionActiva ? 'Activo' : 'Sin Plan')}
                                    </span>
                                </div>
                                <div className="client-btns">
                                    <button className="btn-icon-med" title="Ver Expediente" onClick={() => verExpediente(cliente)}><FaStethoscope color="#A9B090" /></button>
                                    <button className="btn-icon-add" title="Inscribir a la clase" onClick={() => inscribirAlumnoManual(cliente)} style={{background: '#8FD9FB'}}>+</button>
                                </div>
                            </div>
                        )) : (
                            <p style={{textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>No se encontraron alumnos.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}