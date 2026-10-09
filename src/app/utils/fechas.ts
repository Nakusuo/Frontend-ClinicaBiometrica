/** Edad en años a partir de 'AAAA-MM-DD'. null si falta o no es válida. */
export function calcularEdad(fecha?: string | null, hoy: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha ?? '');
  if (!match) return null;
  const [anio, mes, dia] = [Number(match[1]), Number(match[2]), Number(match[3])];
  let edad = hoy.getFullYear() - anio;
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) {
    edad--;
  }
  return edad;
}

export function edadTexto(fecha?: string | null): string {
  const edad = calcularEdad(fecha);
  return edad === null ? 'No especificada' : `${edad} años`;
}

/**
 * Convierte el valor de un datepicker a 'AAAA-MM-DD' usando la fecha local.
 * Enviar el Date tal cual lo pasa a UTC y puede correr el día.
 */
export function aFechaISO(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${valor.getFullYear()}-${mes}-${dia}`;
}
