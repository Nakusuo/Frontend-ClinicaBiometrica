import { aFechaISO, calcularEdad, edadTexto } from './fechas';

describe('utils/fechas', () => {
  const hoy = new Date(2026, 9, 9); // 9 de octubre de 2026

  it('calcula la edad según si ya cumplió años', () => {
    expect(calcularEdad('1995-10-20', hoy)).toBe(30);
    expect(calcularEdad('1995-10-09', hoy)).toBe(31);
  });

  it('devuelve null si la fecha falta o es inválida', () => {
    expect(calcularEdad(null, hoy)).toBeNull();
    expect(calcularEdad('20/10/1995', hoy)).toBeNull();
    expect(edadTexto(undefined)).toBe('No especificada');
  });

  it('aFechaISO usa la fecha local, sin correrse por la zona horaria', () => {
    expect(aFechaISO(new Date(1990, 2, 4))).toBe('1990-03-04');
    expect(aFechaISO('1990-03-04T05:00:00.000Z')).toBe('1990-03-04');
    expect(aFechaISO(null)).toBeNull();
  });
});
