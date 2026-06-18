import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Doctor } from '../../models/doctor';
import { Appointment } from '../../models/appointment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  doctor: Doctor | null = null;
  appointments: Appointment[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(doc => {
      this.doctor = doc;
      if (doc) {
        this.loadAppointments(doc.id);
      }
    });
  }

  loadAppointments(doctorId: number): void {
    this.apiService.getCitas(doctorId).subscribe({
      next: (citas) => {
        this.appointments = citas;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  navigateToPatientForm(appointmentId: number): void {
    this.router.navigate(['/patient-form', appointmentId]);
  }

  startVideocall(appointmentId: number): void {
    this.router.navigate(['/videocall', appointmentId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
