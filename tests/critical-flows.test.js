/**
 * Tests de regresión para los bugs críticos corregidos antes del
 * lanzamiento con usuarios reales:
 *   - reembolso de créditos solo si se pagó con CREDITOS
 *   - cancelación bloqueada a <24h server-side
 *   - no se puede anotar a otro usuario en lista de espera
 *   - EFECTIVO no rompe el enum MetodoPago
 *
 * Corre contra la base de datos real de desarrollo (misma que usa
 * `npm run server`) — crea y borra sus propios datos de prueba,
 * no toca datos de alumnas reales.
 */
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = require('../index');

const JWT_SECRET = process.env.JWT_SECRET;
const TEST_PREFIX = 'jest-critical-flows';

let cliente, admin, clienteToken, adminToken;

function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  const hash = await bcrypt.hash('TestPass123', 10);

  cliente = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}-cliente@booz.local`,
      password: hash,
      role: 'cliente',
      nombre: 'Jest',
      apellido: 'Cliente',
      creditosDisponibles: 5,
    },
  });

  admin = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}-admin@booz.local`,
      password: hash,
      role: 'admin',
      nombre: 'Jest',
      apellido: 'Admin',
    },
  });

  clienteToken = tokenFor(cliente);
  adminToken = tokenFor(admin);
});

afterAll(async () => {
  await prisma.class.deleteMany({ where: { nombre: { startsWith: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Lista de espera — autorización', () => {
  it('rechaza anotar el email de otro usuario (403)', async () => {
    const res = await request(app)
      .post('/api/reservas/lista-espera')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ email: 'otra-persona@ajena.com', claseId: 'fake-id' });

    expect(res.status).toBe(403);
  });
});

describe('Reservas — cancelación y reembolso', () => {
  it('rechaza cancelar una reserva a menos de 24h de la clase (400)', async () => {
    const clase = await prisma.class.create({
      data: {
        nombre: `${TEST_PREFIX}-cancel-24h`,
        fecha: new Date(Date.now() + 60 * 60 * 1000), // en 1 hora
        userId: cliente.id,
        paqueteRef: 'SUELTA',
        metodoPago: 'CREDITOS',
        cupoMaximo: 8,
      },
    });

    const res = await request(app)
      .post('/api/reservas/cancelar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ reservaId: clase.id, userEmail: cliente.email });

    expect(res.status).toBe(400);

    const stillThere = await prisma.class.findUnique({ where: { id: clase.id } });
    expect(stillThere).not.toBeNull();
  });

  it('reembolsa el crédito solo si la reserva se pagó con CREDITOS', async () => {
    const before = await prisma.user.findUnique({ where: { id: cliente.id } });

    const clase = await prisma.class.create({
      data: {
        nombre: `${TEST_PREFIX}-refund`,
        fecha: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // en 10 días
        userId: cliente.id,
        paqueteRef: 'SUELTA',
        metodoPago: 'CREDITOS',
        cupoMaximo: 8,
      },
    });

    const res = await request(app)
      .post('/api/reservas/cancelar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ reservaId: clase.id, userEmail: cliente.email });

    expect(res.status).toBe(200);

    const after = await prisma.user.findUnique({ where: { id: cliente.id } });
    expect(after.creditosDisponibles).toBe(before.creditosDisponibles + 1);
  });

  it('NO reembolsa crédito si la reserva se pagó con SUSCRIPCION', async () => {
    const before = await prisma.user.findUnique({ where: { id: cliente.id } });

    const clase = await prisma.class.create({
      data: {
        nombre: `${TEST_PREFIX}-no-refund`,
        fecha: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        userId: cliente.id,
        paqueteRef: 'LMV',
        metodoPago: 'SUSCRIPCION',
        cupoMaximo: 8,
      },
    });

    const res = await request(app)
      .post('/api/reservas/cancelar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ reservaId: clase.id, userEmail: cliente.email });

    expect(res.status).toBe(200);

    const after = await prisma.user.findUnique({ where: { id: cliente.id } });
    expect(after.creditosDisponibles).toBe(before.creditosDisponibles);
  });

  it('acepta EFECTIVO como metodoPago sin romper el enum de Prisma', async () => {
    const claseMaestra = await prisma.class.create({
      data: {
        nombre: `${TEST_PREFIX}-efectivo`,
        fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        paqueteRef: 'SUELTA',
        cupoMaximo: 8,
        inscritos: 0,
      },
    });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ email: cliente.email, claseId: claseMaestra.id, metodoPago: 'EFECTIVO' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const reserva = await prisma.class.findFirst({
      where: { nombre: `${TEST_PREFIX}-efectivo`, userId: cliente.id },
    });
    expect(reserva.metodoPago).toBe('EFECTIVO');
  });
});

describe('Rate limiting', () => {
  it('bloquea /api/login después de superar el límite de intentos', async () => {
    let lastStatus;
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'no-existe@nope.com', password: 'wrong' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('Configuración — /api/config', () => {
  it('un cliente no puede modificar la configuración (403)', async () => {
    const res = await request(app)
      .put('/api/config')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ permitirEfectivo: false });

    expect(res.status).toBe(403);
  });

  it('un admin sí puede modificar la configuración', async () => {
    const res = await request(app)
      .put('/api/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permitirEfectivo: true });

    expect(res.status).toBe(200);
    expect(res.body.config.permitirEfectivo).toBe(true);
  });
});
