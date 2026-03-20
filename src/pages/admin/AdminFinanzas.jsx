import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaChartLine, FaWallet, FaUsers, FaFire, FaDownload, FaSyncAlt } from 'react-icons/fa';
import authFetch from '../../authFetch';

// Colores Booz
const C = {
    blue:   '#8FD9FB',
    sage:   '#A9B090',
    red:    '#FC7358',
    green:  '#34C759',
    orange: '#FF9500',
    purple: '#AF52DE',
    dark:   '#1d1d1f',
    muted:  '#8e8e93',
    bg:     '#f7f8fa',
};

// ── Utilidades ─────────────────────────────────────────────
const fmt  = n => `$${Math.round(n).toLocaleString('es-MX')}`;
const pct  = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

// ── Sparkline SVG inline ───────────────────────────────────
function Sparkline({ data, color = C.blue, height = 36 }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 120, h = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * (h - 4) - 2;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Barra de progreso ──────────────────────────────────────
function BarPct({ value, max = 100, color = C.blue, height = 6 }) {
    const p = Math.min(100, pct(value, max));
    return (
        <div style={{ background: '#f2f2f7', borderRadius: 4, height, overflow: 'hidden' }}>
            <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
        </div>
    );
}

// ── Heatmap ────────────────────────────────────────────────
function Heatmap({ data }) {
    const mobile = window.innerWidth < 600;
    if (!data || data.length === 0) return <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin datos de ocupación</p>;

    const diasTodos = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const dias  = mobile ? ['Lun','Mar','Mié','Jue','Vie'] : diasTodos; // finde oculto en mobile
    const horas = [...new Set(data.map(d => d.hora))].sort();

    const getCell = (dia, hora) => data.find(d => d.dia === dia && d.hora === hora);

    const bgColor = (p) => {
        if (p === undefined) return '#f5f5f7';
        if (p === 0)  return '#f5f5f7';
        if (p < 30)  return 'rgba(143,217,251,0.15)';
        if (p < 60)  return 'rgba(143,217,251,0.40)';
        if (p < 85)  return 'rgba(143,217,251,0.70)';
        return C.blue;
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 11, fontFamily: 'Nunito, sans-serif', minWidth: 480 }}>
                <thead>
                    <tr>
                        <th style={{ color: C.muted, fontWeight: 700, paddingRight: 8, textAlign: 'right', fontSize: 10 }}></th>
                        {dias.map(d => (
                            <th key={d} style={{ color: C.muted, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 4px 6px', fontSize: 10 }}>{d}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {horas.map(hora => (
                        <tr key={hora}>
                            <td style={{ color: C.muted, fontWeight: 700, paddingRight: mobile ? 4 : 8, textAlign: 'right', fontSize: 9, whiteSpace: 'nowrap' }}>{hora}</td>
                            {dias.map(dia => {
                                const cell = getCell(dia, hora);
                                const p    = cell?.pct ?? undefined;
                                return (
                                    <td key={dia} title={cell ? `${dia} ${hora}: ${cell.inscritos}/${cell.cupo} (${p}%)` : 'Sin clases'}
                                        style={{
                                            width: 44, height: 32, borderRadius: 8,
                                            background: bgColor(p),
                                            textAlign: 'center', verticalAlign: 'middle',
                                            fontSize: 10, fontWeight: 800,
                                            color: p >= 85 ? '#fff' : p > 0 ? C.dark : 'transparent',
                                            cursor: cell ? 'default' : 'default',
                                        }}>
                                        {cell && p !== undefined ? `${p}%` : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: C.muted, fontFamily: 'Nunito, sans-serif' }}>
                {[['Sin clases','#f5f5f7'],['<30%','rgba(143,217,251,0.15)'],['30–60%','rgba(143,217,251,0.40)'],['60–85%','rgba(143,217,251,0.70)'],['85%+', C.blue]].map(([l,c]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.08)', display: 'inline-block' }} />
                        {l}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ── Tarjeta KPI ────────────────────────────────────────────
function KPI({ label, value, sub, color = C.blue, spark }) {
    return (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
                <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color, letterSpacing: -1.5, lineHeight: 1 }}>{value}</p>
                {spark && <Sparkline data={spark} color={color} />}
            </div>
            {sub && <p style={{ margin: '6px 0 0', fontSize: 11, color: C.muted, fontWeight: 600 }}>{sub}</p>}
        </div>
    );
}

// ── Sección con título ─────────────────────────────────────
function Section({ icon, title, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px', fontSize: '0.88rem', fontWeight: 900, textTransform: 'uppercase', color: C.dark }}>
                {icon} {title}
            </h3>
            {children}
        </div>
    );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────
export default function AdminFinanzas({ salesStats }) {
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const chartsRef = useRef({});
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 600);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const loadStats = async () => {
        setLoading(true); setError(null);
        try {
            const res  = await authFetch('/admin/stats-financieras');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStats(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStats(); }, []);

    // Cargar Chart.js dinámicamente y luego dibujar — redibuja cuando cambia mobile
    useEffect(() => {
        if (!stats) return;
        if (window.Chart) { drawCharts(isMobile); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
        script.onload = () => drawCharts(isMobile);
        document.head.appendChild(script);
        return () => {};
    }, [stats, isMobile]); // eslint-disable-line

    // Función de dibujo separada
    const drawCharts = (mobile = false) => {
        if (!stats || !window.Chart) return;

        const defaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
        };

        // Destruir charts previos
        Object.values(chartsRef.current).forEach(c => { try { c.destroy(); } catch {} });
        chartsRef.current = {};

        // 1. Ingresos por mes (línea)
        const c1 = document.getElementById('chart-ingresos');
        if (c1 && stats.ingresosPorMes) {
            chartsRef.current.ingresos = new window.Chart(c1, {
                type: 'line',
                data: {
                    labels: (mobile ? stats.ingresosPorMes.slice(-5) : stats.ingresosPorMes).map(m => m.mes),
                    datasets: [{
                        data: (mobile ? stats.ingresosPorMes.slice(-5) : stats.ingresosPorMes).map(m => m.ingreso),
                        borderColor: C.blue,
                        backgroundColor: 'rgba(143,217,251,0.10)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: C.blue,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    }]
                },
                options: {
                    ...defaults,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                font: { family: 'Nunito', size: 11 },
                                color: C.muted,
                                callback: v => `$${(v/1000).toFixed(0)}k`
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: 'Nunito', size: 11 }, color: C.muted }
                        }
                    },
                    plugins: {
                        ...defaults.plugins,
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${fmt(ctx.raw)}`
                            }
                        }
                    }
                }
            });
        }

        // 2. Mix paquetes (dona)
        const c2 = document.getElementById('chart-mix');
        if (c2 && stats.mixPaquetes) {
            const { LMV, MJ, SUELTA } = stats.mixPaquetes;
            chartsRef.current.mix = new window.Chart(c2, {
                type: 'doughnut',
                data: {
                    labels: ['LMV', 'MJ', 'Sueltas'],
                    datasets: [{
                        data: [LMV, MJ, SUELTA],
                        backgroundColor: [C.blue, C.sage, C.orange],
                        borderWidth: 0,
                        hoverOffset: 6,
                    }]
                },
                options: {
                    ...defaults,
                    cutout: '70%',
                    plugins: {
                        ...defaults.plugins,
                        tooltip: {
                            callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)} (${pct(ctx.raw, stats.mixPaquetes.total)}%)` }
                        }
                    }
                }
            });
        }

        // 3. Ingresos por día (barras horizontales)
        const c3 = document.getElementById('chart-dias');
        if (c3 && stats.porDia) {
            chartsRef.current.dias = new window.Chart(c3, {
                type: 'bar',
                data: {
                    labels: (mobile ? stats.porDia.slice(0,5) : stats.porDia).map(d => d.dia),
                    datasets: [{
                        data: (mobile ? stats.porDia.slice(0,5) : stats.porDia).map(d => d.ingreso),
                        backgroundColor: stats.porDia.map(d =>
                            d.ingreso === Math.max(...stats.porDia.map(x => x.ingreso))
                                ? C.blue : 'rgba(143,217,251,0.25)'
                        ),
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    ...defaults,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                font: { family: 'Nunito', size: 11 },
                                color: C.muted,
                                callback: v => `$${(v/1000).toFixed(0)}k`
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { font: { family: 'Nunito', size: 12, weight: '700' }, color: C.dark }
                        }
                    },
                    plugins: {
                        ...defaults.plugins,
                        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } }
                    }
                }
            });
        }

        // 4. Altas por mes (barras)
        const c4 = document.getElementById('chart-altas');
        if (c4 && stats.altasPorMes) {
            chartsRef.current.altas = new window.Chart(c4, {
                type: 'bar',
                data: {
                    labels: (mobile ? stats.altasPorMes.slice(-4) : stats.altasPorMes).map(m => m.mes),
                    datasets: [{
                        label: 'Nuevas alumnas',
                        data: (mobile ? stats.altasPorMes.slice(-4) : stats.altasPorMes).map(m => m.altas),
                        backgroundColor: C.green,
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    ...defaults,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                stepSize: 1,
                                font: { family: 'Nunito', size: 11 },
                                color: C.muted
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: 'Nunito', size: 11 }, color: C.muted }
                        }
                    },
                    plugins: {
                        ...defaults.plugins,
                        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} alumnas` } }
                    }
                }
            });
        }

        // 5. Espera por clase (barras)
        const c5 = document.getElementById('chart-espera');
        if (c5 && stats.clasesConEspera && stats.clasesConEspera.length > 0) {
            chartsRef.current.espera = new window.Chart(c5, {
                type: 'bar',
                data: {
                    labels: (mobile ? stats.clasesConEspera.slice(0,5) : stats.clasesConEspera).map(c => c.nombre.length > 14 ? c.nombre.slice(0,12)+'…' : c.nombre),
                    datasets: [{
                        data: (mobile ? stats.clasesConEspera.slice(0,5) : stats.clasesConEspera).map(c => c.espera),
                        backgroundColor: C.orange,
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    ...defaults,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: { stepSize: 1, font: { family: 'Nunito', size: 11 }, color: C.muted }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { font: { family: 'Nunito', size: 11 }, color: C.dark }
                        }
                    },
                    plugins: {
                        ...defaults.plugins,
                        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} en espera` } }
                    }
                }
            });
        }

    }; // fin drawCharts

    // ── Exportar CSV de estadísticas ──
    const exportCSV = () => {
        if (!stats) return;
        const rows = [
            ['Mes', 'Ingresos estimados', 'Reservas'],
            ...stats.ingresosPorMes.map(m => [m.mes, m.ingreso, m.reservas])
        ];
        const csv  = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `booz-finanzas-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f2f2f7', borderTop: `3px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: C.muted, fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>Calculando estadísticas...</p>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: C.red, fontWeight: 700, marginBottom: 16, fontFamily: 'Nunito, sans-serif' }}>Error: {error}</p>
            <button onClick={loadStats} style={{ padding: '10px 20px', background: C.blue, border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Nunito, sans-serif', fontWeight: 800, cursor: 'pointer' }}>
                <FaSyncAlt style={{ marginRight: 6 }} /> Reintentar
            </button>
        </div>
    );

    const { kpis, mixPaquetes, alumnasPorPlan, clasesMasPopulares, heatmapData, clasesConEspera, ingresosPorMes } = stats;
    const sparkData = ingresosPorMes?.map(m => m.ingreso) || [];

    return (
        <div style={{ fontFamily: 'Nunito, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 300, textTransform: 'uppercase', letterSpacing: -0.8, color: C.dark }}>
                        Inteligencia <b style={{ fontWeight: 900, color: C.blue }}>financiera</b>
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted, fontWeight: 600 }}>Estimaciones basadas en precios de lista · Se actualizan en tiempo real</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={loadStats} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#f5f5f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: 'Nunito, sans-serif', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#555', cursor: 'pointer' }}>
                        <FaSyncAlt /> Actualizar
                    </button>
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#f5f5f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: 'Nunito, sans-serif', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#555', cursor: 'pointer' }}>
                        <FaDownload /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: isMobile ? 10 : 12, marginBottom: 28 }}>
                <KPI label="Ingresos totales est."  value={fmt(kpis.totalIngresosEst)} color={C.blue}   spark={sparkData}   sub="Basado en precios de lista" />
                <KPI label="ARR estimado"            value={fmt(kpis.arrEstimado)}      color={C.blue}   sub="Si todas las activas pagan 12 meses" />
                <KPI label="LTV por alumna"          value={fmt(kpis.ltv)}              color={C.sage}   sub="Ingreso promedio por cliente" />
                <KPI label="Asistencia / mes"        value={`${kpis.asistenciaMes}x`}  color={C.green}  sub="Clases promedio por alumna" />
                <KPI label="Tasa de abandono"        value={`${kpis.churnRate}%`}       color={kpis.churnRate > 30 ? C.red : C.orange} sub="Alumnas sin plan activo" />
                <KPI label="Total reservas"          value={kpis.totalReservas.toLocaleString()} color={C.blue} sub="Excluyendo cortesías" />
            </div>

            {/* ── Fila 1: Ingresos por mes + Mix paquetes ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20, marginBottom: 20 }}>

                {/* Línea ingresos */}
                <Section icon={<FaChartLine color={C.blue} />} title="Ingresos por mes — últimos 12 meses">
                    {/* Resumen del mes actual */}
                    {ingresosPorMes && ingresosPorMes.length > 0 && (() => {
                        const actual   = ingresosPorMes[ingresosPorMes.length - 1];
                        const anterior = ingresosPorMes[ingresosPorMes.length - 2];
                        const delta    = anterior?.ingreso > 0 ? Math.round(((actual.ingreso - anterior.ingreso) / anterior.ingreso) * 100) : null;
                        return (
                            <div style={{ display: 'flex', gap: 20, marginBottom: 18, alignItems: 'baseline' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: C.dark, letterSpacing: -1 }}>{fmt(actual.ingreso)}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>Este mes ({actual.mes})</p>
                                </div>
                                {delta !== null && (
                                    <span style={{ fontSize: 13, fontWeight: 900, color: delta >= 0 ? C.green : C.red, background: delta >= 0 ? 'rgba(52,199,89,0.10)' : 'rgba(252,115,88,0.10)', padding: '3px 10px', borderRadius: 20 }}>
                                        {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs mes anterior
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                    <div style={{ position: 'relative', height: isMobile ? 160 : 200 , maxWidth: '100%', overflow: 'hidden' }}>
                        <canvas id="chart-ingresos" />
                    </div>
                </Section>

                {/* Dona mix */}
                <Section icon={<FaWallet color={C.sage} />} title="Mix de paquetes">
                    <div style={{ position: 'relative', height: isMobile ? 130 : 160, marginBottom: 16 , maxWidth: '100%', overflow: 'hidden' }}>
                        <canvas id="chart-mix" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { label: 'LMV',    valor: mixPaquetes.LMV,    color: C.blue   },
                            { label: 'MJ',     valor: mixPaquetes.MJ,     color: C.sage   },
                            { label: 'Sueltas',valor: mixPaquetes.SUELTA, color: C.orange },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.dark }}>{item.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{fmt(item.valor)}</span>
                                <span style={{ fontSize: 11, color: C.muted, width: 36, textAlign: 'right' }}>
                                    {pct(item.valor, mixPaquetes.total)}%
                                </span>
                            </div>
                        ))}
                        <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Total</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: C.dark }}>{fmt(mixPaquetes.total)}</span>
                        </div>
                    </div>
                </Section>
            </div>

            {/* ── Fila 2: Días de la semana + Altas por mes ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>

                <Section icon={<FaChartLine color={C.orange} />} title="Ingresos por día de la semana">
                    <div style={{ position: 'relative', height: isMobile ? 180 : 240 , maxWidth: '100%', overflow: 'hidden' }}>
                        <canvas id="chart-dias" />
                    </div>
                </Section>

                <Section icon={<FaUsers color={C.green} />} title="Nuevas alumnas por mes">
                    <div style={{ position: 'relative', height: isMobile ? 180 : 240 , maxWidth: '100%', overflow: 'hidden' }}>
                        <canvas id="chart-altas" />
                    </div>
                </Section>
            </div>

            {/* ── Fila 3: Alumnas por plan + Clases populares ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: 20, marginBottom: 20 }}>

                {/* Alumnas por plan */}
                <Section icon={<FaUsers color={C.blue} />} title="Alumnas por plan">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            { label: 'Plan LMV',      value: alumnasPorPlan.LMV,     color: C.blue,   total: kpis.totalClientes },
                            { label: 'Plan MJ',       value: alumnasPorPlan.MJ,      color: C.sage,   total: kpis.totalClientes },
                            { label: 'Clase suelta',  value: alumnasPorPlan.SUELTA,  color: C.orange, total: kpis.totalClientes },
                            { label: 'Sin plan',      value: alumnasPorPlan.sinPlan, color: '#e5e5ea',total: kpis.totalClientes },
                        ].map(item => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{item.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 900, color: item.color }}>
                                        {item.value} <span style={{ fontWeight: 600, color: C.muted }}>({pct(item.value, item.total)}%)</span>
                                    </span>
                                </div>
                                <BarPct value={item.value} max={item.total} color={item.color} height={7} />
                            </div>
                        ))}
                        <div style={{ paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>Activas</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: C.green }}>{kpis.activas} <span style={{ fontSize: 11, color: C.muted }}>de {kpis.totalClientes}</span></span>
                        </div>
                    </div>
                </Section>

                {/* Clases más populares */}
                <Section icon={<FaFire color={C.orange} />} title="Clases más populares">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {clasesMasPopulares.length === 0 ? (
                            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>Sin datos</p>
                        ) : clasesMasPopulares.map((c, i) => (
                            <div key={c.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color || C.blue, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
                                        {c.enEspera > 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: C.orange, background: 'rgba(255,149,0,0.10)', padding: '2px 7px', borderRadius: 20 }}>
                                                +{c.enEspera} espera
                                            </span>
                                        )}
                                        <span style={{ fontSize: 12, fontWeight: 900, color: c.pct >= 100 ? C.red : C.blue }}>
                                            {c.inscritos}/{c.cupoMaximo}
                                        </span>
                                    </div>
                                </div>
                                <BarPct value={c.inscritos} max={c.cupoMaximo} color={c.pct >= 100 ? C.red : c.pct > 70 ? C.orange : C.blue} height={5} />
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            {/* ── Fila 4: Heatmap ── */}
            <div style={{ marginBottom: 20 }}>
                <Section icon={<FaChartLine color={C.blue} />} title="Ocupación por horario — heatmap de demanda">
                    <Heatmap data={heatmapData} />
                </Section>
            </div>

            {/* ── Fila 5: Lista de espera por clase ── */}
            {clasesConEspera && clasesConEspera.length > 0 && (
                <Section icon={<FaFire color={C.orange} />} title="Demanda no atendida — clases con lista de espera">
                    <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, fontWeight: 600 }}>
                        Estas clases tienen alta demanda. Considera abrir horarios adicionales o aumentar el cupo.
                    </p>
                    <div style={{ position: 'relative', height: isMobile ? Math.max(100, clasesConEspera.length * 28 + 40) : Math.max(120, clasesConEspera.length * 40 + 60) , maxWidth: '100%', overflow: 'hidden' }}>
                        <canvas id="chart-espera" />
                    </div>
                </Section>
            )}

        </div>
    );
}