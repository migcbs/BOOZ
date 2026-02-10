import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { 
    FaUserPlus, FaCalendarPlus, FaSearch, FaStethoscope, 
    FaSignOutAlt, FaUserCircle, FaPalette, FaCloudUploadAlt,
    FaUsers, FaDumbbell, FaClock, FaCheckCircle, FaWhatsapp,
    FaRegCalendarAlt, FaLayerGroup, FaInfoCircle
} from "react-icons/fa";
import Swal from 'sweetalert2'; 
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import "./Styles.css";
import API_BASE_URL from '../../apiConfig'; 

export default function CoachHome() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [clasesActivas, setClasesActivas] = useState([]); 
    const [espera, setEspera] = useState([]); 
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClaseId, setSelectedClaseId] = useState("");
    const [tab, setTab] = useState("paquete");

    const [form, setForm] = useState({
        nombre: "",
        tematica: "",
        descripcion: "",
        paqueteRef: "1", // Paquete 1 por defecto
        hora: "06:00",
        fechaInicio: format(new Date(), 'yyyy-MM-dd'),
        color: "#8FD9FB",
        imageUrl: "",
        cupoMaximo: 8 
    });

    const HORARIOS_PRESET = ["06:00", "07:00", "08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"];
    
    // ESTRUCTURA ESTRICTA BOOZ: 2 PAQUETES ÚNICOS
    const PAQUETES_BOOZ = [
        { id: "1", label: "PAQUETE 1: LUNES - MIÉRCOLES - VIERNES", diasNom: "L-M-V" },
        { id: "2", label: "PAQUETE 2: MARTES - JUEVES", diasNom: "M-J" }
    ];

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            const resClientes = await fetch(`${API_BASE_URL}/coach/clientes`);
            const dataClientes = await resClientes.json();
            setClientes(dataClientes);

            const resClases = await fetch(`${API_BASE_URL}/clases/disponibles`);
            const dataClases = await resClases.json();
            const sortedClases = dataClases.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            setClasesActivas(sortedClases);

            const resEspera = await fetch(`${API_BASE_URL}/admin/lista-espera`);
            const dataEspera = await resEspera.json();
            setEspera(dataEspera);
        } catch (err) {
            console.error("Error al refrescar datos:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const verExpediente = (c) => {
        Swal.fire({
            title: `<b style="font-family: 'Nunito', sans-serif;text-transform: uppercase;">${c.nombre} ${c.apellido}</b>`,
            html: `
                <div class="expediente-modal" style="text-align: left; font-size: 14px; line-height: 1.6; font-family: 'Nunito', sans-serif; padding: 10px; text-transform: uppercase;">
                    <p><b style="color: black;">Instagram:</b> <span style="color: #8FD9FB;">@${c.instagram || 'no_registrado'}</span></p>
                    <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 15px 0;" />
                    <p><b style="color: black;">Teléfono:</b> ${c.telefono || 'Sin número'}</p>
                    <p><b style="color: black;">Lesiones:</b> <span style="color: #FF3B30; font-weight: 600;">${c.lesiones || 'Ninguna reportada'}</span></p>
                    <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 15px 0;" />
                    <div style="background: rgba(143, 217, 251, 0.1); padding: 12px; border-radius: 15px;">
                        <p style="margin: 0;"><b>Plan:</b> ${c.planNombre || 'Regular'}</p>
                        <p style="margin: 0;"><b>Saldo Créditos:</b> ${c.creditosDisponibles || 0}</p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#8FD9FB'
        });
    };

    const handlePublicar = async () => {
        if (!form.nombre || !form.fechaInicio) return Swal.fire('Error', 'Faltan datos obligatorios', 'error');
        
        const endpoint = tab === "paquete" ? "crear-paquete" : "crear-suelta";
        const pkgInfo = tab === "paquete" ? PAQUETES_BOOZ.find(p => p.id === form.paqueteRef) : null;

        Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const response = await fetch(`${API_BASE_URL}/coach/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    paqueteId: tab === "paquete" ? form.paqueteRef : null,
                    esFinde: tab === "suelta" // El backend sabrá que es fuera de paquete
                })
            });
            if (response.ok) {
                Swal.fire({ 
                    icon: 'success', 
                    title: '¡Sincronizado!', 
                    text: tab === 'paquete' ? `Paquete ${pkgInfo.diasNom} generado correctamente.` : 'Clase de fin de semana publicada.', 
                    timer: 2000, 
                    showConfirmButton: false 
                });
                setForm({ ...form, nombre: "", tematica: "", imageUrl: "" });
                refreshData();
            }
        } catch (error) { 
            Swal.fire('Error', 'Error de conexión', 'error'); 
        }
    };

    const resolverEspera = async (id) => {
        const result = await Swal.fire({
            title: '¿Asignar lugar?',
            text: "Se notificará al alumno y se limpiará la lista.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8FD9FB',
            confirmButtonText: 'Confirmar'
        });

        if (result.isConfirmed) {
            try {
                await fetch(`${API_BASE_URL}/admin/lista-espera/${id}`, { method: 'DELETE' });
                refreshData();
                Swal.fire('Listo', 'Lista actualizada.', 'success');
            } catch (e) {
                Swal.fire('Error', 'No se pudo actualizar.', 'error');
            }
        }
    };

    const inscribirAlumnoManual = async (cliente) => {
        if (!selectedClaseId) return Swal.fire('Atención', 'Selecciona la clase destino arriba.', 'info');
        const claseDestino = clasesActivas.find(c => c.id === selectedClaseId);
        
        try {
            const response = await fetch(`${API_BASE_URL}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: cliente.email || cliente.correo,
                    claseId: claseDestino.id,
                    metodoPago: 'EFECTIVO'
                })
            });
            if (response.ok) {
                Swal.fire('¡Registrado!', `${cliente.nombre} ha sido inscrito.`, 'success');
                refreshData();
            } else {
                const data = await response.json();
                Swal.fire('Error', data.message || 'No se pudo inscribir.', 'error');
            }
        } catch (e) { 
            Swal.fire('Error', 'Error al procesar inscripción', 'error'); 
        }
    };

    const filteredClientes = clientes.filter(c => 
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="coach-container animate-ios-entry">
            
            <header className="dashboard-header-work">
                <div className="header-left">
                    <div className="role-indicator">
                        <FaUserCircle color="#8FD9FB" />
                        <span>Gestión de Centro <b>BOOZ</b></span>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn-work-logout" onClick={handleLogout}>
                        <FaSignOutAlt /> 
                    </button>
                </div>
                    <h1 className="work-title">Panel <b>Coach</b></h1>
            </header>
            
            <div className="coach-grid">
                
                {/* 1. SECCIÓN DE PROGRAMACIÓN - LÓGICA DE PAQUETES REFORZADA */}
                <div className="glass-card">
                    <h3 className="card-subtitle"><FaCalendarPlus color="#8FD9FB" /> Programar Calendario</h3>
                    
                    <div className="tab-header">
                        <button className={tab === 'paquete' ? 'active' : ''} onClick={() => setTab('paquete')}>
                            <FaLayerGroup /> PAQUETES (L-V)
                        </button>
                        <button className={tab === 'suelta' ? 'active' : ''} onClick={() => setTab('suelta')}>
                            <FaRegCalendarAlt /> FIN DE SEMANA / ÚNICA
                        </button>
                    </div>

                    <div className="form-container-coach">
                        <label className="coach-label-mini">Nombre de Clase</label>
                        <input className="coach-input" placeholder="Ej: HIIT TRX" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                        
                        {tab === 'paquete' ? (
                            <div className="form-group-booz" style={{background: 'rgba(143, 217, 251, 0.05)', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px dashed #8FD9FB'}}>
                                <label className="coach-label-mini">Seleccionar Paquete de Días</label>
                                <select className="coach-input" value={form.paqueteRef} onChange={e => setForm({...form, paqueteRef: e.target.value})}>
                                    {PAQUETES_BOOZ.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>{pkg.label}</option>
                                    ))}
                                </select>
                                <p style={{fontSize: '0.7rem', color: '#86868b', marginTop: '5px'}}>
                                    <FaInfoCircle /> Esto generará automáticamente la clase los días del paquete por el resto del mes.
                                </p>
                            </div>
                        ) : (
                            <div className="form-group-booz" style={{background: 'rgba(169, 176, 144, 0.05)', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px dashed #A9B090'}}>
                                <p style={{fontSize: '0.75rem', fontWeight: 800, color: '#A9B090', textAlign: 'center'}}>SÁBADOS / DOMINGOS / EVENTOS ESPECIALES</p>
                            </div>
                        )}

                        <div className="coach-row-inputs">
                            <div style={{flex: 1}}>
                                <label className="coach-label-mini">Hora</label>
                                <select className="coach-input" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})}>
                                    {HORARIOS_PRESET.map(h => <option key={h} value={h}>{h} hrs</option>)}
                                </select>
                            </div>
                            <div style={{flex: 1}}>
                                <label className="coach-label-mini">Fecha Inicio</label>
                                <input type="date" className="coach-input" value={form.fechaInicio} onChange={e => setForm({...form, fechaInicio: e.target.value})} />
                            </div>
                        </div>

                        <div className="coach-row-inputs" style={{alignItems: 'center'}}>
                            <div className="color-picker-wrapper">
                                <input type="color" className="color-picker-custom" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                            </div>
                            <input type="number" className="coach-input" style={{width: '100px', marginBottom: 0}} placeholder="Cupo" value={form.cupoMaximo} onChange={e => setForm({...form, cupoMaximo: e.target.value})} />
                            <button className="coach-btn-primary" onClick={handlePublicar} style={{marginTop: 0, flex: 1}}>
                                {tab === 'paquete' ? 'Generar Paquete' : 'Publicar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. LISTA DE ESPERA (CENTRO) */}
                <div className="glass-card">
                    <h3 className="card-subtitle"><FaClock color="#FF9500" /> Lista de Espera</h3>
                    <div className="client-list-container" style={{maxHeight: '420px'}}>
                        {espera.length > 0 ? espera.map(item => (
                            <div key={item.id} className="client-card-mini" style={{borderLeft: '4px solid #FF9500'}}>
                                <div className="client-text">
                                    <strong>{item.user.nombre} {item.user.apellido}</strong>
                                    <span>{item.clase.nombre}</span>
                                    <span style={{color: '#FF9500', fontSize: '10px'}}>{format(parseISO(item.clase.fecha), 'eeee dd/MM HH:mm', {locale: es})}</span>
                                </div>
                                <div className="client-btns">
                                    <a href={`https://wa.me/${item.user.telefono}`} target="_blank" rel="noreferrer" className="btn-icon-med">
                                        <FaWhatsapp color="#25D366" />
                                    </a>
                                    <button className="btn-icon-add" onClick={() => resolverEspera(item.id)} style={{background: '#FF9500', color: 'white'}}>
                                        <FaCheckCircle />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p style={{textAlign: 'center', opacity: 0.5, marginTop: '40px'}}>Sin solicitudes pendientes.</p>
                        )}
                    </div>
                </div>

                {/* 3. INSCRIPCIÓN Y BUSCADOR (ABAJO - FULL WIDTH) */}
                <div className="glass-card" style={{gridColumn: 'span 2'}}>
                    <h3 className="card-subtitle"><FaUserPlus color="#A9B090" /> Registro de Asistencia Manual</h3>
                    
                    <div className="management-header" style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                        <select className="coach-input" style={{flex: 2, marginBottom: 0}} value={selectedClaseId} onChange={e => setSelectedClaseId(e.target.value)}>
                            <option value="">-- SELECCIONA LA CLASE DESTINO --</option>
                            {clasesActivas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {format(new Date(c.fecha), 'eeee dd/MM', {locale: es})} - {format(new Date(c.fecha), 'HH:mm')} hrs - {c.nombre}
                                </option>
                            ))}
                        </select>
                        <div className="search-box-wrapper" style={{flex: 1}}>
                            <FaSearch className="search-icon" />
                            <input className="coach-input-search" placeholder="BUSCAR ALUMNO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    <div className="client-grid-mini" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px'}}>
                        {filteredClientes.slice(0, 12).map(cliente => (
                            <div key={cliente.id} className="client-card-mini">
                                <div className="avatar-mini">{cliente.nombre.charAt(0)}</div>
                                <div className="client-text">
                                    <strong>{cliente.nombre} {cliente.apellido}</strong>
                                    <span className="user-email">{cliente.email}</span>
                                    <span className={cliente.creditosDisponibles > 0 ? "plan-active" : "plan-none"}>
                                        Créditos: {cliente.creditosDisponibles || 0}
                                    </span>
                                </div>
                                <div className="client-btns">
                                    <button className="btn-icon-med" onClick={() => verExpediente(cliente)}><FaStethoscope /></button>
                                    <button className="btn-icon-add" onClick={() => inscribirAlumnoManual(cliente)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}