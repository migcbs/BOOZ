const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('booz123', 10);

  // Configuración de los usuarios iniciales
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
      // 🟢 ADECUACIÓN HÍBRIDA: Créditos masivos para pruebas
      tipoCliente: 'SUSCRIPTO', 
      planNombre: 'Vía Libre (Prueba)',
      suscripcionActiva: true,
      creditosDisponibles: 9999,
      vencimientoPlan: new Date('2030-12-31') // Vigencia hasta el 2030
    }
  ];

  console.log('🌱 Iniciando el sembrado de datos...');

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        // Si ya existen, forzamos que tengan estos créditos
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
      },
    });
  }

  console.log('✅ Cuentas maestras con créditos infinitos verificadas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });