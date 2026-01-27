import React, { useState } from 'react';
// Añadimos FaInstagram
import { FaSave, FaTimes, FaCamera, FaUserCircle, FaStethoscope, FaInstagram } from 'react-icons/fa';
import './Styles.css';

export default function ProfileEditForm({ initialData, onSave, onCancel }) {
    const [form, setForm] = useState({
        ...initialData,
        fechaNacimiento: initialData.fechaNacimiento ? initialData.fechaNacimiento.split('T')[0] : "",
        tipoSangre: initialData.tipoSangre || "",
        alergias: initialData.alergias || "",
        lesiones: initialData.lesiones || "",
        instagram: initialData.instagram || "" // Nuevo campo
    });

    const [imagePreview, setImagePreview] = useState(initialData.profileImageUrl || null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5000000) {
                alert("Imagen muy grande. Máximo 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setForm(p => ({ ...p, profileImageUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="profile-edit-form-container animate-ios-entry">
            <header className="edit-header-box">
                <h2 className="profile-title">Mi Perfil <b>Booz</b></h2>
                <p className="profile-subtitle">Configura tu identidad y datos de salud</p>
            </header>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-photo-edit-section">
                    <div className="profile-image-container">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Perfil" className="profile-preview-img" />
                        ) : (
                            <div className="profile-icon-placeholder"><FaUserCircle /></div>
                        )}
                        <label htmlFor="profileImage" className="camera-badge" title="Cambiar foto">
                            <FaCamera size={16} />
                        </label>
                    </div>
                    <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
                
                <div className="form-section">
                    <div className="input-row-grid">
                        <div className="input-group">
                            <label>Nombre</label>
                            <input name="nombre" className="ios-input-sage" placeholder="Tu nombre" value={form.nombre} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label>Apellido</label>
                            <input name="apellido" className="ios-input-sage" placeholder="Tu apellido" value={form.apellido} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-row-grid">
                        <div className="input-group">
                            <label>Teléfono Móvil</label>
                            <input name="telefono" type="tel" className="ios-input-sage" placeholder="+52..." value={form.telefono} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>F. de Nacimiento</label>
                            <input name="fechaNacimiento" type="date" className="ios-input-sage" value={form.fechaNacimiento} onChange={handleChange} />
                        </div>
                    </div>

                    {/* NUEVO CAMPO: INSTAGRAM */}
                    <div className="input-group full-width-input">
                        <label>Instagram</label>
                        <div className="instagram-input-wrapper">
                            <FaInstagram className="insta-icon-prefix" />
                            <span className="at-symbol">@</span>
                            <input 
                                name="instagram" 
                                className="ios-input-sage insta-field" 
                                placeholder="usuario" 
                                value={form.instagram} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>
                </div>

                <div className="medical-section-glass">
                    <div className="section-divider">
                        <FaStethoscope /> <span>Información Médica Vital</span>
                    </div>
                    
                    <div className="input-row-grid">
                        <div className="input-group">
                            <label>Tipo de Sangre</label>
                            <select name="tipoSangre" className="ios-input-sage select-ios" value={form.tipoSangre} onChange={handleChange}>
                                <option value="">Desconocido</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Contacto de Emergencia</label>
                            <input name="contactoEmergencia" className="ios-input-sage" placeholder="Nombre y Tel." value={form.contactoEmergencia} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Alergias Conocidas</label>
                        <input name="alergias" className="ios-input-sage" placeholder="Ej. Penicilina, polen..." value={form.alergias} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label>Lesiones o Condiciones</label>
                        <textarea name="lesiones" className="ios-input-sage area" placeholder="¿Alguna lesión previa?" value={form.lesiones} onChange={handleChange} />
                    </div>
                </div>
                
                <div className="form-actions">
                    <button className="btn-save-sage" type="submit">
                        <FaSave /> Guardar Perfil
                    </button>
                    <button type="button" onClick={onCancel} className="btn-cancel-glass">
                        <FaTimes /> Volver
                    </button>
                </div>
            </form>
        </div>
    );
}