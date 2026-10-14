import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { fakeToken } from '../testing/fake-token';

describe('AuthService', () => {
  let service: AuthService;
  const enUnaHora = () => Math.floor(Date.now() / 1000) + 3600;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
  });

  it('sin token no hay sesión', () => {
    sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('con token vigente hay sesión y guarda usuario y rol', () => {
    service.setSession({ id: 7 }, 'paciente', fakeToken(enUnaHora()));
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getUserRole()).toBe('paciente');
    expect(service.getCurrentUser().id).toBe(7);
  });

  it('un token vencido cierra la sesión', () => {
    service.setSession({ id: 7 }, 'doctor', fakeToken(Math.floor(Date.now() / 1000) - 10));
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('logout borra todo', () => {
    service.setSession({ id: 7 }, 'doctor', fakeToken(enUnaHora()));
    service.logout();
    expect(service.getToken()).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('updateCurrentUser mezcla los cambios con el usuario guardado', () => {
    service.setSession({ id: 7, has_biometrics: false }, 'paciente', fakeToken(enUnaHora()));
    service.updateCurrentUser({ has_biometrics: true });
    expect(JSON.parse(sessionStorage.getItem('user')!)).toEqual({ id: 7, has_biometrics: true });
  });

  it('homeFor lleva a cada rol a su panel', () => {
    expect(service.homeFor('doctor')).toBe('/dashboard');
    expect(service.homeFor('paciente')).toBe('/patient-dashboard');
  });
});
