import React from 'react';
import { FaDumbbell, FaPlus } from 'react-icons/fa';

export default function Rutinas() {
    return (
        <div className="coach-view-container animate-ios-entry">
            <header className="section-header">
                <h1>Planificación de Rutinas</h1>
                <p>Define los workouts para los grupos LMV y MJ</p>
            </header>

            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginTop: '30px' }}>
                <FaDumbbell size={50} style={{ color: 'var(--booz-sage)', marginBottom: '20px' }} />
                <h2>Módulo en construcción</h2>
                <p>Aquí podrás programar los ejercicios que aparecerán en la App de los clientes.</p>
                <button className="btn-save-sage" style={{ marginTop: '20px' }}>
                    <FaPlus /> Crear Nueva Rutina
                </button>
            </div>
        </div>
    );
}