import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { fakeToken } from '../testing/fake-token';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let router: Router;
  let token: string;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    token = fakeToken(Math.floor(Date.now() / 1000) + 3600);
    auth.setSession({ id: 1 }, 'doctor', token);
  });

  afterEach(() => backend.verify());

  it('agrega el token a las llamadas a la API', () => {
    http.get(`${environment.apiUrl}/citas/`).subscribe();
    const req = backend.expectOne(`${environment.apiUrl}/citas/`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush([]);
  });

  it('no envía el token a otros dominios', () => {
    http.get('https://otro-sitio.com/datos').subscribe();
    const req = backend.expectOne('https://otro-sitio.com/datos');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('un 401 de la API cierra la sesión y vuelve al login del mismo rol', () => {
    http.get(`${environment.apiUrl}/citas/`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/citas/`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { role: 'doctor' } });
  });

  it('un 401 en el login no cierra nada (son credenciales incorrectas)', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.getToken()).toBe(token);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
