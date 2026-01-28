import React, { useState, useEffect } from 'react';
import { 
    FaUsers, FaChartLine, FaUserPlus, FaUserShield, 
    FaTrashAlt, FaSearch, FaCreditCard, FaChalkboardTeacher,
    FaWallet, FaCheckCircle, FaFileMedical, FaHistory,
    FaEnvelope, FaExclamationTriangle, FaSignOutAlt, FaPlusCircle 
} from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './Styles.css';
// 🟢 IMPORTACIÓN DEL CONFIG
import API_BASE_URL from '../../apiConfig';

export default function AdminHome() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [allUsers, setAllUsers] = useState([]);
    const [allClases, setAllClases] = useState([]);
    const [salesStats, setSalesStats] = useState({ LMV: 0, MJ: 0, SUELTA: 0, totalIngresos: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [tipoClaseNueva, setTipoClaseNueva] = useState('SUELTA');

    const [newStaff, setNewStaff] = useState({
        nombre: '', apellido: '', email: '', password: '', role: 'coach'
    });

    // 🟢 ACTUALIZACIÓN DINÁMICA DEL TÍTULO (Basado en lo que pediste antes)
    useEffect(() => {
        const tabTitles = {
            dashboard: 'Dashboard',
            users: 'Directorio',
            clases: 'Calendario',
            sales: 'Finanzas',
            staff: 'Equipo'
        };
        document.title = `BOOZ | Admin - ${tabTitles[activeTab] || 'Panel'}`;
        loadAdminData();
    }, [activeTab]);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            // 🟢 TODAS LAS URLS ACTUALIZADAS A API_BASE_URL
            const resUsers = await fetch(`${API_BASE_URL}/admin/usuarios-sistema`);
            const usersData = await resUsers.json();
            
            const resSales = await fetch(`${API_BASE_URL}/admin/stats-ventas`);
            const salesData = await resSales.json();

            const resClases = await fetch(`${API_BASE_URL}/clases/disponibles`);
            const clasesData = await resClases.json();

            setAllUsers(usersData);
            setSalesStats(salesData);
            setAllClases(clasesData);
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire('Error', 'No se pudo conectar con el servidor de Booz', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Tendrás que ingresar tus credenciales de nuevo.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#007AFF',
            cancelButtonColor: '#8e8e93',
            confirmButtonText: 'Cerrar Sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('user'); // Corregido de userEmail a user para limpiar sesión completa
                navigate('/login'); 
            }
        });
    };

    const handleViewExpediente = (user) => {
        Swal.fire({
            title: `<div style="display:flex; align-items:center; gap:10px; font-family:var(--font-main)">
                        <span>Ficha Médica: ${user.nombre}</span>
                    </div>`,
            html: `
                <div class="expediente-swal">
                    <div class="swal-section">
                        <h4><FaUsers/> Perfil</h4>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Teléfono:</strong> ${user.telefono || 'N/D'}</p>
                        <p><strong>Créditos:</strong> $${user.creditosDisponibles}</p>
                    </div>
                    <div class="swal-section warning">
                        <h4><FaFileMedical/> Salud y Seguridad</h4>
                        <p><strong>Lesiones:</strong> ${user.lesiones || 'Ninguna'}</p>
                        <p><strong>Alergias:</strong> ${user.alergias || 'Ninguna'}</p>
                        <p><strong>Tipo Sangre:</strong> ${user.tipoSangre || 'N/D'}</p>
                    </div>
                    <div class="swal-section">
                        <h4><FaExclamationTriangle/> Emergencia</h4>
                        <p><strong>Contacto:</strong> ${user.contactoEmergencia || 'No registrado'}</p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#007AFF',
            width: '550px',
            customClass: { popup: 'glass-card-swal' }
        });
    };

    const handleDeleteUser = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: "Se borrarán sus reservas y cuenta permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/coach/clientes/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire('Eliminado', 'Usuario borrado con éxito.', 'success');
                    loadAdminData();
                }
            } catch (e) {
                Swal.fire('Error', 'Hubo un fallo en la eliminación.', 'error');
            }
        }
    };

    const handleDeleteClase = async (id) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar clase?',
            text: "Esta sesión se quitará del calendario.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            confirmButtonText: 'Borrar Clase'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/clases/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire('Eliminada', 'Calendario actualizado.', 'success');
                    loadAdminData();
                }
            } catch (e) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    const handleDeleteAllClases = async () => {
        const confirm = await Swal.fire({
            title: '¿BORRAR TODO EL CALENDARIO?',
            text: "Se eliminarán TODAS las sesiones programadas. Esta acción es irreversible.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            confirmButtonText: 'Sí, borrar todo',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            const { value: confirmText } = await Swal.fire({
                title: 'Confirmación de seguridad',
                text: 'Escribe "BORRAR TODO" para confirmar la limpieza total:',
                input: 'text',
                inputPlaceholder: 'BORRAR TODO',
                showCancelButton: true,
                confirmButtonColor: '#FF3B30',
                confirmButtonText: 'Confirmar eliminación masiva',
                inputValidator: (value) => {
                    if (value !== 'BORRAR TODO') {
                        return 'Debes escribir la frase exacta para proceder';
                    }
                }
            });

            if (confirmText === 'BORRAR TODO') {
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/clases-reset`, { method: 'DELETE' });
                    if (res.ok) {
                        Swal.fire('Calendario Limpio', 'Se han eliminado todas las clases.', 'success');
                        loadAdminData();
                    }
                } catch (e) {
                    Swal.fire('Error', 'Hubo un fallo al intentar resetear el sistema.', 'error');
                }
            }
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            if (response.ok) {
                Swal.fire('Éxito', `${newStaff.role.toUpperCase()} registrado correctamente.`, 'success');
                setNewStaff({ nombre: '', apellido: '', email: '', password: '', role: 'coach' });
                loadAdminData();
            }
        } catch (e) {
            Swal.fire('Error de conexión.', '', 'error');
        }
    };

    const handleCreateClassAdmin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const endpoint = tipoClaseNueva === 'SUELTA' 
            ? `${API_BASE_URL}/coach/crear-suelta`
            : `${API_BASE_URL}/coach/crear-paquete`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    color: tipoClaseNueva === 'SUELTA' ? "#B49044" : "#A9B090",
                    paqueteRef: tipoClaseNueva === 'SUELTA' ? 'SUELTA' : data.paqueteRef
                })
            });
            if (res.ok) {
                Swal.fire('¡Creada!', `La clase ha sido publicada.`, 'success');
                e.target.reset();
                loadAdminData();
            }
        } catch (err) {
            Swal.fire('Error', 'No se pudo procesar la solicitud.', 'error');
        }
    };

    const clientes = allUsers.filter(u => u.role === 'cliente');
    const staff = allUsers.filter(u => u.role === 'coach' || u.role === 'admin');
    const activeMembers = clientes.filter(u => u.suscripcionActiva).length;

    const getBarHeight = (value) => {
        const maxValue = Math.max(salesStats.LMV, salesStats.MJ, salesStats.SUELTA, 1);
        return `${Math.max((value / maxValue) * 100, 5)}%`;
    };

    // 🟢 INTEGRACIÓN DEL LOADER CENTRADO QUE DISEÑAMOS
    if (loading) return (
        <div className="loader-container-full">
            <div className="loader-content">
                <img src="/isologo.png" alt="Booz Logo" className="loader-logo-spin" />
                <div className="loader-booz">Sincronizando Sistema Booz...</div>
            </div>
        </div>
    );

    return (
        <div className="admin-container animate-ios-entry">
            <aside className="admin-sidebar">
                <div className="sidebar-top">
                    <div className="admin-logo">
                        <h2>BOOZ <span>ADMIN</span></h2>
                    </div>
                    <nav className="admin-nav">
                        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                            <FaChartLine /> <span>Dashboard</span>
                        </button>
                        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                            <FaUsers /> <span>Directorio</span>
                        </button>
                        <button className={activeTab === 'clases' ? 'active' : ''} onClick={() => setActiveTab('clases')}>
                            <FaChalkboardTeacher /> <span>Clases</span>
                        </button>
                        <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
                            <FaWallet /> <span>Finanzas</span>
                        </button>
                        <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => setActiveTab('staff')}>
                            <FaUserShield /> <span>Staff</span>
                        </button>
                    </nav>
                </div>
                <div className="sidebar-bottom">
                    <button className="btn-logout" onClick={handleLogout}>
                        <FaSignOutAlt /> <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                {activeTab === 'dashboard' && (
                    <div className="admin-tab-content">
                        <header className="content-header">
                            <h1>Panel de Control</h1>
                            <p>{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
                        </header>
                        <div className="metrics-grid">
                            <div className="metric-card glass-card">
                                <div className="metric-icon blue"><FaUsers /></div>
                                <div className="metric-info"><h3>Total Clientes</h3><p className="number">{clientes.length}</p></div>
                            </div>
                            <div className="metric-card glass-card">
                                <div className="metric-icon green"><FaCheckCircle /></div>
                                <div className="metric-info"><h3>Suscripciones OK</h3><p className="number">{activeMembers}</p></div>
                            </div>
                            <div className="metric-card glass-card">
                                <div className="metric-icon gold"><FaCreditCard /></div>
                                <div className="metric-info"><h3>Caja Estimada</h3><p className="number">${salesStats.totalIngresos.toLocaleString()}</p></div>
                            </div>
                        </div>
                        <div className="dashboard-grid-dual">
                            <div className="chart-container-pro glass-card">
                                <h3>Proporción de Ventas</h3>
                                <div className="fake-chart">
                                    <div className="bar-group"><div className="bar" style={{ height: getBarHeight(salesStats.LMV) }}></div><span>LMV</span></div>
                                    <div className="bar-group"><div className="bar" style={{ height: getBarHeight(salesStats.MJ), background: '#A9B090' }}></div><span>MJ</span></div>
                                    <div className="bar-group"><div className="bar" style={{ height: getBarHeight(salesStats.SUELTA), background: '#B49044' }}></div><span>Suelta</span></div>
                                </div>
                            </div>
                            <div className="activity-card glass-card">
                                <h3><FaHistory/> Actividad en Sistema</h3>
                                <div className="activity-list">
                                    {allUsers.slice(-5).reverse().map((u, i) => (
                                        <div className="tx-item" key={i}>
                                            <div className="tx-icon"><FaUserPlus/></div>
                                            <div className="tx-info"><strong>{u.nombre} {u.apellido}</strong><span>{u.role.toUpperCase()} • {u.email}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="admin-tab-content">
                        <header className="content-header search-header">
                            <h1>Directorio de Clientes</h1>
                            <div className="search-box-pro">
                                <FaSearch />
                                <input type="text" placeholder="Nombre, email o lesiones..." onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </header>
                        <div className="admin-table-container glass-card">
                            <table className="admin-table">
                               <thead>
                                   <tr><th>Usuario</th><th>Estatus</th><th>Historial Médico</th><th>Saldo</th><th>Acciones</th></tr>
                               </thead>
                               <tbody>
                                   {clientes.filter(u => (u.nombre + u.apellido + u.email).toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                       <tr key={user.id}>
                                           <td><div className="user-profile-cell"><div className="avatar-mini">{user.nombre[0]}</div><div className="info"><strong>{user.nombre} {user.apellido}</strong><span>{user.email}</span></div></div></td>
                                           <td><span className={`status-badge ${user.suscripcionActiva ? 'active' : 'inactive'}`}>{user.planNombre || 'Sin Plan'}</span></td>
                                           <td><button className="btn-medical" onClick={() => handleViewExpediente(user)}><FaFileMedical /> Abrir Ficha</button></td>
                                           <td><strong className="price-tag">${user.creditosDisponibles}</strong></td>
                                           <td><button className="btn-icon delete" onClick={() => handleDeleteUser(user.id, user.nombre)}><FaTrashAlt /></button></td>
                                       </tr>
                                   ))}
                               </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'clases' && (
                    <div className="admin-tab-content">
                        <header className="content-header">
                            <h1>Gestión de Clases</h1>
                            <p>Administra las sesiones individuales y los paquetes mensuales</p>
                        </header>

                        <div className="dashboard-grid-dual">
                            <div className="form-container glass-card" style={{height: 'fit-content'}}>
                                <div className="form-type-selector">
                                    <button className={tipoClaseNueva === 'SUELTA' ? 'active' : ''} onClick={() => setTipoClaseNueva('SUELTA')}>Suelta</button>
                                    <button className={tipoClaseNueva !== 'SUELTA' ? 'active' : ''} onClick={() => setTipoClaseNueva('LMV')}>Mensual</button>
                                </div>
                                <form className="admin-form" onSubmit={handleCreateClassAdmin}>
                                    <div className="input-group"><label>Nombre de la Clase</label><input name="nombre" placeholder="Ej: Pilates" required /></div>
                                    {tipoClaseNueva !== 'SUELTA' && (
                                        <div className="input-group"><label>Tipo de Paquete</label><select name="paqueteRef"><option value="LMV">LMV (L-M-V)</option><option value="MJ">MJ (M-J)</option></select></div>
                                    )}
                                    <div className="input-group"><label>Temática</label><input name="tematica" placeholder="Ej: Flexibilidad" /></div>
                                    <div className="form-grid">
                                        <div className="input-group"><label>Fecha</label><input type="date" name="fechaInicio" required /></div>
                                        <div className="input-group"><label>Hora</label><input type="time" name="hora" required /></div>
                                    </div>
                                    <button type="submit" className="btn-admin-submit"><FaPlusCircle /> Publicar Clase</button>
                                </form>
                            </div>

                            <div className="admin-table-container glass-card" style={{ margin: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', alignItems: 'center' }}>
                                    <h3>Calendario Activo</h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button className="btn-danger-outline" onClick={handleDeleteAllClases} style={{ fontSize: '0.7rem', padding: '5px 10px' }}><FaTrashAlt /> Borrar Todo</button>
                                        <span className="badge-count">{allClases.length} sesiones</span>
                                    </div>
                                </div>
                                <div className="scrollable-table" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    <table className="admin-table">
                                        <thead><tr><th>Clase</th><th>Info</th><th>Acción</th></tr></thead>
                                        <tbody>
                                            {allClases.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map(clase => (
                                                <tr key={clase.id}>
                                                    <td><div className="clase-info-cell"><div className="color-indicator" style={{ background: clase.color }}></div><div><strong>{clase.nombre}</strong><span className={`mini-badge ${clase.paqueteRef}`}>{clase.paqueteRef}</span></div></div></td>
                                                    <td><div style={{ fontSize: '0.8rem' }}>{format(new Date(clase.fecha), 'dd MMM', { locale: es })}<br />{format(new Date(clase.fecha), 'HH:mm')} hrs</div></td>
                                                    <td><button className="btn-icon delete" onClick={() => handleDeleteClase(clase.id)}><FaTrashAlt /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="admin-tab-content">
                        <header className="content-header"><h1>Administración de Staff</h1></header>
                        <div className="split-view">
                            <div className="form-container glass-card">
                                <h2><FaUserPlus /> Alta de Colaborador</h2>
                                <form onSubmit={handleCreateStaff} className="admin-form">
                                    <div className="form-grid">
                                        <div className="input-group"><label>Nombre</label><input type="text" required value={newStaff.nombre} onChange={e => setNewStaff({...newStaff, nombre: e.target.value})} /></div>
                                        <div className="input-group"><label>Email</label><input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} /></div>
                                    </div>
                                    <div className="input-group"><label>Contraseña</label><input type="password" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} /></div>
                                    <div className="input-group"><label>Rol</label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}><option value="coach">Coach</option><option value="admin">Administrador</option></select></div>
                                    <button type="submit" className="btn-admin-submit">Guardar Cambios</button>
                                </form>
                            </div>
                            <div className="info-box glass-card">
                                <h3>Equipo Activo</h3>
                                <div className="staff-list-detailed">
                                    {staff.map(s => (
                                        <div key={s.id} className="staff-row"><div className="staff-info"><div className={`role-dot ${s.role}`}></div><div><strong>{s.nombre}</strong><span>{s.role}</span></div></div><FaEnvelope style={{ color: '#86868b' }} /></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="admin-tab-content">
                         <header className="content-header"><h1>Finanzas Totales</h1></header>
                        <div className="metrics-grid">
                            <div className="sales-card glass-card"><h4>Ventas LMV</h4><p className="sale-qty">{salesStats.LMV} paquetes</p><p className="sale-total">${(salesStats.LMV * 1099).toLocaleString()}</p></div>
                            <div className="sales-card glass-card"><h4>Ventas MJ</h4><p className="sale-qty">{salesStats.MJ} paquetes</p><p className="sale-total">${(salesStats.MJ * 699).toLocaleString()}</p></div>
                            <div className="sales-card glass-card"><h4>Ventas Sueltas</h4><p className="sale-qty">{salesStats.SUELTA} unidades</p><p className="sale-total">${(salesStats.SUELTA * 95).toLocaleString()}</p></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}