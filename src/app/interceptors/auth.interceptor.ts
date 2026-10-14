import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Agrega el token JWT a cada llamada a la API y cierra la sesión si el backend responde 401.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const isApiCall = req.url.startsWith(environment.apiUrl);
    const isAuthCall = req.url.startsWith(`${environment.apiUrl}/auth/`);

    const request = token && isApiCall && !isAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Un 401 en login significa "credenciales incorrectas", no "sesión vencida"
        if (error.status === 401 && !isAuthCall) {
          const role = this.authService.getUserRole();
          this.authService.logout();
          this.router.navigate(['/login'], { queryParams: role ? { role } : {} });
        }
        return throwError(() => error);
      })
    );
  }
}
