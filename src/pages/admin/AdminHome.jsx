import React, { useState, useEffect } from 'react';
import { 
    FaUsers, FaChartLine, FaUserPlus, FaUserShield, 
    FaTrashAlt, FaSearch, FaCreditCard, FaChalkboardTeacher,
    FaWallet, FaCheckCircle, FaFileMedical, FaHistory,
    FaEnvelope, FaExclamationTriangle, FaSignOutAlt, FaPlusCircle,
    FaClock, FaWhatsapp, FaUserClock, FaFilter
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './Styles.css';
import API_BASE_URL from '../../apiConfig';

export default function AdminHome() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [allUsers, setAllUsers] = useState([]);
    const [allClases, setAllClases] = useState([]);
    const [espera, setEspera] = useState([]); // 🟢 ESTADO PARA LISTA DE ESPERA
    const [salesStats, setSalesStats] = useState({ LMV: 0, MJ: 0, SUELTA: 0, totalIngresos: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [tipoClaseNueva, setTipoClaseNueva] = useState('SUELTA');
    const [newStaff, setNewStaff] = useState({
        nombre: '', apellido: '', email: '', password: '', role: 'coach'
    });

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
            // Ejecutamos todas las peticiones en paralelo para máxima velocidad
            const [resUsers, resSales, resClases, resEspera] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/usuarios-sistema`),
                fetch(`${API_BASE_URL}/admin/stats-ventas`),
                fetch(`${API_BASE_URL}/clases/disponibles`),
                fetch(`${API_BASE_URL}/admin/lista-espera`) // 🟢 NUEVA RUTA
            ]);

            const usersData = await resUsers.json();
            const salesData = await resSales.json();
            const clasesData = await resClases.json();
            const esperaData = await resEspera.json();

            setAllUsers(usersData);
            setSalesStats(salesData);
            setAllClases(clasesData);
            setEspera(esperaData);
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire('Error', 'Sincronización fallida con Booz HQ', 'error');
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
            confirmButtonText: 'Cerrar Sesión'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('user');
                navigate('/login'); 
            }
        });
    };

    // 🟢 GESTIÓN DE LISTA DE ESPERA (RESOLVER)
    const handleResolverEspera = async (id, nombreCliente) => {
        const { isConfirmed } = await Swal.fire({
            title: `¿Confirmar cupo para ${nombreCliente}?`,
            text: "Se eliminará de la lista de espera una vez que le asignes su lugar manualmente.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#8FD9FB',
            confirmButtonText: 'Listo, asignado'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/lista-espera/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire('Actualizado', 'Lista de espera depurada.', 'success');
                    loadAdminData();
                }
            } catch (e) {
                Swal.fire('Error', 'No se pudo actualizar.', 'error');
            }
        }
    };

    const handleViewExpediente = (user) => {
        const estaEnEspera = espera.find(e => e.userId === user.id);
        
        Swal.fire({
            title: `<div style="display:flex; align-items:center; gap:10px; font-family:var(--font-main)">
                        <span>Ficha: ${user.nombre}</span>
                    </div>`,
            html: `
                <div class="expediente-swal">
                    ${estaEnEspera ? `
                        <div style="background: #FFF9E6; border: 1px solid #FFCC00; padding: 10px; border-radius: 10px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <FaClock style="color: #FF9500" />
                            <span style="color: #856404; font-size: 12px;"><strong>USUARIO EN LISTA DE ESPERA:</strong> ${estaEnEspera.clase.nombre}</span>
                        </div>
                    ` : ''}
                    <div class="swal-section">
                        <h4><FaUsers/> Perfil</h4>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Teléfono:</strong> ${user.telefono || 'N/D'}</p>
                        <p><strong>Créditos:</strong> $${user.creditosDisponibles}</p>
                    </div>
                    <div class="swal-section warning">
                        <h4><FaFileMedical/> Salud</h4>
                        <p><strong>Lesiones:</strong> ${user.lesiones || 'Ninguna'}</p>
                        <p><strong>Alergias:</strong> ${user.alergias || 'Ninguna'}</p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#007AFF',
            width: '550px'
        });
    };

    const handleDeleteUser = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: "Se borrarán sus reservas y cuenta permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            confirmButtonText: 'Sí, eliminar'
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
        const confirm = await Swal.fire({ title: '¿Eliminar clase?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#FF3B30' });
        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/clases/${id}`, { method: 'DELETE' });
                if (res.ok) { loadAdminData(); Swal.fire('Eliminada', '', 'success'); }
            } catch (e) { Swal.fire('Error', '', 'error'); }
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
                Swal.fire('Éxito', `${newStaff.role.toUpperCase()} registrado.`, 'success');
                setNewStaff({ nombre: '', apellido: '', email: '', password: '', role: 'coach' });
                loadAdminData();
            }
        } catch (e) { Swal.fire('Error.', '', 'error'); }
    };

    const handleCreateClassAdmin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        const endpoint = tipoClaseNueva === 'SUELTA' ? `${API_BASE_URL}/coach/crear-suelta` : `${API_BASE_URL}/coach/crear-paquete`;
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    color: tipoClaseNueva === 'SUELTA' ? "#B49044" : "#A9B090",
                    paqueteRef: tipoClaseNueva === 'SUELTA' ? 'SUELTA' : data.paqueteRef,
                    cupoMaximo: parseInt(data.cupoMaximo) || 8
                })
            });
            if (res.ok) {
                Swal.fire('¡Creada!', `La clase ha sido publicada.`, 'success');
                e.target.reset();
                loadAdminData();
            }
        } catch (err) { Swal.fire('Error', '', 'error'); }
    };

    const clientes = allUsers.filter(u => u.role === 'cliente');
    const staff = allUsers.filter(u => u.role === 'coach' || u.role === 'admin');
    const activeMembers = clientes.filter(u => u.suscripcionActiva).length;

    if (loading) return (
        <div className="loader-container-full">
            <div className="loader-content">
                <img src="/isologo.png" alt="Booz Logo" className="loader-logo-spin" />
            </div>
        </div>
    );

    return (
        <div className="admin-container animate-ios-entry">
            <aside className="admin-sidebar">
                <div className="sidebar-top">
                    <div className="admin-logo"><h2>BOOZ <span>ADMIN</span></h2></div>
                    <nav className="admin-nav">
                        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><FaChartLine /> <span>Dashboard</span></button>
                        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}><FaUsers /> <span>Directorio</span></button>
                        <button className={activeTab === 'clases' ? 'active' : ''} onClick={() => setActiveTab('clases')}><FaChalkboardTeacher /> <span>Calendario</span></button>
                        <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}><FaWallet /> <span>Finanzas</span></button>
                        <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => setActiveTab('staff')}><FaUserShield /> <span>Equipo Staff</span></button>
                    </nav>
                </div>
                <div className="sidebar-bottom">
                    <button className="btn-logout" onClick={handleLogout}><FaSignOutAlt /> <span>Salir</span></button>
                </div>
            </aside>

            <main className="admin-main">
                {activeTab === 'dashboard' && (
                    <div className="admin-tab-content">
                        <header className="content-header">
                            <h1>Resumen Ejecutivo</h1>
                            <p>{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
                        </header>
                        <div className="metrics-grid">
                            <div className="metric-card glass-card">
                                <div className="metric-icon blue"><FaUsers /></div>
                                <div className="metric-info"><h3>Base Clientes</h3><p className="number">{clientes.length}</p></div>
                            </div>
                            <div className="metric-card glass-card">
                                <div className="metric-icon orange"><FaUserClock /></div>
                                <div className="metric-info"><h3>En Espera</h3><p className="number" style={{color: '#FF9500'}}>{espera.length}</p></div>
                            </div>
                            <div className="metric-card glass-card">
                                <div className="metric-icon gold"><FaCreditCard /></div>
                                <div className="metric-info"><h3>Ingresos Totales</h3><p className="number">${salesStats.totalIngresos.toLocaleString()}</p></div>
                            </div>
                        </div>

                        {/* 🟢 SECCIÓN DASHBOARD: ALERTAS DE LISTA DE ESPERA */}
                        <div className="dashboard-grid-dual">
                            <div className="activity-card glass-card">
                                <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}><FaClock color="#FF9500"/> Solicitudes en Espera</h3>
                                <div className="waiting-list-dashboard">
                                    {espera.length > 0 ? espera.slice(0, 4).map((e, i) => (
                                        <div className="waiting-item-mini" key={i}>
                                            <div className="w-info">
                                                <strong>{e.user.nombre}</strong>
                                                <span>{e.clase.nombre}</span>
                                            </div>
                                            <div className="w-actions">
                                                <a href={`https://wa.me/${e.user.telefono}`} target="_blank" rel="noreferrer"><FaWhatsapp color="#25D366"/></a>
                                                <button onClick={() => handleResolverEspera(e.id, e.user.nombre)}><FaCheckCircle color="#8FD9FB"/></button>
                                            </div>
                                        </div>
                                    )) : <p className="empty-state">No hay gente en espera. ¡Todo fluye!</p>}
                                </div>
                            </div>
                            <div className="activity-card glass-card">
                                <h3><FaHistory/> Últimos Registros</h3>
                                <div className="activity-list">
                                    {allUsers.slice(-4).reverse().map((u, i) => (
                                        <div className="tx-item" key={i}>
                                            <div className="avatar-mini">{u.nombre[0]}</div>
                                            <div className="tx-info"><strong>{u.nombre}</strong><span>{u.email}</span></div>
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
                            <h1>Directorio Booz</h1>
                            <div className="search-box-pro"><FaSearch /><input type="text" placeholder="Buscar por nombre, email o lesión..." onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        </header>
                        <div className="admin-table-container glass-card">
                            <table className="admin-table">
                               <thead>
                                   <tr><th>Cliente</th><th>Estatus / Plan</th><th>Lista Espera</th><th>Acciones</th></tr>
                               </thead>
                               <tbody>
                                   {clientes.filter(u => (u.nombre + u.apellido + u.email).toLowerCase().includes(searchTerm.toLowerCase())).map(user => {
                                       const waiting = espera.find(e => e.userId === user.id);
                                       return (
                                       <tr key={user.id}>
                                           <td><div className="user-profile-cell"><div className="avatar-mini" style={{background: user.suscripcionActiva ? '#8FD9FB' : '#eee'}}>{user.nombre[0]}</div><div className="info"><strong>{user.nombre} {user.apellido}</strong><span>{user.email}</span></div></div></td>
                                           <td><span className={`status-badge ${user.suscripcionActiva ? 'active' : 'inactive'}`}>{user.planNombre || 'Regular'}</span></td>
                                           <td>
                                               {waiting ? 
                                                    <span className="waiting-tag"><FaClock /> {waiting.clase.nombre}</span> : 
                                                    <span style={{opacity: 0.3}}>—</span>
                                               }
                                           </td>
                                           <td>
                                               <div className="table-actions">
                                                    <button className="btn-table-action" onClick={() => handleViewExpediente(user)}><FaFileMedical /></button>
                                                    <button className="btn-table-action del" onClick={() => handleDeleteUser(user.id, user.nombre)}><FaTrashAlt /></button>
                                               </div>
                                           </td>
                                       </tr>
                                   )})}
                               </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'clases' && (
                    <div className="admin-tab-content">
                        <header className="content-header"><h1>Calendario Maestros</h1></header>
                        <div className="dashboard-grid-dual">
                            <div className="form-container glass-card">
                                <div className="form-type-selector">
                                    <button className={tipoClaseNueva === 'SUELTA' ? 'active' : ''} onClick={() => setTipoClaseNueva('SUELTA')}>Clase Única</button>
                                    <button className={tipoClaseNueva !== 'SUELTA' ? 'active' : ''} onClick={() => setTipoClaseNueva('LMV')}>Programar Mes</button>
                                </div>
                                <form className="admin-form" onSubmit={handleCreateClassAdmin}>
                                    <div className="input-group"><label>Nombre</label><input name="nombre" placeholder="Ej: Power Yoga" required /></div>
                                    <div className="form-grid">
                                        <div className="input-group"><label>Hora</label><input type="time" name="hora" required /></div>
                                        <div className="input-group"><label>Cupo</label><input type="number" name="cupoMaximo" defaultValue="8" required /></div>
                                    </div>
                                    <div className="input-group"><label>Inicio</label><input type="date" name="fechaInicio" required /></div>
                                    {tipoClaseNueva !== 'SUELTA' && (
                                        <div className="input-group"><label>Paquete</label><select name="paqueteRef"><option value="LMV">L-M-V</option><option value="MJ">M-J</option></select></div>
                                    )}
                                    <button type="submit" className="btn-admin-submit"><FaPlusCircle /> Publicar en App</button>
                                </form>
                            </div>

                            {/* 🟢 TABLA DE CLASES CON DETALLE DE ESPERA */}
                            <div className="admin-table-container glass-card">
                                <h3>Sesiones Programadas</h3>
                                <div className="scrollable-table" style={{ maxHeight: '500px' }}>
                                    <table className="admin-table">
                                        <thead><tr><th>Clase</th><th>Cupo</th><th>En Espera</th><th>Acción</th></tr></thead>
                                        <tbody>
                                            {allClases.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map(clase => {
                                                const enEspera = espera.filter(e => e.claseId === clase.id).length;
                                                return (
                                                <tr key={clase.id}>
                                                    <td>
                                                        <div className="clase-info-cell">
                                                            <div className="color-indicator" style={{ background: clase.color }}></div>
                                                            <div><strong>{clase.nombre}</strong><span>{format(new Date(clase.fecha), 'dd/MM HH:mm')}</span></div>
                                                        </div>
                                                    </td>
                                                    <td><span className="cupo-indicator">{clase.inscritos || 0}/{clase.cupoMaximo || 8}</span></td>
                                                    <td>
                                                        {enEspera > 0 ? 
                                                            <b style={{color: '#FF9500', display: 'flex', alignItems: 'center', gap: '5px'}}><FaUsers/> {enEspera}</b> : 
                                                            <span style={{opacity: 0.2}}>0</span>
                                                        }
                                                    </td>
                                                    <td><button className="btn-icon delete" onClick={() => handleDeleteClase(clase.id)}><FaTrashAlt /></button></td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="admin-tab-content">
                        <header className="content-header"><h1>Gestión de Staff</h1></header>
                        <div className="split-view">
                            <div className="form-container glass-card">
                                <h2><FaUserPlus /> Nuevo Colaborador</h2>
                                <form onSubmit={handleCreateStaff} className="admin-form">
                                    <div className="input-group"><label>Nombre Completo</label><input type="text" required onChange={e => setNewStaff({...newStaff, nombre: e.target.value})} /></div>
                                    <div className="input-group"><label>Email Corporativo</label><input type="email" required onChange={e => setNewStaff({...newStaff, email: e.target.value})} /></div>
                                    <div className="input-group"><label>Contraseña</label><input type="password" required onChange={e => setNewStaff({...newStaff, password: e.target.value})} /></div>
                                    <div className="input-group"><label>Rol</label><select onChange={e => setNewStaff({...newStaff, role: e.target.value})}><option value="coach">Coach</option><option value="admin">Administrador</option></select></div>
                                    <button type="submit" className="btn-admin-submit">Dar de Alta</button>
                                </form>
                            </div>
                            <div className="info-box glass-card">
                                <h3>Equipo Booz</h3>
                                <div className="staff-list-detailed">
                                    {staff.map(s => (
                                        <div key={s.id} className="staff-row">
                                            <div className="staff-info">
                                                <div className={`role-dot ${s.role}`}></div>
                                                <div><strong>{s.nombre}</strong><span>{s.role.toUpperCase()}</span></div>
                                            </div>
                                            <FaEnvelope style={{ color: '#86868b', cursor: 'pointer' }} onClick={() => window.location.href=`mailto:${s.email}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="admin-tab-content">
                         <header className="content-header"><h1>Inteligencia Financiera</h1></header>
                        <div className="metrics-grid">
                            <div className="sales-card glass-card"><h4>Paquetes LMV</h4><p className="sale-qty">{salesStats.LMV} u.</p><p className="sale-total">${(salesStats.LMV * 1099).toLocaleString()}</p></div>
                            <div className="sales-card glass-card"><h4>Paquetes MJ</h4><p className="sale-qty">{salesStats.MJ} u.</p><p className="sale-total">${(salesStats.MJ * 699).toLocaleString()}</p></div>
                            <div className="sales-card glass-card"><h4>Clases Sueltas</h4><p className="sale-qty">{salesStats.SUELTA} u.</p><p className="sale-total">${(salesStats.SUELTA * 95).toLocaleString()}</p></div>
                        </div>
                        <div className="glass-card" style={{marginTop: '20px', padding: '30px', textAlign: 'center'}}>
                            <h2 style={{fontSize: '3rem', fontWeight: '800'}}>${salesStats.totalIngresos.toLocaleString()}</h2>
                            <p style={{opacity: 0.6, letterSpacing: '2px'}}>TOTAL INGRESOS BRUTOS ESTIMADOS</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}