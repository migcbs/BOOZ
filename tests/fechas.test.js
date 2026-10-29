// Pruebas sin base de datos de las fechas en hora del estudio.
// Se corren con TZ=UTC para simular el servidor en Vercel.
const { fechaEnHoraEstudio, partesEnZona, sumarDiasYMD, diaSemanaYMD } = require('../lib/fechas');

describe('fechaEnHoraEstudio', () => {
  test('21:00 en Coatepec se guarda como 03:00 UTC del día siguiente', () => {
    expect(fechaEnHoraEstudio('2026-10-28', 21, 0).toISOString()).toBe('2026-10-29T03:00:00.000Z');
  });
  test('06:00 en Coatepec se guarda como 12:00 UTC', () => {
    expect(fechaEnHoraEstudio('2026-03-02', 6, 0).toISOString()).toBe('2026-03-02T12:00:00.000Z');
  });
  test('acepta una fecha ISO completa y usa solo el día', () => {
    expect(fechaEnHoraEstudio('2026-10-28T00:00:00.000Z', 19, 30).toISOString()).toBe('2026-10-29T01:30:00.000Z');
  });
  test('al leerla en la zona del estudio vuelve la misma hora y día', () => {
    const p = partesEnZona(fechaEnHoraEstudio('2026-10-28', 21, 0));
    expect([p.year, p.month, p.day, p.hour, p.minute, p.weekday]).toEqual([2026, 10, 28, 21, 0, 3]);
  });
});

describe('días del paquete', () => {
  test('suma días cruzando de mes', () => {
    expect(sumarDiasYMD('2026-10-30', 3)).toBe('2026-11-02');
  });
  test('día de la semana de una fecha', () => {
    expect(diaSemanaYMD('2026-10-28')).toBe(3); // miércoles
    expect(diaSemanaYMD('2026-11-01')).toBe(0); // domingo
  });
});
