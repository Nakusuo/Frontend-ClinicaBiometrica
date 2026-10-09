import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'doctor' | 'paciente';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<any | null>(null);
  private userRole = new BehaviorSubject<UserRole | null>(null);

  isLoggedIn$ = this.loggedIn.asObservable();
  currentUser$ = this.currentUser.asObservable();
  userRole$ = this.userRole.asObservable();

  constructor(private http: HttpClient) {}

  loginFacial(correo: string, embedding_facial: number[], role?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/facial-login`, { correo, embedding_facial, role });
  }

  loginPassword(correo: string, password: string, role?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { correo, password, role });
  }

  registerDoctor(doctor: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-doctor`, doctor);
  }

  registerPatient(patient: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-patient`, patient);
  }

  setSession(user: any, role: UserRole, token: string): void {
    this.loggedIn.next(true);
    this.currentUser.next(user);
    this.userRole.next(role);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('role', role);
  }

  logout(): void {
    this.loggedIn.next(false);
    this.currentUser.next(null);
    this.userRole.next(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('doctor');
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /** Hay sesión solo si existe un token que todavía no venció. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const exp = this.readTokenExpiration(token);
    if (exp !== null && exp * 1000 <= Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  /** Actualiza datos del usuario guardado (por ejemplo, tras registrar su rostro). */
  updateCurrentUser(changes: Record<string, unknown>): void {
    const user = { ...this.getCurrentUser(), ...changes };
    this.currentUser.next(user);
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  getUserRole(): UserRole | null {
    if (this.userRole.value) return this.userRole.value;
    return sessionStorage.getItem('role') as UserRole | null;
  }

  getCurrentUser(): any {
    if (this.currentUser.value) return this.currentUser.value;
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /** Pantalla de inicio de cada rol. */
  homeFor(role: UserRole | null): string {
    return role === 'paciente' ? '/patient-dashboard' : '/dashboard';
  }

  // Solo lee "exp" para no mostrar pantallas con un token vencido; la validación real la hace el backend.
  private readTokenExpiration(token: string): number | null {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const exp = JSON.parse(atob(payload)).exp;
      return typeof exp === 'number' ? exp : null;
    } catch {
      return null;
    }
  }
}
