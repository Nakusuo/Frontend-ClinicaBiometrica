import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { AppointmentBookComponent } from './appointment-book.component';

describe('AppointmentBookComponent al reprogramar', () => {
  it('carga la cita, bloquea el médico y guarda con PUT', () => {
    const api = jasmine.createSpyObj('ApiService', ['getDoctores', 'getCita', 'updateCita', 'createCita']);
    api.getDoctores.and.returnValue(of([]));
    api.getCita.and.returnValue(of({ id: 7, doctorId: 2, fecha: '2099-01-10', hora: '10:00 AM', motivo: 'Control' }));
    api.updateCita.and.returnValue(of({}));
    const auth = { getCurrentUser: () => ({ id: 1 }) };
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const route = { snapshot: { queryParamMap: new Map([['cita', '7']]) } };
    const c = new AppointmentBookComponent(new FormBuilder(), auth as any, api, router, route as any);

    c.ngOnInit();
    expect(c.form.controls.doctorId.disabled).toBeTrue();
    c.agendar();

    expect(api.updateCita).toHaveBeenCalledWith(7, { paciente_id: 1, doctor_id: 2, fecha: '2099-01-10', hora: '10:00 AM', motivo: 'Control' });
    expect(api.createCita).not.toHaveBeenCalled();
  });
});
