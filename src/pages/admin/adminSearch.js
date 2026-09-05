// ======================================================
// adminSearch.js — motor de búsqueda del spotlight de admin
// Reglas, sin IA: rápido, gratis, determinista. No hace llamadas
// de red — corre sobre los datos que AdminHome ya trae cargados.
// ======================================================

const STOPWORDS = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'que', 'con', 'en', 'un',
    'una', 'unos', 'unas', 'y', 'a', 'para', 'tengan', 'tenga', 'como',
    'algo', 'son', 'es', 'sea', 'busca', 'buscar',
]);

// Palabra(s) clave → { type: 'categoria' | 'tab', value }
const KEYWORD_MAP = {
    alumna: { type: 'categoria', value: 'alumnas' },
    alumnas: { type: 'categoria', value: 'alumnas' },
    cliente: { type: 'categoria', value: 'alumnas' },
    clientes: { type: 'categoria', value: 'alumnas' },
    estudiante: { type: 'categoria', value: 'alumnas' },
    estudiantes: { type: 'categoria', value: 'alumnas' },

    clase: { type: 'categoria', value: 'clases' },
    clases: { type: 'categoria', value: 'clases' },
    sesion: { type: 'categoria', value: 'clases' },
    sesiones: { type: 'categoria', value: 'clases' },
    horario: { type: 'categoria', value: 'clases' },
    horarios: { type: 'categoria', value: 'clases' },

    coach: { type: 'categoria', value: 'equipo' },
    coaches: { type: 'categoria', value: 'equipo' },
    equipo: { type: 'categoria', value: 'equipo' },
    staff: { type: 'categoria', value: 'equipo' },
    instructor: { type: 'categoria', value: 'equipo' },
    instructora: { type: 'categoria', value: 'equipo' },
    instructores: { type: 'categoria', value: 'equipo' },

    dashboard: { type: 'tab', value: 'dashboard' },
    resumen: { type: 'tab', value: 'dashboard' },
    espera: { type: 'tab', value: 'espera' },
    calendario: { type: 'tab', value: 'clases' },
    finanzas: { type: 'tab', value: 'sales' },
    ventas: { type: 'tab', value: 'sales' },
    ingresos: { type: 'tab', value: 'sales' },
    configuracion: { type: 'tab', value: 'config' },
    config: { type: 'tab', value: 'config' },
    alta: { type: 'tab', value: 'alta' },
};

const TAB_LABELS = {
    dashboard: 'Dashboard', users: 'Alumnas', espera: 'Espera', clases: 'Calendario',
    alta: 'Nuevo usuario', staff: 'Equipo', sales: 'Finanzas', config: 'Configuración',
};

export const normalize = (s) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();

const tokenize = (query) =>
    normalize(query)
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => !STOPWORDS.has(w));

// true si TODOS los términos aparecen como substring en alguno de los campos
const matchesAllTerms = (terms, fields) => {
    const haystack = normalize(fields.filter(Boolean).join(' | '));
    return terms.every((t) => haystack.includes(t));
};

const MAX_PER_GROUP = 6;

/**
 * @param {string} query
 * @param {{ allUsers: object[], allClases: object[] }} data
 * @returns {{ alumnas: object[], equipo: object[], clases: object[], secciones: object[] }}
 */
export function adminSearch(query, { allUsers = [], allClases = [] } = {}) {
    const empty = { alumnas: [], equipo: [], clases: [], secciones: [] };
    const tokens = tokenize(query);
    if (tokens.length === 0) return empty;

    // ── Detectar categoría o salto de sección en el primer término ──
    let categoria = null;
    let terms = tokens;
    const first = KEYWORD_MAP[tokens[0]];
    if (first) {
        if (first.type === 'tab') {
            empty.secciones.push({ tabId: first.value, label: TAB_LABELS[first.value] || first.value });
        } else {
            categoria = first.value;
            terms = tokens.slice(1);
        }
    }

    // Si tras quitar la categoría no queda ningún término, no hay nada
    // que filtrar dentro de esa categoría — solo se ofrece saltar a la
    // sección equivalente cuando aplica (ej. "alumnas" sola → tab Alumnas).
    if (categoria && terms.length === 0) {
        if (categoria === 'alumnas') empty.secciones.push({ tabId: 'users', label: 'Alumnas' });
        if (categoria === 'clases')  empty.secciones.push({ tabId: 'clases', label: 'Calendario' });
        if (categoria === 'equipo')  empty.secciones.push({ tabId: 'staff', label: 'Equipo' });
        return empty;
    }

    const clientes = allUsers.filter((u) => u.role === 'cliente');
    const staff    = allUsers.filter((u) => u.role === 'coach' || u.role === 'admin');

    const userFields = (u) => [u.nombre, u.apellido, u.email, u.telefono, u.instagram, u.tipoSangre, u.alergias, u.lesiones];
    const claseFields = (c) => [c.nombre, c.tematica, c.descripcion, ...(Array.isArray(c.criterios) ? c.criterios : [])];

    const buscarAlumnas = !categoria || categoria === 'alumnas';
    const buscarEquipo  = !categoria || categoria === 'equipo';
    const buscarClases  = !categoria || categoria === 'clases';

    return {
        alumnas: buscarAlumnas
            ? clientes.filter((u) => matchesAllTerms(terms, userFields(u))).slice(0, MAX_PER_GROUP)
            : [],
        equipo: buscarEquipo
            ? staff.filter((u) => matchesAllTerms(terms, userFields(u))).slice(0, MAX_PER_GROUP)
            : [],
        clases: buscarClases
            ? allClases.filter((c) => matchesAllTerms(terms, claseFields(c))).slice(0, MAX_PER_GROUP)
            : [],
        secciones: empty.secciones,
    };
}

export const hasAnyResult = (results) =>
    results.alumnas.length + results.equipo.length + results.clases.length + results.secciones.length > 0;
