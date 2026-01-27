const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { addDays, parseISO, getDay, startOfDay } = require('date-fns');

// 🟢 Adecuación para Prisma en Serverless (Vercel)
// Evita el error de "Too many connections" en PostgreSQL al reutilizar la instancia.
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
        const { nombre, apellido, email, password, telefono } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                nombre,
                apellido,
                email: email.toLowerCase(),
                password: hashedPassword,
                telefono,
                role: 'cliente',
                tipoCliente: 'REGULAR', // Valor del Enum en schema.prisma
                creditosDisponibles: 0,
                suscripcionActiva: false
            }
        });

        const { password: _, ...safeUser } = newUser;
        res.json({ success: true, user: safeUser });
    } catch (e) {
        console.error("Error en Signup:", e);
        res.status(500).json({ error: "El email ya está registrado o los datos son inválidos." });
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
        // Transacción para limpiar registros antes de borrar al usuario
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
        const { nombre, tematica, descripcion, paqueteRef, hora, fechaInicio, color, imageUrl } = req.body;
        // Validar que paqueteRef sea un Enum válido: LMV o MJ
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
                    paqueteRef, // Enum: LMV / MJ
                    fecha: fechaFinal,
                    color: color || "#8FD9FB",
                    imageUrl: imageUrl || ""
                });
            }
        }
        
        // Inserción masiva para optimizar PostgreSQL
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
        const { nombre, tematica, descripcion, hora, fechaInicio, color, imageUrl } = req.body;
        const [h, m] = hora.split(':');
        const fechaFinal = new Date(parseISO(fechaInicio));
        fechaFinal.setHours(parseInt(h), parseInt(m), 0, 0);

        const nuevaClase = await prisma.class.create({
            data: {
                nombre,
                tematica,
                descripcion: descripcion || "",
                paqueteRef: "SUELTA", // Enum obligatorio
                fecha: fechaFinal,
                color: color || "#8FD9FB",
                imageUrl: imageUrl || ""
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
// 4. SISTEMA DE RESERVAS, CRÉDITOS Y CANCELACIÓN
// ======================================================

app.post('/api/reservas', async (req, res) => {
    try {
        const { email, paqueteId, selection, numeroCamilla } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        const fechaReserva = new Date(`${selection.dateKey}T${selection.hour}:00`);
        
        // 🟢 Transacción Atómica: Crea reserva y descuenta crédito
        const result = await prisma.$transaction(async (tx) => {
            const nuevaReserva = await tx.class.create({
                data: {
                    nombre: selection.nombreClase,
                    fecha: fechaReserva,
                    userId: user.id,
                    numeroCamilla: numeroCamilla ? parseInt(numeroCamilla) : null,
                    paqueteRef: paqueteId,
                    tematica: selection.tematica || "Clase Regular"
                }
            });

            let updateData = {};
            const esPaquete = (paqueteId === 'LMV' || paqueteId === 'MJ');
            
            if (esPaquete) {
                updateData = {
                    tipoCliente: 'SUSCRIPTO', // Enum TipoSuscripcion
                    suscripcionActiva: true,
                    planNombre: `Paquete ${paqueteId}`,
                    paqueteTipo: paqueteId,
                    vencimientoPlan: addDays(new Date(), 30),
                    creditosDisponibles: { decrement: COSTOS[paqueteId] || 0 }
                };
            } else {
                updateData = { creditosDisponibles: { decrement: COSTOS.SUELTA } };
            }

            const userUpdated = await tx.user.update({ 
                where: { id: user.id }, 
                data: updateData 
            });

            return userUpdated;
        });

        const { password: _, ...safeUser } = result;
        res.json({ success: true, userUpdated: safeUser });
    } catch (e) {
        console.error("Error Reserva:", e);
        res.status(500).json({ success: false, message: "Error al procesar reserva" });
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

        const montoADevolver = COSTOS[reserva.paqueteRef] || 95;

        await prisma.$transaction([
            prisma.class.delete({ where: { id: reservaId } }),
            prisma.user.update({
                where: { email: userEmail.toLowerCase() },
                data: { creditosDisponibles: { increment: montoADevolver } }
            })
        ]);

        res.json({ success: true, message: "Reserva cancelada y crédito devuelto" });
    } catch (e) {
        res.status(500).json({ message: "Error interno al cancelar la reserva" });
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
// 6. LANZAMIENTO
// ======================================================

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 BOOZ BACKEND LOCAL EN PUERTO ${PORT}`);
    });
}

// Exportación obligatoria para Vercel
module.exports = app;