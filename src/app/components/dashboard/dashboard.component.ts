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

  // New mockup fields
  availabilityStatus = 'Disponible';
  incomingCall: any = {
    id: 1,
    patientName: 'Carlos Ruiz',
    reason: 'Consulta Rápida Post-Operativa',
    patientId: 1
  };

  mockAppointments = [
    { id: 101, patientName: 'Ana Martinez', age: 27, time: '10:00 AM', status: 'programada' },
    { id: 102, patientName: 'Luis García', age: 79, time: '11:15 AM', status: 'en_curso' },
    { id: 103, patientName: 'Elena Torres', age: 43, time: '12:00 PM', status: 'programada' }
  ];

  recentHistory = [
    { patientName: 'Sofia Mendez', date: 'Ayer', diagnostic: 'Control de hipertensión' },
    { patientName: 'Pedro Alva', date: '17 Jun', diagnostic: 'Revisión anual' }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.doctor = user;
    if (user) {
      this.loadAppointments(user.id);
    } else {
      this.router.navigate(['/login']);
    }
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

  setAvailability(status: string): void {
    this.availabilityStatus = status;
  }

  acceptCall(appointmentId: number): void {
    this.router.navigate(['/videocall', appointmentId]);
  }

  rejectCall(): void {
    this.incomingCall = null;
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
