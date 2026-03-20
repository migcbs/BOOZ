const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('booz123', 10);

    // ✅ CORRECCIÓN: role usa los valores del enum (cliente | coach | admin)
    // tipoCliente usa los valores del enum (REGULAR | SUSCRIPTO)
    const users = [
        {
            email: 'admin@booz.com',
            role: 'admin',
            nombre: 'Admin',
            apellido: 'Maestro',
            tipoCliente: 'SUSCRIPTO',
            suscripcionActiva: true,
            creditosDisponibles: 9999
        },
        {
            email: 'coach@booz.com',
            role: 'coach',
            nombre: 'Coach',
            apellido: 'Booz',
            tipoCliente: 'SUSCRIPTO',
            suscripcionActiva: true,
            creditosDisponibles: 9999
        },
        {
            email: 'cliente@booz.com',
            role: 'cliente',
            nombre: 'Usuario',
            apellido: 'Prueba',
            tipoCliente: 'SUSCRIPTO',
            planNombre: 'Vía Libre (Prueba)',
            suscripcionActiva: true,
            creditosDisponibles: 9999,
            vencimientoPlan: new Date('2030-12-31')
        }
    ];

    console.log('🌱 Iniciando el sembrado de datos...');

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                tipoCliente: u.tipoCliente,
                suscripcionActiva: u.suscripcionActiva,
                creditosDisponibles: u.creditosDisponibles,
                planNombre: u.planNombre || null,
                vencimientoPlan: u.vencimientoPlan || null
            },
            create: {
                email: u.email,
                password: password,
                nombre: u.nombre,
                apellido: u.apellido,
                role: u.role,
                tipoCliente: u.tipoCliente,
                suscripcionActiva: u.suscripcionActiva,
                creditosDisponibles: u.creditosDisponibles,
                planNombre: u.planNombre || null,
                vencimientoPlan: u.vencimientoPlan || null
            }
        });
        console.log(`  ✅ ${u.role}: ${u.email}`);
    }

    console.log('✅ Cuentas maestras verificadas correctamente.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });