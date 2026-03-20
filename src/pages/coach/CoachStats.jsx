import React, { useState, useEffect } from 'react';
import { FaChartBar, FaUsers, FaCalendarCheck, FaClock, FaFire, FaStar } from 'react-icons/fa';
import { format, isThisWeek, isThisMonth, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import './Styles.css';
import authFetch from '../../authFetch';
import CoachLayout from './CoachLayout';
import './CoachLayout.css';

export default function CoachStats() {
    const [clases, setClases]     = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [rc, rk] = await Promise.all([
                    authFetch('/clases/disponibles'),
                    authFetch('/coach/clientes')
                ]);
                const dc = await rc.json();
                const dk = await rk.json();
                setClases(Array.isArray(dc) ? dc : []);
                setClientes(Array.isArray(dk) ? dk : []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return (
        <div className="loader-container-full">
            <div className="spinner-ios" />
        </div>
    );

    // Métricas
    const clasesEstaSemana = clases.filter(c => {
        try { return isThisWeek(new Date(c.fecha), { weekStartsOn: 1 }); } catch { return false; }
    });

    const clasesEsteMes = clases.filter(c => {
        try { return isThisMonth(new Date(c.fecha)); } catch { return false; }
    });

    const ocupacionTotal = clases.length > 0
        ? Math.round(clases.reduce((s, c) => s + (c.inscritos / Math.max(c.cupoMaximo, 1)), 0) / clases.length * 100)
        : 0;

    const clasesLlenas = clases.filter(c => c.inscritos >= c.cupoMaximo);

    // Clases con mayor ocupación
    const masPopulares = [...clases]
        .filter(c => c.cupoMaximo > 0)
        .sort((a, b) => (b.inscritos / b.cupoMaximo) - (a.inscritos / a.cupoMaximo))
        .slice(0, 5);

    // Clases con poca ocupación (oportunidad de llenar)
    const pocaOcupacion = [...clases]
        .filter(c => c.inscritos < c.cupoMaximo * 0.5 && new Date(c.fecha) > new Date())
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 4);

    // Horarios más demandados
    const horarioMap = {};
    clases.forEach(c => {
        const h = format(new Date(c.fecha), 'HH:mm');
        if (!horarioMap[h]) horarioMap[h] = { hora: h, total: 0, inscritos: 0 };
        horarioMap[h].total++;
        horarioMap[h].inscritos += c.inscritos;
    });
    const horarios = Object.values(horarioMap)
        .sort((a, b) => b.inscritos - a.inscritos)
        .slice(0, 6);

    const MetricCard = ({ icon, label, value, color, sub }) => (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', color: color || '#8FD9FB', marginBottom: 8 }}>{icon}</div>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: color || '#8FD9FB', letterSpacing: -1 }}>{value}</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
            {sub && <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#aeaeb2', fontWeight: 600 }}>{sub}</p>}
        </div>
    );

    return (
        <CoachLayout title="Estadísticas" subtitle="Métricas del estudio">
            <div className="coach-view-container animate-ios-entry">

            <div style={{ marginBottom: 30 }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 300, textTransform: 'uppercase', letterSpacing: -1 }}>
                    <FaChartBar color="#8FD9FB" style={{ marginRight: 12 }} />
                    Panel de <b style={{ fontWeight: 900, color: '#8FD9FB' }}>estadísticas</b>
                </h1>
            </div>

            {/* Métricas principales */}
            <div className="stats-row" style={{ marginBottom: 30 }}>
                <MetricCard icon={<FaCalendarCheck />} label="Clases esta semana" value={clasesEstaSemana.length} />
                <MetricCard icon={<FaCalendarCheck />} label="Clases este mes"    value={clasesEsteMes.length} color="#A9B090" />
                <MetricCard icon={<FaUsers />}         label="Alumnas activas"    value={clientes.filter(c => c.suscripcionActiva).length} color="#34C759" />
                <MetricCard icon={<FaFire />}          label="Clases llenas"      value={clasesLlenas.length} color="#FC7358" />
                <MetricCard icon={<FaChartBar />}      label="Ocupación promedio" value={`${ocupacionTotal}%`} color={ocupacionTotal > 70 ? '#34C759' : '#FF9500'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                {/* Clases más populares */}
                <div className="glass-card">
                    <h3 className="card-subtitle"><FaStar color="#FFD700" /> Clases más populares</h3>
                    {masPopulares.length === 0
                        ? <p style={{ color: '#8e8e93', fontSize: '0.85rem' }}>Sin datos aún.</p>
                        : masPopulares.map((c, i) => {
                            const pct = Math.round((c.inscritos / c.cupoMaximo) * 100);
                            return (
                                <div key={c.id} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1d1d1f', textTransform: 'uppercase' }}>
                                            {c.nombre}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: pct === 100 ? '#FC7358' : '#8FD9FB' }}>
                                            {c.inscritos}/{c.cupoMaximo}
                                        </span>
                                    </div>
                                    <div style={{ height: 6, background: '#f2f2f7', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3,
                                            width: `${pct}%`,
                                            background: pct === 100 ? '#FC7358' : pct > 70 ? '#FF9500' : '#8FD9FB',
                                            transition: 'width 0.6s ease'
                                        }} />
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Horarios más demandados */}
                <div className="glass-card">
                    <h3 className="card-subtitle"><FaClock color="#A9B090" /> Horarios más demandados</h3>
                    {horarios.length === 0
                        ? <p style={{ color: '#8e8e93', fontSize: '0.85rem' }}>Sin datos aún.</p>
                        : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {horarios.map(h => (
                                <div key={h.hora} style={{
                                    background: 'rgba(143,217,251,0.06)', borderRadius: 14,
                                    padding: '14px', textAlign: 'center',
                                    border: '1px solid rgba(143,217,251,0.15)'
                                }}>
                                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#8FD9FB', letterSpacing: -1 }}>
                                        {h.hora}
                                    </p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {h.inscritos} inscritas · {h.total} clases
                                    </p>
                                </div>
                            ))}
                          </div>
                    }
                </div>

                {/* Clases con poca ocupación */}
                <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="card-subtitle" style={{ color: '#FF9500' }}>
                        <FaFire color="#FF9500" /> Clases próximas con cupo libre — oportunidad para llenarlas
                    </h3>
                    {pocaOcupacion.length === 0
                        ? <p style={{ color: '#8e8e93', fontSize: '0.85rem' }}>Todas las próximas clases tienen buena ocupación 🎉</p>
                        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                            {pocaOcupacion.map(c => (
                                <div key={c.id} style={{
                                    background: 'rgba(255,149,0,0.05)', borderRadius: 14, padding: '16px',
                                    border: '1px solid rgba(255,149,0,0.15)'
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color || '#8FD9FB', marginBottom: 8 }} />
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', color: '#1d1d1f', textTransform: 'uppercase' }}>
                                        {c.nombre}
                                    </p>
                                    <p style={{ margin: '4px 0 6px', fontSize: '0.72rem', color: '#8e8e93' }}>
                                        {format(new Date(c.fecha), "EEEE dd MMM · HH:mm", { locale: es })}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#FF9500', fontWeight: 800 }}>
                                            {c.cupoMaximo - c.inscritos} lugares libres
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#aeaeb2' }}>
                                            {c.inscritos}/{c.cupoMaximo}
                                        </span>
                                    </div>
                                </div>
                            ))}
                          </div>
                    }
                </div>
            </div>
        </div>
        </CoachLayout>
    );
}