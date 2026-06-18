import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Doctor } from '../models/doctor';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<Doctor | null>(null);

  isLoggedIn$ = this.loggedIn.asObservable();
  currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient) {}

  loginFacial(embedding: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/facial-login`, { embedding });
  }

  setSession(doctor: Doctor): void {
    this.loggedIn.next(true);
    this.currentUser.next(doctor);
    sessionStorage.setItem('doctor', JSON.stringify(doctor));
  }

  logout(): void {
    this.loggedIn.next(false);
    this.currentUser.next(null);
    sessionStorage.removeItem('doctor');
  }

  isAuthenticated(): boolean {
    return this.loggedIn.value || !!sessionStorage.getItem('doctor');
  }
}
