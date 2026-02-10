import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../apiConfig';
import { FaUserClock, FaWhatsapp, FaTrashAlt, FaCheck } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function AdminListaEspera() {
  const [espera, setEspera] = useState([]);

  useEffect(() => {
    fetchLista();
  }, []);

  const fetchLista = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/lista-espera`);
      const data = await res.json();
      setEspera(data);
    } catch (e) {
      console.error("Error al cargar lista:", e);
    }
  };

  const liberarLugar = async (esperaId) => {
    // Lógica para que el coach confirme que ya le dio lugar al cliente
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar cupo?',
      text: "Esto eliminará al cliente de la lista de espera.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8FD9FB'
    });

    if (isConfirmed) {
      await fetch(`${API_BASE_URL}/admin/lista-espera/${esperaId}`, { method: 'DELETE' });
      fetchLista();
    }
  };

  return (
    <div className="admin-container animate-ios-entry">
      <div className="admin-header">
        <h1><FaUserClock /> Lista de Espera</h1>
        <p>Gestiona a los clientes que esperan un lugar en sesiones llenas.</p>
      </div>

      <div className="waiting-table-wrapper">
        <table className="booz-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Clase / Sesión</th>
              <th>Fecha / Hora</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {espera.length > 0 ? espera.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="client-cell">
                    <strong>{item.user.nombre} {item.user.apellido}</strong>
                    <span>{item.user.email}</span>
                  </div>
                </td>
                <td>{item.clase.nombre}</td>
                <td>{new Date(item.clase.fecha).toLocaleString('es-MX')}</td>
                <td>
                   <a href={`https://wa.me/${item.user.telefono}`} className="wa-link">
                     <FaWhatsapp /> {item.user.telefono}
                   </a>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-done" onClick={() => liberarLugar(item.id)}>
                      <FaCheck />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="empty-msg">No hay clientes en espera actualmente.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}