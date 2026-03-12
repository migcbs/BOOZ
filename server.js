const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { addDays, parseISO, getDay, startOfDay } = require('date-fns');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🟢 Adecuación para Prisma en Serverless (Vercel)
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

// 🟢 Adecuación de CORS para Producción
const allowedOrigins = [
    'http://localhost:3000',
    'https://booz.vercel.app'
];

app.use(cors({ 
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS: Origen no permitido por Booz Studio'), false);
        }
        return callback(null, true);
    }, 
    credentials: true 
}));

// IMPORTANTE: Para el Webhook necesitamos el body en formato RAW.
// Debes poner esta ruta ANTES de app.use(express.json())
// ======================================================
// WEBHOOK DE STRIPE (Actualizado para pagos de Billetera y Checkout)
// ======================================================

// 1. ENDPOINT: WEBHOOK (Debe ir antes de express.json())
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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

    // Manejo de Pago desde el Modal (Billetera / Recargas)
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userEmail = paymentIntent.metadata.email || paymentIntent.receipt_email;
        const monto = paymentIntent.amount / 100;

        console.log(`💰 Pago exitoso (Billetera) de $${monto} para: ${userEmail}`);

        try {
            await prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: {
                    // Regla Booz: $95 MXN = 1 Crédito
                    creditosDisponibles: { increment: Math.floor(monto / 95) }
                }
            });
        } catch (error) {
            console.error("Error al actualizar créditos:", error);
        }
    }

    // Manejo de Pago desde Checkout (Planes fijos)
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
        } catch (error) {
            console.error("Error al actualizar plan:", error);
        }
    }

    res.json({ received: true });
});

// 2. ENDPOINT: CREAR INTENCIÓN DE PAGO (Para el Modal)
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { monto, email } = req.body;
        const amountInCents = Math.round(parseFloat(monto) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'mxn',
            receipt_email: email,
            metadata: { email, tipo: 'recarga_billetera' },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use(express.json({ limit: '15mb' })); 

// Reglas de Negocio (Precios de Booz)
const COSTOS = {
    'LMV': 1099,
    'MJ': 699,
    'SUELTA': 95
};

// ======================================================
// 1. AUTENTICACIÓN Y REGISTRO
// ======================================================

app.post('/api/signup', async (req, res) => {
    try {
        const { 
            nombre, apellido, email, password, telefono, 
            contactoEmergencia, tipoSangre, alergias 
        } = req.body;

        // Validación crítica
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ error: "Campos obligatorios faltantes" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                nombre,
                apellido,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                telefono: telefono || null,
                contactoEmergencia: contactoEmergencia || null,
                tipoSangre: tipoSangre || null,
                alergias: alergias || null,
                role: 'cliente',
                tipoCliente: 'REGULAR', 
                creditosDisponibles: 0,
                suscripcionActiva: false
            }
        });

        const { password: _, ...safeUser } = newUser;
        res.json({ success: true, user: safeUser });
    } catch (e) {
        // Log para Vercel (muy importante)
        console.error("❌ ERROR DETALLADO EN SIGNUP:", e);

        // Respuesta al frontend para debuggear rápido
        res.status(500).json({ 
            error: "Error interno en el servidor", 
            detalle: e.message,
            codigo: e.code 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ 
            where: { email: email.toLowerCase() } 
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const { password: _, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } catch (e) {
        console.error("Error Login:", e);
        res.status(500).json({ message: "Error en el servidor durante el login" });
    }
});

// ======================================================
// 2. GESTIÓN DE CLIENTES (PANEL COACH)
// ======================================================

app.get('/api/coach/clientes', async (req, res) => {
    try {
        const clientes = await prisma.user.findMany({
            where: { role: 'cliente' },
            orderBy: { nombre: 'asc' }
        });
        res.json(clientes);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener lista de clientes" });
    }
});

app.put('/api/coach/update-expediente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { 
            nombre, apellido, telefono, instagram, 
            creditosDisponibles, suscripcionActiva, 
            lesiones, alergias, tipoSangre, contactoEmergencia 
        } = req.body;

        const updated = await prisma.user.update({
            where: { id: id.trim() },
            data: {
                nombre,
                apellido,
                telefono,
                instagram,
                creditosDisponibles: parseInt(creditosDisponibles) || 0,
                suscripcionActiva: String(suscripcionActiva) === "true",
                lesiones,
                alergias,
                tipoSangre,
                contactoEmergencia
            }
        });
        res.json({ success: true, user: updated });
    } catch (e) {
        console.error("Error Update Expediente:", e);
        res.status(500).json({ success: false, error: "No se pudo actualizar el expediente" });
    }
});

app.delete('/api/coach/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.$transaction([
            prisma.class.deleteMany({ where: { userId: id.trim() } }),
            prisma.user.delete({ where: { id: id.trim() } })
        ]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar el cliente y sus registros" });
    }
});

// ======================================================
// 3. LÓGICA DE CLASES (OFERTA Y CALENDARIO)
// ======================================================

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

app.post('/api/coach/crear-paquete', async (req, res) => {
    try {
        const { nombre, tematica, descripcion, paqueteRef, hora, fechaInicio, color, imageUrl, cupoMaximo } = req.body;
        const diasValidos = paqueteRef === 'LMV' ? [1, 3, 5] : [2, 4];
        const [h, m] = hora.split(':');
        
        const slots = [];
        for (let i = 0; i < 28; i++) {
            let fechaBase = addDays(parseISO(fechaInicio), i);
            if (diasValidos.includes(getDay(fechaBase))) {
                const fechaFinal = new Date(fechaBase);
                fechaFinal.setHours(parseInt(h), parseInt(m), 0, 0);
                
                slots.push({
                    nombre,
                    tematica,
                    descripcion: descripcion || "",
                    paqueteRef, 
                    fecha: fechaFinal,
                    color: color || "#8FD9FB",
                    imageUrl: imageUrl || "",
                    cupoMaximo: parseInt(cupoMaximo) || 8, // Adecuación Cupo
                    inscritos: 0
                });
            }
        }
        
        await prisma.class.createMany({
            data: slots,
            skipDuplicates: true
        });
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/coach/crear-suelta', async (req, res) => {
    try {
        const { nombre, tematica, descripcion, hora, fechaInicio, color, imageUrl, cupoMaximo } = req.body;
        const [h, m] = hora.split(':');
        const fechaFinal = new Date(parseISO(fechaInicio));
        fechaFinal.setHours(parseInt(h), parseInt(m), 0, 0);

        const nuevaClase = await prisma.class.create({
            data: {
                nombre,
                tematica,
                descripcion: descripcion || "",
                paqueteRef: "SUELTA", 
                fecha: fechaFinal,
                color: color || "#8FD9FB",
                imageUrl: imageUrl || "",
                cupoMaximo: parseInt(cupoMaximo) || 8, // Adecuación Cupo
                inscritos: 0
            }
        });
        res.json({ success: true, clase: nuevaClase });
    } catch (e) {
        res.status(500).json({ error: "No se pudo crear la clase" });
    }
});

app.delete('/api/admin/clases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.class.delete({ where: { id: id.trim() } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar la clase" });
    }
});

app.delete('/api/admin/clases-reset', async (req, res) => {
    try {
        await prisma.class.deleteMany({}); 
        res.json({ success: true, message: "Calendario reseteado" });
    } catch (e) {
        res.status(500).json({ error: "Error al limpiar el calendario" });
    }
});

// ======================================================
// 4. SISTEMA DE RESERVAS (ACTUALIZADO CON PAGO Y CUPOS)
// ======================================================

app.post('/api/reservas', async (req, res) => {
    try {
        const { email, claseId, metodoPago, numeroCamilla, selection } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // Buscamos la clase original para validar cupo y obtener datos
        const claseMaestra = await prisma.class.findUnique({ where: { id: claseId } });
        if (!claseMaestra) return res.status(404).json({ message: "Clase no disponible" });

        if (claseMaestra.inscritos >= claseMaestra.cupoMaximo) {
            return res.status(400).json({ success: false, message: "CLASE_LLENA" });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear la reserva individual
            const nuevaReserva = await tx.class.create({
                data: {
                    nombre: claseMaestra.nombre,
                    fecha: claseMaestra.fecha,
                    userId: user.id,
                    numeroCamilla: numeroCamilla ? parseInt(numeroCamilla) : null,
                    paqueteRef: claseMaestra.paqueteRef,
                    tematica: claseMaestra.tematica || "Clase Regular",
                    color: "#8FD9FB"
                }
            });

            // 2. Actualizar inscritos en la clase maestra
            await tx.class.update({
                where: { id: claseId },
                data: { inscritos: { increment: 1 } }
            });

            // 3. Lógica de Cobro / Plan
            let updateData = {};
            if (metodoPago === 'CREDITOS') {
                if (user.creditosDisponibles < 1) throw new Error("Créditos insuficientes");
                updateData.creditosDisponibles = { decrement: 1 };
            } else if (metodoPago === 'PLAN') {
                // Si es por plan, solo validamos que esté activo (ya se hace en el front, pero aquí aseguramos integridad)
                updateData.suscripcionActiva = true;
            }

            const userUpdated = await tx.user.update({ 
                where: { id: user.id }, 
                data: updateData,
                include: { reservas: { orderBy: { fecha: 'asc' } } }
            });

            return userUpdated;
        });

        const { password: _, ...safeUser } = result;
        res.json({ success: true, userUpdated: safeUser });
    } catch (e) {
        console.error("Error Reserva:", e);
        res.status(500).json({ success: false, message: e.message || "Error al procesar reserva" });
    }
});

// 🟢 NUEVA RUTA: LISTA DE ESPERA
app.post('/api/reservas/lista-espera', async (req, res) => {
    try {
        const { email, claseId } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        
        await prisma.waitingList.create({
            data: {
                claseId: claseId,
                userId: user.id
            }
        });

        res.json({ success: true, message: "Anotado en lista de espera" });
    } catch (e) {
        res.status(500).json({ error: "Ya estás en la lista de espera para esta clase." });
    }
});

app.post('/api/reservas/cancelar', async (req, res) => {
    try {
        const { reservaId, userEmail } = req.body;
        const reserva = await prisma.class.findUnique({ where: { id: reservaId } });
        const user = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });

        if (!reserva || !user) {
            return res.status(404).json({ message: "Reserva o usuario no encontrado" });
        }

        // Aquí podrías decidir si devuelves crédito o no según política
        await prisma.$transaction([
            prisma.class.delete({ where: { id: reservaId } }),
            prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: { creditosDisponibles: { increment: 1 } }
            })
        ]);

        res.json({ success: true, message: "Reserva cancelada" });
    } catch (e) {
        res.status(500).json({ message: "Error interno al cancelar" });
    }
});

app.get('/api/user/:email', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: req.params.email.toLowerCase() },
            include: { reservas: { orderBy: { fecha: 'asc' } } }
        });
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// ======================================================
// 5. RUTAS EXCLUSIVAS PARA EL ADMIN
// ======================================================

app.get('/api/admin/usuarios-sistema', async (req, res) => {
    try {
        const usuarios = await prisma.user.findMany({
            orderBy: { role: 'asc' },
            include: { reservas: true }
        });
        res.json(usuarios);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

app.get('/api/admin/stats-ventas', async (req, res) => {
    try {
        const reservas = await prisma.class.findMany({
            where: { NOT: { userId: null } }
        });

        const resumen = {
            LMV: reservas.filter(r => r.paqueteRef === 'LMV').length,
            MJ: reservas.filter(r => r.paqueteRef === 'MJ').length,
            SUELTA: reservas.filter(r => r.paqueteRef === 'SUELTA').length,
            totalIngresos: 0
        };

        resumen.totalIngresos = (resumen.LMV * COSTOS.LMV) + 
                                (resumen.MJ * COSTOS.MJ) + 
                                (resumen.SUELTA * COSTOS.SUELTA);

        res.json(resumen);
    } catch (e) {
        res.status(500).json({ error: "Error al calcular ventas" });
    }
});

// ======================================================
// RUTAS DE ADMINISTRACIÓN DE LISTA DE ESPERA
// ======================================================

app.get('/api/admin/lista-espera', async (req, res) => {
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
        res.status(500).json({ error: "Error al obtener lista de espera" });
    }
});

app.delete('/api/admin/lista-espera/:id', async (req, res) => {
    try {
        await prisma.waitingList.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "No se pudo eliminar el registro" });
    }
});

// ======================================================
// NUEVA SECCIÓN: STRIPE PAYMENT INTENT (Para pagos dentro del Modal)
// ======================================================

app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { monto, email } = req.body;

        // Validar que el monto sea correcto (mínimo 50 MXN según tu lógica)
        // Stripe requiere centavos, por eso multiplicamos por 100
        const amountInCents = Math.round(parseFloat(monto) * 100);

        if (amountInCents < 5000) { // 5000 centavos = 50 pesos
            return res.status(400).json({ error: "El monto mínimo es de $50 MXN" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'mxn',
            receipt_email: email,
            metadata: { 
                email: email,
                tipo: 'recarga_billetera' 
            },
        });

        // Enviamos el secreto al frontend para que Stripe pueda finalizar el pago
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e) {
        console.error("Error Stripe PaymentIntent:", e);
        res.status(500).json({ error: e.message });
    }
});

// ======================================================
// 6. LANZAMIENTO
// ======================================================

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 BOOZ BACKEND LOCAL EN PUERTO ${PORT}`);
    });
}

module.exports = app;