// ======================================================
// Fechas en la hora del estudio (America/Mexico_City)
//
// El servidor corre en Vercel con zona UTC. Si se hace
// `fecha.setHours(21)` ahí, se guardan las 21:00 UTC, que en
// Coatepec son las 15:00 — por eso las clases aparecían 6 h antes.
// Estas funciones interpretan la hora como hora local del estudio
// sin importar la zona del servidor.
// ======================================================
const ZONA_ESTUDIO = process.env.STUDIO_TZ || 'America/Mexico_City';

// Partes de calendario (año, mes, día, hora...) de un instante en una zona
function partesEnZona(fecha, zona = ZONA_ESTUDIO) {
    const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: zona, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short'
    }).formatToParts(fecha);
    const v = Object.fromEntries(partes.map(p => [p.type, p.value]));
    const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
        year: +v.year, month: +v.month, day: +v.day,
        hour: +v.hour, minute: +v.minute, second: +v.second,
        weekday: dias[v.weekday]
    };
}

// Minutos que la zona está adelantada respecto a UTC en ese instante (México: -360)
function offsetMinutos(fecha, zona = ZONA_ESTUDIO) {
    const p = partesEnZona(fecha, zona);
    const comoUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return Math.round((comoUTC - Math.floor(fecha.getTime() / 1000) * 1000) / 60000);
}

// 'yyyy-MM-dd' + hora/minuto en hora del estudio → instante (Date) correcto
function fechaEnHoraEstudio(fechaYMD, hora, minuto = 0, zona = ZONA_ESTUDIO) {
    const [y, m, d] = String(fechaYMD).slice(0, 10).split('-').map(Number);
    const ingenua = Date.UTC(y, m - 1, d, hora, minuto);
    // Dos pasadas por si el cambio de horario cae justo entre medias
    let f = new Date(ingenua - offsetMinutos(new Date(ingenua), zona) * 60000);
    f = new Date(ingenua - offsetMinutos(f, zona) * 60000);
    return f;
}

// Suma días a 'yyyy-MM-dd' y devuelve 'yyyy-MM-dd' (sin depender de la zona)
function sumarDiasYMD(fechaYMD, dias) {
    const [y, m, d] = String(fechaYMD).slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

// Día de la semana (0 = domingo) de un 'yyyy-MM-dd'
function diaSemanaYMD(fechaYMD) {
    const [y, m, d] = String(fechaYMD).slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

module.exports = { ZONA_ESTUDIO, partesEnZona, fechaEnHoraEstudio, sumarDiasYMD, diaSemanaYMD };
