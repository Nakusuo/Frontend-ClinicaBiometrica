import { ElementRef } from '@angular/core';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';

describe('LoginComponent con autocompletado', () => {
  it('usa el correo y la contraseña que el navegador dejó en los campos', () => {
    const auth = jasmine.createSpyObj('AuthService', ['loginPassword', 'setSession']);
    auth.loginPassword.and.returnValue(of({}));
    const route = { queryParams: of({}) };
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const c = new LoginComponent(auth, {} as any, router, route as any);
    c.emailRef = new ElementRef(Object.assign(document.createElement('input'), { value: 'doctor@email.com' }));
    c.passwordRef = new ElementRef(Object.assign(document.createElement('input'), { value: 'clave' }));

    c.loginWithPassword();

    expect(auth.loginPassword).toHaveBeenCalledWith('doctor@email.com', 'clave', 'doctor');
  });
});
