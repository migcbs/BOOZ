import React, { useEffect, useState } from 'react';
import { 
    FaUserAlt, FaInstagram, FaEdit, FaTrashAlt, 
    FaSearch, FaPhone, FaHeartbeat, FaCoins 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Styles.css';
// 🟢 IMPORTACIÓN DINÁMICA (Asegúrate de que la ruta sea correcta según tu carpeta)
import API_BASE_URL from '../../apiConfig'; 

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("todos");

    const fetchClientes = async () => {
        try {
            // 🟢 ACTUALIZACIÓN PARA VERCEL
            const res = await fetch(`${API_BASE_URL}/coach/clientes`);
            if (!res.ok) throw new Error("Error al obtener clientes");
            const data = await res.json();
            setClientes(data);
        } catch (err) {
            console.error("Error:", err);
            Swal.fire('Error', 'No se pudo conectar con el servidor de Booz', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    const handleDelete = async (id, nombre) => {
        const confirm = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: "Se borrarán permanentemente sus datos y reservas. Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            confirmButtonText: 'Eliminar definitivamente',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                // 🟢 ACTUALIZACIÓN PARA VERCEL
                const res = await fetch(`${API_BASE_URL}/coach/clientes/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire('Eliminado', 'Usuario borrado de la base de datos.', 'success');
                    fetchClientes();
                }
            } catch (e) {
                Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
            }
        }
    };

    const handleEdit = async (cliente) => {
        const { value: formValues } = await Swal.fire({
            title: `Expediente Profesional`,
            width: '600px',
            html: `
                <div class="swal-form-grid">
                    <div class="swal-group"><label>Nombre</label><input id="sw-nombre" class="swal2-input" value="${cliente.nombre || ''}"></div>
                    <div class="swal-group"><label>Apellido</label><input id="sw-apellido" class="swal2-input" value="${cliente.apellido || ''}"></div>
                    <div class="swal-group"><label>Teléfono</label><input id="sw-tel" class="swal2-input" value="${cliente.telefono || ''}"></div>
                    <div class="swal-group"><label>Instagram</label><input id="sw-insta" class="swal2-input" value="${cliente.instagram || ''}"></div>
                    <div class="swal-group full"><label>Créditos ($)</label><input id="sw-creditos" type="number" class="swal2-input" value="${cliente.creditosDisponibles || 0}"></div>
                    <div class="swal-group full"><label>Suscripción</label>
                        <select id="sw-status" class="swal2-input">
                            <option value="true" ${cliente.suscripcionActiva ? 'selected' : ''}>Activa</option>
                            <option value="false" ${!cliente.suscripcionActiva ? 'selected' : ''}>Inactiva</option>
                        </select>
                    </div>
                    <div class="swal-group full"><label>Notas Médicas / Lesiones</label><textarea id="sw-lesiones" class="swal2-textarea">${cliente.lesiones || ''}</textarea></div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Actualizar Booz ID',
            cancelButtonText: 'Cancelar',
            preConfirm: () => ({
                nombre: document.getElementById('sw-nombre').value,
                apellido: document.getElementById('sw-apellido').value,
                telefono: document.getElementById('sw-tel').value,
                instagram: document.getElementById('sw-insta').value,
                creditosDisponibles: document.getElementById('sw-creditos').value,
                suscripcionActiva: document.getElementById('sw-status').value === 'true',
                lesiones: document.getElementById('sw-lesiones').value
            })
        });

        if (formValues) {
            try {
                // 🟢 ACTUALIZACIÓN PARA VERCEL
                const res = await fetch(`${API_BASE_URL}/coach/update-expediente/${cliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formValues)
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        Swal.fire({ title: '¡Sincronizado!', icon: 'success', timer: 1500, showConfirmButton: false });
                        fetchClientes();
                    }
                } else {
                    throw new Error("Error en la respuesta del servidor");
                }
            } catch (e) {
                Swal.fire('Error', 'No se pudo actualizar: ' + e.message, 'error');
            }
        }
    };

    const filtered = clientes.filter(c => {
        const fullSearch = `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase();
        const matchesSearch = fullSearch.includes(searchTerm.toLowerCase());
        if (filter === "activos") return matchesSearch && c.suscripcionActiva;
        if (filter === "inactivos") return matchesSearch && !c.suscripcionActiva;
        return matchesSearch;
    });

    if (loading) return (
        <div className="loader-container-full">
            <div className="spinner-ios"></div>
            <p>Accediendo a la base de datos Booz Studio...</p>
        </div>
    );

    return (
        <div className="coach-view-container animate-ios-entry">
            <div className="stats-row">
                <div className="stat-card glass-card">
                    <span className="stat-label">Total Comunidad</span>
                    <span className="stat-value">{clientes.length}</span>
                </div>
                <div className="stat-card glass-card">
                    <span className="stat-label">Alumnos Activos</span>
                    <span className="stat-value green">{clientes.filter(c => c.suscripcionActiva).length}</span>
                </div>
            </div>

            <header className="management-header">
                <div className="title-area">
                    <h1>Comunidad Booz</h1>
                    <div className="filter-pills">
                        <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos</button>
                        <button className={filter === 'activos' ? 'active' : ''} onClick={() => setFilter('activos')}>Activos</button>
                    </div>
                </div>
                <div className="search-box-wrapper">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="management-table-wrapper glass-card">
                <table className="booz-table">
                    <thead>
                        <tr>
                            <th>Identidad</th>
                            <th>Contacto</th>
                            <th>Plan y Créditos</th>
                            <th>Estado de Salud</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(cliente => (
                            <tr key={cliente.id}>
                                <td>
                                    <div className="id-cell">
                                        <div className="avatar-main">
                                            {cliente.profileImageUrl ? 
                                                <img src={cliente.profileImageUrl} alt="perfil" /> : 
                                                <FaUserAlt />}
                                        </div>
                                        <div>
                                            <p className="name-bold">{cliente.nombre} {cliente.apellido}</p>
                                            <p className="email-small">{cliente.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td><FaPhone size={11} /> {cliente.telefono || 'N/A'}</td>
                                <td>
                                    <div className="credits-info">
                                        <div className={`status-pill ${cliente.suscripcionActiva ? 'active' : 'inactive'}`}>
                                            {cliente.planNombre || (cliente.suscripcionActiva ? 'Activo' : 'Sin Plan')}
                                        </div>
                                        <span className="credits-count">
                                            <FaCoins color="#FFD700" size={12}/> ${cliente.creditosDisponibles || 0}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className={`health-badge ${cliente.lesiones ? 'alert' : 'safe'}`} title={cliente.lesiones || 'Sin lesiones reportadas'}>
                                        <FaHeartbeat />
                                    </div>
                                </td>
                                <td>
                                    <div className="actions-row">
                                        <button className="btn-edit" title="Editar Expediente" onClick={() => handleEdit(cliente)}><FaEdit /></button>
                                        <button className="btn-del" title="Eliminar Cliente" onClick={() => handleDelete(cliente.id, cliente.nombre)}><FaTrashAlt /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No se encontraron alumnos con ese criterio.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}