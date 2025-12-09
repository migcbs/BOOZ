// ProfileEditForm.jsx

import React, { useState } from 'react';
import { FaSave, FaTimes, FaCamera } from 'react-icons/fa'; // Importamos FaCamera
import './Styles.css';

export default function ProfileEditForm({ initialData, onSave, onCancel }) {
    
    // 🟢 Usamos los datos completos del usuario como estado inicial
    const [form, setForm] = useState(initialData);
    const [errors, setErrors] = useState({});
    
    // 🟢 Nuevo estado para la vista previa de la imagen
    const [imagePreview, setImagePreview] = useState(initialData.profileImageUrl || "https://i.pravatar.cc/150?img=49");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
        // Limpia el error al empezar a escribir
        setErrors(prev => ({ ...prev, [name]: '' })); 
    };

    // 🟢 NUEVA FUNCIÓN: Manejar la selección de archivos
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 1. Simular la previsualización local (lectura de archivo)
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            // 2. Simular la subida y obtención de URL (Placeholder)
            // En un entorno real, aquí se subiría a la nube y se obtendría la URL.
            const newImageUrl = `https://i.pravatar.cc/150?u=${Date.now()}`; 
            
            // Actualizar el formulario con la nueva URL simulada
            setForm((p) => ({ ...p, profileImageUrl: newImageUrl }));
        }
    };

    // Validación simplificada para la edición
    const validate = () => {
        const e = {};
        if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
        if (!form.apellido.trim()) e.apellido = "El apellido es obligatorio.";
        if (!form.telefono.trim()) e.telefono = "El teléfono es obligatorio.";
        if (!form.fechaNacimiento) e.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
        if (!form.contactoEmergencia.trim()) e.contactoEmergencia = "Contacto de emergencia requerido.";
        
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            // Pasamos los datos actualizados a la función de guardado
            onSave(form); 
        } else {
            alert("Por favor, corrige los errores en el formulario.");
        }
    };

    return (
        <div className="auth-container profile-edit-form-container">
            <h2 className="auth-title">Editar Datos Personales</h2>
            
            <form onSubmit={handleSubmit} noValidate>
                
                {/* 🟢 SECCIÓN DE EDICIÓN DE FOTO DE PERFIL */}
                <div className="profile-photo-edit-section">
                    <img 
                        src={imagePreview} 
                        alt="Foto de Perfil" 
                        className="profile-picture-edit"
                    />
                    <input 
                        type="file" 
                        id="profileImage" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        style={{ display: 'none' }} 
                    />
                    <label htmlFor="profileImage" className="btn-upload-photo">
                        <FaCamera /> Cambiar Foto
                    </label>
                </div>
                
                {/* --- DATOS PERSONALES --- */}
                <label htmlFor="nombre">Nombre</label>
                <input name="nombre" id="nombre" className="auth-input" value={form.nombre} onChange={handleChange} />
                {errors.nombre && <p className="error-text">{errors.nombre}</p>}

                <label htmlFor="apellido">Apellido</label>
                <input name="apellido" id="apellido" className="auth-input" value={form.apellido} onChange={handleChange} />
                {errors.apellido && <p className="error-text">{errors.apellido}</p>}

                <label htmlFor="telefono">Teléfono</label>
                <input name="telefono" id="telefono" type="tel" className="auth-input" value={form.telefono} onChange={handleChange} />
                {errors.telefono && <p className="error-text">{errors.telefono}</p>}

                <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                <input name="fechaNacimiento" id="fechaNacimiento" type="date" className="auth-input" value={form.fechaNacimiento} onChange={handleChange} />
                {errors.fechaNacimiento && <p className="error-text">{errors.fechaNacimiento}</p>}

                {/* --- DATOS MÉDICOS --- */}
                <div className="medical-info-section">
                    <h3>Información Médica</h3>
                    <label htmlFor="contactoEmergencia">Contacto de emergencia</label>
                    <input name="contactoEmergencia" id="contactoEmergencia" className="auth-input" value={form.contactoEmergencia} onChange={handleChange} />
                    {errors.contactoEmergencia && <p className="error-text">{errors.contactoEmergencia}</p>}
                    
                    <label htmlFor="enfermedades">Lesiones previas (detalles)</label>
                    <textarea name="lesiones" id="lesiones" className="auth-input" rows="3" value={form.lesiones} onChange={handleChange} />
                    
                    <label htmlFor="condicion">Condición médica actual</label>
                    <select name="condicion" id="condicion" className="auth-input" value={form.condicion} onChange={handleChange}>
                      <option value="">Ninguna</option>
                      <option value="hipertenso">Hipertenso</option>
                      <option value="diabetico">Diabético</option>
                      <option value="presion-baja">Presión baja</option>
                      <option value="otro">Otro</option>
                    </select>

                    {form.condicion === "otro" && (
                      <>
                        <label htmlFor="condicionOtro">Especificar otra condición</label>
                        <input name="condicionOtro" id="condicionOtro" className="auth-input" value={form.condicionOtro} onChange={handleChange} />
                      </>
                    )}
                </div>
                
                {/* --- BOTONES DE ACCIÓN --- */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                    <button className="auth-button" type="submit" style={{ flex: 1 }}>
                      <FaSave /> Guardar Cambios
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="auth-secondary-btn"
                        style={{ flex: 1 }}
                    >
                        <FaTimes /> Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}