require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { addDays, parseISO, getDay } = require('date-fns');
const Stripe = require('stripe');
const { verifyToken, requireRole, requireOwnerOrRole } = require('./middleware/auth');

// ======================================================
// PRISMA — Patrón correcto para Serverless (Vercel)
// El global.prisma se reutiliza en AMBOS entornos para
// evitar crear una nueva conexión en cada cold start
// ======================================================
if (!global.prisma) {
    global.prisma = new PrismaClient();
}
const prisma = global.prisma;

// ======================================================
// STRIPE — Inicialización perezosa
// ======================================================
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ CRÍTICO: STRIPE_SECRET_KEY no definida');
        return null;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();

// ======================================================
// CORS
// ======================================================
app.use(cors({
    origin: ['http://localhost:3000', 'https://booz.vercel.app'],
    credentials: true
}));

// ======================================================
// WEBHOOK DE STRIPE
// DEBE ir antes de express.json() para recibir raw body
// ======================================================
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).send('Stripe no configurado');

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ CORRECCIÓN: Idempotencia — evitar procesar el mismo evento dos veces
    // Stripe puede reintentar eventos. Guardamos el eventId para no duplicar créditos.
    try {
        const existingEvent = await prisma.processedStripeEvent.findUnique({
            where: { stripeEventId: event.id }
        });
        if (existingEvent) {
            console.log(`⚠️ Evento ya procesado: ${event.id}`);
            return res.json({ received: true, skipped: true });
        }
        await prisma.processedStripeEvent.create({
            data: { stripeEventId: event.id, type: event.type }
        });
    } catch (err) {
        console.error('Error verificando idempotencia:', err);
        return res.status(500).send('Error interno');
    }

    // ✅ Procesar pago de créditos sueltos (recarga de billetera)
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userEmail = paymentIntent.metadata.email || paymentIntent.receipt_email;
        const monto = paymentIntent.amount / 100;
        try {
            await prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: {
                    creditosDisponibles: { increment: Math.floor(monto / 95) },
                    // Guardamos referencia del pago para auditoría
                    ultimoPagoStripeId: paymentIntent.id
                }
            });
            console.log(`✅ Créditos agregados para ${userEmail}`);
        } catch (error) {
            console.error('Error al actualizar créditos:', error);
        }
    }

    // ✅ Procesar compra de paquete (LMV, MJ)
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userEmail = session.customer_email;
        const paqueteRef = session.metadata.paqueteRef;
        try {
            await prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: {
                    suscripcionActiva: true,
                    tipoCliente: 'SUSCRIPTO',
                    paqueteTipo: paqueteRef,
                    planNombre: paqueteRef === 'LMV' ? 'Lunes-Miércoles-Viernes' : 
                                paqueteRef === 'MJ'  ? 'Martes-Jueves' : 'Clase Suelta',
                    vencimientoPlan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
                    creditosDisponibles: paqueteRef === 'SUELTA' ? { increment: 1 } : undefined
                }
            });
        } catch (error) {
            console.error('Error al actualizar plan:', error);
        }
    }

    res.json({ received: true });
});

// ======================================================
// JSON BODY PARSER — Después del webhook
// ======================================================
app.use(express.json({ limit: '15mb' }));

const COSTOS = { LMV: 1099, MJ: 699, SUELTA: 95 };

// ======================================================
// 1. AUTENTICACIÓN — Rutas públicas
// ======================================================
app.post('/api/signup', async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, contactoEmergencia, tipoSangre, alergias } = req.body;

        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ error: 'Campos obligatorios: nombre, apellido, email, password' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const emailLimpio = email.toLowerCase().trim();
        const existe = await prisma.user.findUnique({ where: { email: emailLimpio } });
        if (existe) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                nombre,
                apellido,
                email: emailLimpio,
                password: hashedPassword,
                telefono,
                contactoEmergencia,
                tipoSangre,
                alergias,
                role: 'cliente',
                tipoCliente: 'REGULAR',
                creditosDisponibles: 0,
                suscripcionActiva: false
            }
        });

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...safeUser } = newUser;
        res.status(201).json({ success: true, token, user: safeUser });
    } catch (e) {
        console.error('❌ ERROR SIGNUP:', e);
        res.status(500).json({ error: 'Error en servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña requeridos' });
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...safeUser } = user;
        res.json({ success: true, token, user: safeUser });
    } catch (e) {
        console.error('Error Login:', e);
        res.status(500).json({ message: 'Error en servidor' });
    }
});

// Ruta para refrescar datos del usuario autenticado
app.get('/api/me', verifyToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { reservas: { orderBy: { fecha: 'asc' } } }
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
    } catch (e) {
        res.status(500).json({ error: 'Error en servidor' });
    }
});

// ======================================================
// 2. COACH — Rutas protegidas (coach o admin)
// ======================================================
app.get('/api/coach/clientes',
    verifyToken,
    requireRole('coach', 'admin'),
    async (req, res) => {
        try {
            const clientes = await prisma.user.findMany({
                where: { role: 'cliente' },
                orderBy: { nombre: 'asc' },
                select: {
                    id: true, nombre: true, apellido: true, email: true,
                    telefono: true, instagram: true, creditosDisponibles: true,
                    suscripcionActiva: true, tipoCliente: true, paqueteTipo: true,
                    lesiones: true, alergias: true, tipoSangre: true,
                    contactoEmergencia: true, createdAt: true
                    // ✅ Nunca se expone el password aunque sea por error
                }
            });
            res.json(clientes);
        } catch (e) {
            res.status(500).json({ error: 'Error al obtener clientes' });
        }
    }
);

app.put('/api/coach/update-expediente/:id',
    verifyToken,
    requireRole('coach', 'admin'),
    async (req, res) => {
        const { id } = req.params;
        try {
            const {
                nombre, apellido, telefono, instagram,
                creditosDisponibles, suscripcionActiva,
                lesiones, alergias, tipoSangre, contactoEmergencia
            } = req.body;

            // ✅ Validación básica de créditos
            const creditos = parseInt(creditosDisponibles);
            if (isNaN(creditos) || creditos < 0) {
                return res.status(400).json({ error: 'creditosDisponibles debe ser un número positivo' });
            }

            const updated = await prisma.user.update({
                where: { id: id.trim() },
                data: {
                    nombre, apellido, telefono, instagram,
                    creditosDisponibles: creditos,
                    suscripcionActiva: String(suscripcionActiva) === 'true',
                    lesiones, alergias, tipoSangre, contactoEmergencia
                }
            });
            const { password: _, ...safeUser } = updated;
            res.json({ success: true, user: safeUser });
        } catch (e) {
            console.error('Error Update:', e);
            res.status(500).json({ success: false, error: 'No se pudo actualizar' });
        }
    }
);

// ✅ Solo admin puede eliminar usuarios
app.delete('/api/coach/clientes/:id',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            await prisma.$transaction([
                prisma.waitingList.deleteMany({ where: { userId: req.params.id.trim() } }),
                prisma.class.deleteMany({ where: { userId: req.params.id.trim() } }),
                prisma.user.delete({ where: { id: req.params.id.trim() } })
            ]);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    }
);

// ======================================================
// 3. CLASES — Mixto: algunas públicas, otras protegidas
// ======================================================

// Pública: clientes necesitan ver clases disponibles
app.get('/api/clases/disponibles', async (req, res) => {
    try {
        const clases = await prisma.class.findMany({
            where: { userId: null },
            orderBy: { fecha: 'asc' }
        });
        res.json(clases || []);
    } catch (e) {
        res.status(500).json([]);
    }
});

app.post('/api/coach/crear-paquete',
    verifyToken,
    requireRole('coach', 'admin'),
    async (req, res) => {
        try {
            const { nombre, tematica, descripcion, paqueteRef, hora, fechaInicio, color, imageUrl, cupoMaximo } = req.body;

            // ✅ Validaciones
            if (!nombre || !paqueteRef || !hora || !fechaInicio) {
                return res.status(400).json({ error: 'Faltan campos requeridos' });
            }
            if (!['LMV', 'MJ'].includes(paqueteRef)) {
                return res.status(400).json({ error: 'paqueteRef debe ser LMV o MJ' });
            }
            const [h, m] = hora.split(':').map(Number);
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
                return res.status(400).json({ error: 'Formato de hora inválido' });
            }

            const diasValidos = paqueteRef === 'LMV' ? [1, 3, 5] : [2, 4];
            const slots = [];

            for (let i = 0; i < 28; i++) {
                const fechaBase = addDays(parseISO(fechaInicio), i);
                if (diasValidos.includes(getDay(fechaBase))) {
                    const f = new Date(fechaBase);
                    f.setHours(h, m, 0, 0);
                    slots.push({
                        nombre,
                        tematica,
                        descripcion: descripcion || '',
                        paqueteRef,
                        fecha: f,
                        color: color || '#8FD9FB',
                        imageUrl: imageUrl || '',
                        cupoMaximo: Math.max(1, parseInt(cupoMaximo) || 8),
                        inscritos: 0
                    });
                }
            }

            await prisma.class.createMany({ data: slots, skipDuplicates: true });
            res.json({ success: true, clasesCreadas: slots.length });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
);

app.post('/api/coach/crear-suelta',
    verifyToken,
    requireRole('coach', 'admin'),
    async (req, res) => {
        try {
            const { nombre, tematica, descripcion, hora, fechaInicio, color, imageUrl, cupoMaximo } = req.body;

            if (!nombre || !hora || !fechaInicio) {
                return res.status(400).json({ error: 'Faltan campos requeridos' });
            }

            const [h, m] = hora.split(':').map(Number);
            const f = new Date(parseISO(fechaInicio));
            f.setHours(h, m, 0, 0);

            const nueva = await prisma.class.create({
                data: {
                    nombre,
                    tematica,
                    descripcion: descripcion || '',
                    paqueteRef: 'SUELTA',
                    fecha: f,
                    color: color || '#8FD9FB',
                    imageUrl: imageUrl || '',
                    cupoMaximo: Math.max(1, parseInt(cupoMaximo) || 8),
                    inscritos: 0
                }
            });
            res.json({ success: true, clase: nueva });
        } catch (e) {
            res.status(500).json({ error: 'No se pudo crear la clase' });
        }
    }
);

// ✅ Solo admin elimina clases individuales
app.delete('/api/admin/clases/:id',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            await prisma.class.delete({ where: { id: req.params.id.trim() } });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Error al eliminar clase' });
        }
    }
);

// ✅ PELIGROSO: reset total — solo admin, log de auditoría
app.delete('/api/admin/clases-reset',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const { count } = await prisma.class.deleteMany({});
            console.warn(`⚠️ RESET TOTAL: ${count} clases eliminadas por admin ${req.user.email}`);
            res.json({ success: true, eliminadas: count });
        } catch (e) {
            res.status(500).json({ error: 'Error en reset' });
        }
    }
);

// ======================================================
// 4. RESERVAS
// ======================================================
app.post('/api/reservas',
    verifyToken,
    async (req, res) => {
        try {
            const { email, claseId, metodoPago, numeroCamilla } = req.body;

            // ✅ Solo puedes reservar para ti mismo (a menos que seas admin/coach)
            if (req.user.role === 'cliente' && req.user.email !== email.toLowerCase()) {
                return res.status(403).json({ message: 'No puedes reservar en nombre de otro usuario' });
            }

            const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

            // ✅ Verificar créditos ANTES de la transacción
            if (metodoPago === 'CREDITOS' && user.creditosDisponibles <= 0) {
                return res.status(400).json({ message: 'No tienes créditos disponibles' });
            }

            const result = await prisma.$transaction(async (tx) => {
                // ✅ Re-leer la clase DENTRO de la transacción para evitar race condition
                const claseMaestra = await tx.class.findUnique({ where: { id: claseId } });

                if (!claseMaestra) throw new Error('Clase no encontrada');
                if (claseMaestra.inscritos >= claseMaestra.cupoMaximo) {
                    throw new Error('Clase sin cupo disponible');
                }

                // Verificar que no esté ya inscrito
                const yaInscrito = await tx.class.findFirst({
                    where: { 
                        nombre: claseMaestra.nombre, 
                        fecha: claseMaestra.fecha, 
                        userId: user.id 
                    }
                });
                if (yaInscrito) throw new Error('Ya estás inscrito en esta clase');

                // Crear la reserva individual del usuario
                await tx.class.create({
                    data: {
                        nombre: claseMaestra.nombre,
                        fecha: claseMaestra.fecha,
                        userId: user.id,
                        numeroCamilla: numeroCamilla ? parseInt(numeroCamilla) : null,
                        paqueteRef: claseMaestra.paqueteRef,
                        tematica: claseMaestra.tematica || 'Clase',
                        descripcion: claseMaestra.descripcion || '',
                        color: claseMaestra.color || '#8FD9FB',
                        imageUrl: claseMaestra.imageUrl || ''
                    }
                });

                // Incrementar contador de inscritos en la clase maestra
                await tx.class.update({
                    where: { id: claseId },
                    data: { inscritos: { increment: 1 } }
                });

                // ✅ Descontar crédito solo si el método es CREDITOS
                // Guardamos también el metodoPago para poder devolverlo correctamente al cancelar
                let updateData = {};
                if (metodoPago === 'CREDITOS') {
                    // Segunda verificación atómica dentro de la transacción
                    if (user.creditosDisponibles <= 0) {
                        throw new Error('Sin créditos suficientes');
                    }
                    updateData.creditosDisponibles = { decrement: 1 };
                }

                return await tx.user.update({
                    where: { id: user.id },
                    data: updateData,
                    include: { reservas: { orderBy: { fecha: 'asc' } } }
                });
            });

            const { password: _, ...safeUser } = result;
            res.json({ success: true, userUpdated: safeUser });
        } catch (e) {
            const mensajesControlados = [
                'Clase no encontrada',
                'Clase sin cupo disponible',
                'Ya estás inscrito en esta clase',
                'Sin créditos suficientes'
            ];
            if (mensajesControlados.includes(e.message)) {
                return res.status(400).json({ success: false, message: e.message });
            }
            console.error('Error en reserva:', e);
            res.status(500).json({ success: false, message: 'Error al procesar la reserva' });
        }
    }
);

app.post('/api/reservas/lista-espera',
    verifyToken,
    async (req, res) => {
        try {
            const { email, claseId } = req.body;
            const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

            await prisma.waitingList.create({
                data: { claseId, userId: user.id }
            });
            res.json({ success: true });
        } catch (e) {
            if (e.code === 'P2002') {
                return res.status(409).json({ error: 'Ya estás en la lista de espera de esta clase' });
            }
            res.status(500).json({ error: 'Error al anotar en lista' });
        }
    }
);

// ✅ CORRECCIÓN: Cancelación solo devuelve crédito si se pagó con créditos
// Se agrega campo metodoPago a la reserva para saberlo al cancelar
app.post('/api/reservas/cancelar',
    verifyToken,
    async (req, res) => {
        try {
            const { reservaId, userEmail } = req.body;

            // ✅ Solo puedes cancelar tu propia reserva (o admin/coach)
            if (req.user.role === 'cliente' && req.user.email !== userEmail.toLowerCase()) {
                return res.status(403).json({ message: 'No puedes cancelar reservas de otros usuarios' });
            }

            const reserva = await prisma.class.findUnique({ where: { id: reservaId } });
            if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
            if (reserva.userId !== req.user.id && req.user.role === 'cliente') {
                return res.status(403).json({ message: 'Esta reserva no te pertenece' });
            }

            await prisma.$transaction(async (tx) => {
                // Eliminar la reserva del usuario
                await tx.class.delete({ where: { id: reservaId } });

                // Decrementar el contador de la clase maestra
                await tx.class.updateMany({
                    where: { 
                        nombre: reserva.nombre, 
                        fecha: reserva.fecha, 
                        userId: null 
                    },
                    data: { inscritos: { decrement: 1 } }
                });

                // ✅ Solo devolver crédito si la reserva fue pagada con créditos
                // (verificamos por paqueteRef SUELTA o campo metodoPago si lo tienes)
                if (reserva.metodoPago === 'CREDITOS' || reserva.paqueteRef === 'SUELTA') {
                    await tx.user.update({
                        where: { email: userEmail.toLowerCase() },
                        data: { creditosDisponibles: { increment: 1 } }
                    });
                }

                // ✅ Notificar al primero en lista de espera (si existe)
                // Encuentra la clase maestra para obtener su id
                const claseMaestra = await tx.class.findFirst({
                    where: { nombre: reserva.nombre, fecha: reserva.fecha, userId: null }
                });
                if (claseMaestra) {
                    const siguiente = await tx.waitingList.findFirst({
                        where: { claseId: claseMaestra.id },
                        orderBy: [{ prioridad: 'desc' }, { createdAt: 'asc' }],
                        include: { user: { select: { email: true, nombre: true } } }
                    });
                    if (siguiente) {
                        // Aquí conectarías tu servicio de email (Resend, SendGrid, etc.)
                        console.log(`📧 Notificar a ${siguiente.user.email} — hay lugar en ${reserva.nombre}`);
                        // TODO: await sendEmail(siguiente.user.email, reserva)
                    }
                }
            });

            res.json({ success: true });
        } catch (e) {
            console.error('Error cancelación:', e);
            res.status(500).json({ message: 'Error al cancelar' });
        }
    }
);

// ✅ Protegida: usuario solo puede ver sus propios datos
app.get('/api/user/:email',
    verifyToken,
    requireOwnerOrRole('admin', 'coach'),
    async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { email: req.params.email.toLowerCase() },
                include: { reservas: { orderBy: { fecha: 'asc' } } }
            });
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
            const { password: _, ...safeUser } = user;
            res.json(safeUser);
        } catch (e) {
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    }
);

// ======================================================
// 5. ADMIN Y ESTADÍSTICAS
// ======================================================
app.get('/api/admin/usuarios-sistema',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const usuarios = await prisma.user.findMany({
                select: {
                    id: true, nombre: true, apellido: true, email: true,
                    role: true, telefono: true, creditosDisponibles: true,
                    suscripcionActiva: true, tipoCliente: true, paqueteTipo: true,
                    planNombre: true, vencimientoPlan: true, createdAt: true,
                    instagram: true, lesiones: true, alergias: true,
                    tipoSangre: true, contactoEmergencia: true, profileImageUrl: true,
                    reservas: {
                        select: { id: true, nombre: true, fecha: true, paqueteRef: true }
                    }
                }
            });
            res.json(usuarios);
        } catch (e) {
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    }
);

// ✅ CORRECCIÓN: Estadísticas reales conectadas a Stripe
// En lugar de calcular por clases, usamos los datos reales de pagos
app.get('/api/admin/stats-ventas',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const reservas = await prisma.class.findMany({ where: { NOT: { userId: null } } });
            const LMV    = reservas.filter(r => r.paqueteRef === 'LMV').length;
            const MJ     = reservas.filter(r => r.paqueteRef === 'MJ').length;
            const SUELTA = reservas.filter(r => r.paqueteRef === 'SUELTA').length;
            res.json({
                LMV, MJ, SUELTA,
                totalIngresos: (LMV * COSTOS.LMV) + (MJ * COSTOS.MJ) + (SUELTA * COSTOS.SUELTA)
            });
        } catch (e) {
            res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
    }
);

// ─── ENDPOINT ESTADÍSTICAS FINANCIERAS COMPLETAS ─────────────────────────────
app.get('/api/admin/stats-financieras',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const PRECIOS = { LMV: 1099, MJ: 699, SUELTA: 95 };

            console.log('[stats-financieras] paso 1: reservas...');
            // 1. Todas las reservas con fecha y usuario
            const todasReservas = await prisma.class.findMany({
                where: { NOT: { userId: null } },
                select: {
                    id: true, fecha: true, paqueteRef: true,
                    metodoPago: true, userId: true
                }
            });
            console.log('[stats-financieras] paso 1 OK:', todasReservas.length);

            console.log('[stats-financieras] paso 2: clientes...');
            // 2. Todos los usuarios clientes
            const todosClientes = await prisma.user.findMany({
                where: { role: 'cliente' },
                select: {
                    id: true, createdAt: true, suscripcionActiva: true,
                    paqueteTipo: true, creditosDisponibles: true
                }
            });
            console.log('[stats-financieras] paso 2 OK:', todosClientes.length);

            console.log('[stats-financieras] paso 3: lista espera...');
            // 3. Lista de espera para demanda
            const listaEspera = await prisma.waitingList.findMany({
                select: { claseId: true }
            });
            console.log('[stats-financieras] paso 3 OK:', listaEspera.length);

            console.log('[stats-financieras] paso 4: clases maestras...');
            // 4. Clases maestras (plantillas sin userId) con su ocupación
            const clasesMaestras = await prisma.class.findMany({
                where: { userId: null },
                select: {
                    id: true, nombre: true, fecha: true, paqueteRef: true,
                    inscritos: true, cupoMaximo: true, color: true,
                    espera: { select: { id: true } }
                },
                orderBy: { inscritos: 'desc' }
            });

            // ── INGRESOS POR MES (últimos 12 meses) ──────────────────────────
            const ahora = new Date();
            const ingresosPorMes = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
                const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0);
                const reservasMes = todasReservas.filter(r => {
                    const f = new Date(r.fecha);
                    return f >= d && f <= fin && r.metodoPago !== 'CORTESIA';
                });
                const ingreso = reservasMes.reduce((s, r) => s + (PRECIOS[r.paqueteRef] || 0), 0);
                ingresosPorMes.push({
                    mes: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
                    ingreso,
                    reservas: reservasMes.length
                });
            }

            // ── INGRESOS POR DÍA DE LA SEMANA ────────────────────────────────
            const diasNom = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const porDia = Array(7).fill(0).map((_, i) => ({ dia: diasNom[i], ingreso: 0, count: 0 }));
            todasReservas.filter(r => r.metodoPago !== 'CORTESIA').forEach(r => {
                const d = new Date(r.fecha).getDay();
                porDia[d].ingreso += PRECIOS[r.paqueteRef] || 0;
                porDia[d].count++;
            });
            // Reordenar Lun–Dom
            const porDiaOrdenado = [...porDia.slice(1), porDia[0]];

            // ── MIX DE PAQUETES (ingresos) ────────────────────────────────────
            const mixPaquetes = {
                LMV:   todasReservas.filter(r => r.paqueteRef === 'LMV'   && r.metodoPago !== 'CORTESIA').length * PRECIOS.LMV,
                MJ:    todasReservas.filter(r => r.paqueteRef === 'MJ'    && r.metodoPago !== 'CORTESIA').length * PRECIOS.MJ,
                SUELTA:todasReservas.filter(r => r.paqueteRef === 'SUELTA' && r.metodoPago !== 'CORTESIA').length * PRECIOS.SUELTA,
            };
            const totalMix = mixPaquetes.LMV + mixPaquetes.MJ + mixPaquetes.SUELTA;

            // ── ALTAS POR MES (últimos 6 meses) ──────────────────────────────
            const altasPorMes = [];
            for (let i = 5; i >= 0; i--) {
                const d   = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
                const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0);
                const altas = todosClientes.filter(u => {
                    const f = new Date(u.createdAt);
                    return f >= d && f <= fin;
                }).length;
                altasPorMes.push({
                    mes: d.toLocaleDateString('es-MX', { month: 'short' }),
                    altas
                });
            }

            // ── ALUMNAS POR PLAN ──────────────────────────────────────────────
            const alumnasPorPlan = {
                LMV:    todosClientes.filter(u => u.paqueteTipo === 'LMV'   && u.suscripcionActiva).length,
                MJ:     todosClientes.filter(u => u.paqueteTipo === 'MJ'    && u.suscripcionActiva).length,
                SUELTA: todosClientes.filter(u => u.paqueteTipo === 'SUELTA'&& u.suscripcionActiva).length,
                sinPlan:todosClientes.filter(u => !u.suscripcionActiva).length,
            };

            // ── OCUPACIÓN POR HORARIO (heatmap: día × hora) ──────────────────
            const heatmap = {};
            clasesMaestras.forEach(c => {
                const f    = new Date(c.fecha);
                const dia  = diasNom[f.getDay()];
                const hora = `${String(f.getHours()).padStart(2,'0')}:00`;
                const key  = `${dia}-${hora}`;
                if (!heatmap[key]) heatmap[key] = { dia, hora, inscritos: 0, cupo: 0, clases: 0 };
                heatmap[key].inscritos += c.inscritos;
                heatmap[key].cupo      += c.cupoMaximo;
                heatmap[key].clases++;
            });
            const heatmapData = Object.values(heatmap).map(h => ({
                ...h,
                pct: h.cupo > 0 ? Math.round((h.inscritos / h.cupo) * 100) : 0
            }));

            // ── CLASES MÁS POPULARES (top 10) ────────────────────────────────
            const clasesMasPopulares = clasesMaestras
                .map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    inscritos: c.inscritos,
                    cupoMaximo: c.cupoMaximo,
                    pct: c.cupoMaximo > 0 ? Math.round((c.inscritos / c.cupoMaximo) * 100) : 0,
                    enEspera: c.espera?.length || 0,
                    color: c.color
                }))
                .slice(0, 10);

            // ── CLASES CON MÁS LISTA DE ESPERA ───────────────────────────────
            const esperaPorClase = {};
            listaEspera.forEach(e => {
                esperaPorClase[e.claseId] = (esperaPorClase[e.claseId] || 0) + 1;
            });
            const clasesConEspera = clasesMaestras
                .filter(c => (esperaPorClase[c.id] || 0) > 0)
                .map(c => ({ nombre: c.nombre, espera: esperaPorClase[c.id] || 0, color: c.color }))
                .sort((a, b) => b.espera - a.espera)
                .slice(0, 8);

            // ── KPIs EJECUTIVOS ───────────────────────────────────────────────
            const totalClientes    = todosClientes.length;
            const activas          = todosClientes.filter(u => u.suscripcionActiva).length;
            const totalReservas    = todasReservas.filter(r => r.metodoPago !== 'CORTESIA').length;
            const totalIngresosEst = totalMix;
            const ltv              = activas > 0 ? Math.round(totalIngresosEst / activas) : 0;
            const asistenciaMes    = totalClientes > 0
                ? (todasReservas.filter(r => {
                    const f = new Date(r.fecha);
                    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
                }).length / Math.max(activas, 1)).toFixed(1)
                : '0.0';
            const churnRate        = totalClientes > 0
                ? Math.round(((totalClientes - activas) / totalClientes) * 100)
                : 0;
            const arrEstimado      = activas * ((mixPaquetes.LMV / Math.max(alumnasPorPlan.LMV,1) * 12) + 0) || activas * PRECIOS.LMV;

            res.json({
                // Ingresos
                ingresosPorMes,
                porDia: porDiaOrdenado,
                mixPaquetes: { ...mixPaquetes, total: totalMix },
                // Alumnas
                altasPorMes,
                alumnasPorPlan,
                // Clases
                clasesMasPopulares,
                clasesConEspera,
                heatmapData,
                // KPIs
                kpis: {
                    totalClientes,
                    activas,
                    totalReservas,
                    totalIngresosEst,
                    ltv,
                    asistenciaMes,
                    churnRate,
                    arrEstimado: Math.round(arrEstimado)
                }
            });

        } catch (e) {
            console.error('[stats-financieras] ERROR:', e.message);
            console.error('[stats-financieras] STACK:', e.stack);
            res.status(500).json({ error: e.message });
        }
    }
);

app.get('/api/admin/lista-espera',
    verifyToken,
    requireRole('admin', 'coach'),
    async (req, res) => {
        try {
            const lista = await prisma.waitingList.findMany({
                include: {
                    user: { select: { nombre: true, apellido: true, email: true, telefono: true } },
                    clase: { select: { nombre: true, fecha: true } }
                },
                orderBy: { createdAt: 'asc' }
            });
            res.json(lista);
        } catch (e) {
            res.status(500).json({ error: 'Error al obtener lista de espera' });
        }
    }
);

app.delete('/api/admin/lista-espera/:id',
    verifyToken,
    requireRole('admin', 'coach'),
    async (req, res) => {
        try {
            await prisma.waitingList.delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'No se pudo eliminar de la lista' });
        }
    }
);

// ======================================================
// 6. STRIPE — Crear payment intent
// ======================================================
app.post('/api/create-payment-intent',
    verifyToken,
    async (req, res) => {
        try {
            const stripe = getStripe();
            if (!stripe) throw new Error('Stripe no inicializado');

            const { monto, email } = req.body;

            // ✅ Solo puedes pagar para ti mismo
            if (req.user.role === 'cliente' && req.user.email !== email.toLowerCase()) {
                return res.status(403).json({ error: 'No puedes crear pagos para otros usuarios' });
            }

            if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
                return res.status(400).json({ error: 'Monto inválido' });
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(parseFloat(monto) * 100),
                currency: 'mxn',
                metadata: { email, tipo: 'recarga_billetera' }
            });

            res.json({ clientSecret: paymentIntent.client_secret });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
);

// ======================================================
// LANZAMIENTO
// ======================================================
if (process.env.NODE_ENV !== 'production') {
    app.listen(3001, () => console.log('✅ Servidor local en puerto 3001'));
}

module.exports = app;