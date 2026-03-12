const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { addDays, parseISO, getDay, startOfDay } = require('date-fns');
const Stripe = require('stripe');

// 🟢 Adecuación: Inicialización perezosa para evitar que el servidor falle al arrancar
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ CRÍTICO: STRIPE_SECRET_KEY no definida");
        return null;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// 🟢 Adecuación para Prisma en Serverless
let prisma;
if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}

const app = express();
const PORT = process.env.PORT || 3001;

// 🟢 Adecuación de CORS
app.use(cors({ 
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = ['http://localhost:3000', 'https://booz.vercel.app'];
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS: Origen no permitido por Booz Studio'), false);
        }
        return callback(null, true);
    }, 
    credentials: true 
}));

// ======================================================
// WEBHOOK DE STRIPE
// ======================================================
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(500).send("Stripe no configurado");
    
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

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userEmail = paymentIntent.metadata.email || paymentIntent.receipt_email;
        const monto = paymentIntent.amount / 100;
        try {
            await prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: { creditosDisponibles: { increment: Math.floor(monto / 95) } }
            });
        } catch (error) { console.error("Error al actualizar créditos:", error); }
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userEmail = session.customer_email;
        const paqueteRef = session.metadata.paqueteRef;
        try {
            await prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: {
                    suscripcionActiva: true,
                    tipoCliente: paqueteRef,
                    creditosDisponibles: paqueteRef === 'SUELTA' ? { increment: 1 } : undefined
                }
            });
        } catch (error) { console.error("Error al actualizar plan:", error); }
    }
    res.json({ received: true });
});

app.use(express.json({ limit: '15mb' })); 

const COSTOS = { 'LMV': 1099, 'MJ': 699, 'SUELTA': 95 };

// ======================================================
// 1. AUTENTICACIÓN
// ======================================================
app.post('/api/signup', async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, contactoEmergencia, tipoSangre, alergias } = req.body;
        if (!nombre || !apellido || !email || !password) return res.status(400).json({ error: "Campos obligatorios" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { nombre, apellido, email: email.toLowerCase().trim(), password: hashedPassword, telefono, contactoEmergencia, tipoSangre, alergias, role: 'cliente', tipoCliente: 'REGULAR', creditosDisponibles: 0, suscripcionActiva: false }
        });
        const { password: _, ...safeUser } = newUser;
        res.json({ success: true, user: safeUser });
    } catch (e) {
        console.error("❌ ERROR SIGNUP:", e);
        res.status(500).json({ error: "Error en servidor", detalle: e.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Credenciales inválidas" });
        const { password: _, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } catch (e) { console.error("Error Login:", e); res.status(500).json({ message: "Error en servidor" }); }
});

// ======================================================
// 2. COACH
// ======================================================
app.get('/api/coach/clientes', async (req, res) => {
    try { const clientes = await prisma.user.findMany({ where: { role: 'cliente' }, orderBy: { nombre: 'asc' } }); res.json(clientes); } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.put('/api/coach/update-expediente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { nombre, apellido, telefono, instagram, creditosDisponibles, suscripcionActiva, lesiones, alergias, tipoSangre, contactoEmergencia } = req.body;
        const updated = await prisma.user.update({
            where: { id: id.trim() },
            data: { nombre, apellido, telefono, instagram, creditosDisponibles: parseInt(creditosDisponibles) || 0, suscripcionActiva: String(suscripcionActiva) === "true", lesiones, alergias, tipoSangre, contactoEmergencia }
        });
        res.json({ success: true, user: updated });
    } catch (e) { console.error("Error Update:", e); res.status(500).json({ success: false, error: "No se pudo actualizar" }); }
});

app.delete('/api/coach/clientes/:id', async (req, res) => {
    try { await prisma.$transaction([ prisma.class.deleteMany({ where: { userId: req.params.id.trim() } }), prisma.user.delete({ where: { id: req.params.id.trim() } }) ]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Error" }); }
});

// ======================================================
// 3. CLASES
// ======================================================
app.get('/api/clases/disponibles', async (req, res) => {
    try { const clases = await prisma.class.findMany({ where: { userId: null }, orderBy: { fecha: 'asc' } }); res.json(clases || []); } catch (e) { res.status(500).json([]); }
});

app.post('/api/coach/crear-paquete', async (req, res) => {
    try {
        const { nombre, tematica, descripcion, paqueteRef, hora, fechaInicio, color, imageUrl, cupoMaximo } = req.body;
        const diasValidos = paqueteRef === 'LMV' ? [1, 3, 5] : [2, 4];
        const [h, m] = hora.split(':');
        const slots = [];
        for (let i = 0; i < 28; i++) {
            let fechaBase = addDays(parseISO(fechaInicio), i);
            if (diasValidos.includes(getDay(fechaBase))) {
                const f = new Date(fechaBase); f.setHours(parseInt(h), parseInt(m), 0, 0);
                slots.push({ nombre, tematica, descripcion: descripcion || "", paqueteRef, fecha: f, color: color || "#8FD9FB", imageUrl: imageUrl || "", cupoMaximo: parseInt(cupoMaximo) || 8, inscritos: 0 });
            }
        }
        await prisma.class.createMany({ data: slots, skipDuplicates: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/coach/crear-suelta', async (req, res) => {
    try {
        const { nombre, tematica, descripcion, hora, fechaInicio, color, imageUrl, cupoMaximo } = req.body;
        const [h, m] = hora.split(':');
        const f = new Date(parseISO(fechaInicio)); f.setHours(parseInt(h), parseInt(m), 0, 0);
        const nueva = await prisma.class.create({ data: { nombre, tematica, descripcion: descripcion || "", paqueteRef: "SUELTA", fecha: f, color: color || "#8FD9FB", imageUrl: imageUrl || "", cupoMaximo: parseInt(cupoMaximo) || 8, inscritos: 0 } });
        res.json({ success: true, clase: nueva });
    } catch (e) { res.status(500).json({ error: "No se pudo crear" }); }
});

app.delete('/api/admin/clases/:id', async (req, res) => {
    try { await prisma.class.delete({ where: { id: req.params.id.trim() } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.delete('/api/admin/clases-reset', async (req, res) => {
    try { await prisma.class.deleteMany({}); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Error" }); }
});

// ======================================================
// 4. RESERVAS
// ======================================================
app.post('/api/reservas', async (req, res) => {
    try {
        const { email, claseId, metodoPago, numeroCamilla } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        const claseMaestra = await prisma.class.findUnique({ where: { id: claseId } });
        if (!user || !claseMaestra || claseMaestra.inscritos >= claseMaestra.cupoMaximo) return res.status(400).json({ message: "No disponible" });

        const result = await prisma.$transaction(async (tx) => {
            await tx.class.create({ data: { nombre: claseMaestra.nombre, fecha: claseMaestra.fecha, userId: user.id, numeroCamilla: numeroCamilla ? parseInt(numeroCamilla) : null, paqueteRef: claseMaestra.paqueteRef, tematica: claseMaestra.tematica || "Clase", color: "#8FD9FB" } });
            await tx.class.update({ where: { id: claseId }, data: { inscritos: { increment: 1 } } });
            let updateData = metodoPago === 'CREDITOS' ? { creditosDisponibles: { decrement: 1 } } : { suscripcionActiva: true };
            return await tx.user.update({ where: { id: user.id }, data: updateData, include: { reservas: { orderBy: { fecha: 'asc' } } } });
        });
        const { password: _, ...safeUser } = result;
        res.json({ success: true, userUpdated: safeUser });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/reservas/lista-espera', async (req, res) => {
    try {
        const { email, claseId } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        await prisma.waitingList.create({ data: { claseId, userId: user.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Error al anotar en lista" }); }
});

app.post('/api/reservas/cancelar', async (req, res) => {
    try {
        const { reservaId, userEmail } = req.body;
        await prisma.$transaction([ prisma.class.delete({ where: { id: reservaId } }), prisma.user.update({ where: { email: userEmail.toLowerCase() }, data: { creditosDisponibles: { increment: 1 } } }) ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/user/:email', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { email: req.params.email.toLowerCase() }, include: { reservas: { orderBy: { fecha: 'asc' } } } });
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// ======================================================
// 5. ADMIN Y ESTADÍSTICAS
// ======================================================
app.get('/api/admin/usuarios-sistema', async (req, res) => {
    try { const u = await prisma.user.findMany({ include: { reservas: true } }); res.json(u); } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/admin/stats-ventas', async (req, res) => {
    try {
        const reservas = await prisma.class.findMany({ where: { NOT: { userId: null } } });
        const resumen = {
            LMV: reservas.filter(r => r.paqueteRef === 'LMV').length,
            MJ: reservas.filter(r => r.paqueteRef === 'MJ').length,
            SUELTA: reservas.filter(r => r.paqueteRef === 'SUELTA').length,
            totalIngresos: 0
        };
        resumen.totalIngresos = (resumen.LMV * COSTOS.LMV) + (resumen.MJ * COSTOS.MJ) + (resumen.SUELTA * COSTOS.SUELTA);
        res.json(resumen);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/admin/lista-espera', async (req, res) => {
    try {
        const lista = await prisma.waitingList.findMany({
            include: { user: { select: { nombre: true, apellido: true, email: true, telefono: true } }, clase: { select: { nombre: true, fecha: true } } },
            orderBy: { createdAt: 'asc' }
        });
        res.json(lista);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.delete('/api/admin/lista-espera/:id', async (req, res) => {
    try { await prisma.waitingList.delete({ where: { id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "No se pudo eliminar" }); }
});

// 6. STRIPE INTENT
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const stripe = getStripe();
        if (!stripe) throw new Error("Stripe no inicializado");
        const { monto, email } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({ 
            amount: Math.round(parseFloat(monto) * 100), 
            currency: 'mxn', 
            metadata: { email, tipo: 'recarga_billetera' } 
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LANZAMIENTO
if (process.env.NODE_ENV !== 'production') {
    app.listen(3001, () => console.log('✅ Local server running on port 3001'));
}

module.exports = app;