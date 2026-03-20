import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaChevronLeft, FaSignOutAlt, FaHome,
    FaCalendarAlt, FaUsers, FaClock,
    FaChartBar, FaDumbbell
} from 'react-icons/fa';

const NAV_ITEMS = [
    { path: '/coach/home',       label: 'Inicio',     icon: <FaHome />         },
    { path: '/coach/calendario', label: 'Calendario', icon: <FaCalendarAlt />  },
    { path: '/coach/clientes',   label: 'Alumnas',    icon: <FaUsers />        },
    { path: '/coach/espera',     label: 'Espera',     icon: <FaClock />        },
    { path: '/coach/stats',      label: 'Stats',      icon: <FaChartBar />     },
    { path: '/coach/rutinas',    label: 'Temáticas',  icon: <FaDumbbell />     },
];

export default function CoachLayout({ children, title, subtitle }) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const isHome    = location.pathname === '/coach/home';

    const handleLogout = () => {
        localStorage.removeItem('booz_token');
        localStorage.removeItem('booz_user');
        navigate('/login');
    };

    return (
        <div className="cl-wrapper">

            {/* ── TOP BAR ── */}
            <div className="cl-topbar">
                <div className="cl-topbar-left">
                    {!isHome && (
                        <button className="cl-back-btn" onClick={() => navigate('/coach/home')}
                            aria-label="Volver al inicio">
                            <FaChevronLeft />
                            <span>Inicio</span>
                        </button>
                    )}
                    {title && (
                        <div className="cl-topbar-title">
                            <h1>{title}</h1>
                            {subtitle && <p>{subtitle}</p>}
                        </div>
                    )}
                </div>
                <button className="cl-logout-btn" onClick={handleLogout} aria-label="Cerrar sesión">
                    <FaSignOutAlt />
                    <span>Salir</span>
                </button>
            </div>

            {/* ── CONTENIDO ── */}
            <div className="cl-content">
                {children}
            </div>

            {/* ── BARRA DE NAVEGACIÓN INFERIOR (mobile) ── */}
            <nav className="cl-bottom-nav">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.path}
                        className={`cl-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

        </div>
    );
}