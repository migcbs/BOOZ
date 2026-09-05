import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaTimes, FaUser, FaUserShield, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { adminSearch, hasAnyResult } from './adminSearch';

// `query`/`onQueryChange` son controlados desde AdminHome: el mismo campo
// también sigue filtrando la tabla de Alumnas cuando esa pestaña está
// activa (comportamiento ya existente, `filteredUsers`) — el spotlight
// se suma encima, no lo reemplaza.
export default function AdminSpotlight({ allUsers, allClases, query, onQueryChange, onGoToTab, onOpenAlumna }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const results = adminSearch(query, { allUsers, allClases });
    const show = open && query.trim().length > 0;

    useEffect(() => {
        const onClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        };
        const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    const goTo = (tabId) => {
        onGoToTab(tabId);
        setOpen(false);
        onQueryChange('');
    };

    const openAlumna = (user) => {
        onOpenAlumna(user);
        setOpen(false);
        onQueryChange('');
    };

    return (
        <div className="adm-spotlight-wrapper" ref={wrapperRef}>
            <div className="adm-topbar-search">
                <FaSearch />
                <input
                    placeholder="Buscar alumnas, clases, equipo, secciones..."
                    value={query}
                    onChange={(e) => { onQueryChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                />
                {query && <button onClick={() => onQueryChange('')}><FaTimes /></button>}
            </div>

            {show && (
                <div className="adm-spotlight-panel animate-ios-pop">
                    {!hasAnyResult(results) ? (
                        <p className="adm-spotlight-empty">Sin resultados para "{query}"</p>
                    ) : (
                        <>
                            {results.secciones.length > 0 && (
                                <div className="adm-spotlight-group">
                                    <p className="adm-spotlight-group-label">Ir a sección</p>
                                    {results.secciones.map((s) => (
                                        <button key={s.tabId} className="adm-spotlight-item" onClick={() => goTo(s.tabId)}>
                                            <FaArrowRight className="adm-spotlight-icon" />
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.alumnas.length > 0 && (
                                <div className="adm-spotlight-group">
                                    <p className="adm-spotlight-group-label">Alumnas</p>
                                    {results.alumnas.map((u) => (
                                        <button key={u.id} className="adm-spotlight-item" onClick={() => openAlumna(u)}>
                                            <FaUser className="adm-spotlight-icon" />
                                            <span className="adm-spotlight-item-main">{u.nombre} {u.apellido}</span>
                                            <span className="adm-spotlight-item-sub">{u.email}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.equipo.length > 0 && (
                                <div className="adm-spotlight-group">
                                    <p className="adm-spotlight-group-label">Equipo</p>
                                    {results.equipo.map((u) => (
                                        <button key={u.id} className="adm-spotlight-item" onClick={() => openAlumna(u)}>
                                            <FaUserShield className="adm-spotlight-icon" />
                                            <span className="adm-spotlight-item-main">{u.nombre} {u.apellido}</span>
                                            <span className="adm-spotlight-item-sub">{u.email}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.clases.length > 0 && (
                                <div className="adm-spotlight-group">
                                    <p className="adm-spotlight-group-label">Clases</p>
                                    {results.clases.map((c) => (
                                        <button key={c.id} className="adm-spotlight-item" onClick={() => goTo('clases')}>
                                            <FaCalendarAlt className="adm-spotlight-icon" />
                                            <span className="adm-spotlight-item-main">{c.nombre}</span>
                                            <span className="adm-spotlight-item-sub">{c.tematica || ''}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
