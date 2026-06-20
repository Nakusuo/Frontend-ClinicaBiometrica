import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<any | null>(null);
  private userRole = new BehaviorSubject<'doctor' | 'paciente' | null>(null);

  isLoggedIn$ = this.loggedIn.asObservable();
  currentUser$ = this.currentUser.asObservable();
  userRole$ = this.userRole.asObservable();

  constructor(private http: HttpClient) {}

  loginFacial(embedding: number[], role?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/facial-login`, { embedding, role });
  }

  registerDoctor(doctor: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-doctor`, doctor);
  }

  registerPatient(patient: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-patient`, patient);
  }

  setSession(user: any, role: 'doctor' | 'paciente'): void {
    this.loggedIn.next(true);
    this.currentUser.next(user);
    this.userRole.next(role);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('role', role);
    // Backward compatibility for components expecting 'doctor' key
    if (role === 'doctor') {
      sessionStorage.setItem('doctor', JSON.stringify(user));
    }
  }

  logout(): void {
    this.loggedIn.next(false);
    this.currentUser.next(null);
    this.userRole.next(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('doctor');
  }

  isAuthenticated(): boolean {
    return this.loggedIn.value || 
           !!sessionStorage.getItem('user') || 
           !!sessionStorage.getItem('doctor');
  }

  getUserRole(): 'doctor' | 'paciente' | null {
    if (this.userRole.value) return this.userRole.value;
    return sessionStorage.getItem('role') as 'doctor' | 'paciente' | null;
  }

  getCurrentUser(): any {
    if (this.currentUser.value) return this.currentUser.value;
    const userStr = sessionStorage.getItem('user') || sessionStorage.getItem('doctor');
    return userStr ? JSON.parse(userStr) : null;
  }
}
