import { filtrarCitas } from './dashboard.component';
import { Appointment } from '../../models/appointment';

const cita = (id: number, fecha: string) => ({ id, fecha } as Appointment);

describe('filtrarCitas del panel del doctor', () => {
  const citas = [cita(1, '2026-10-20'), cita(2, '2026-10-14'), cita(3, '2026-10-01')];

  it('por defecto muestra solo las de hoy', () => {
    expect(filtrarCitas(citas, false, '2026-10-14').map((c) => c.id)).toEqual([2]);
  });

  it('"Ver todas" muestra todas ordenadas por fecha', () => {
    expect(filtrarCitas(citas, true, '2026-10-14').map((c) => c.id)).toEqual([3, 2, 1]);
  });
});
