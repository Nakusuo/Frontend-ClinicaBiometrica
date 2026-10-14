import { HORARIOS } from './appointment-book.component';

describe('HORARIOS de citas', () => {
  it('va de 08:00 AM a 05:30 PM cada 30 minutos', () => {
    expect(HORARIOS.length).toBe(20);
    expect(HORARIOS[0]).toBe('08:00 AM');
    expect(HORARIOS[8]).toBe('12:00 PM');
    expect(HORARIOS[19]).toBe('05:30 PM');
  });
});
