import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { fakeToken } from '../testing/fake-token';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let auth: AuthService;
  let router: Router;

  const ruta = (roles?: string[]) => ({ data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot);
  const url = (resultado: boolean | UrlTree) => (resultado instanceof UrlTree ? router.serializeUrl(resultado) : resultado);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, RouterTestingModule] });
    guard = TestBed.inject(AuthGuard);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('sin sesión manda al login', () => {
    expect(url(guard.canActivate(ruta()))).toBe('/login');
  });

  it('deja pasar al rol permitido', () => {
    auth.setSession({ id: 1 }, 'doctor', fakeToken(Math.floor(Date.now() / 1000) + 3600));
    expect(guard.canActivate(ruta(['doctor']))).toBeTrue();
  });

  it('un paciente que entra al panel del médico vuelve al suyo', () => {
    auth.setSession({ id: 2 }, 'paciente', fakeToken(Math.floor(Date.now() / 1000) + 3600));
    expect(url(guard.canActivate(ruta(['doctor'])))).toBe('/patient-dashboard');
  });
});
