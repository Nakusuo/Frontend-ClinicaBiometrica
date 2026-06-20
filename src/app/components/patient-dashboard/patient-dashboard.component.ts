import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Patient } from '../../models/patient';
import { Appointment } from '../../models/appointment';

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  patient: Patient | null = null;
  appointments: Appointment[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.patient = currentUser;
      this.loadAppointments(currentUser.id);
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadAppointments(patientId: number): void {
    this.apiService.getCitasPaciente(patientId).subscribe({
      next: (citas) => {
        this.appointments = citas;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  joinVideocall(appointmentId: number): void {
    this.router.navigate(['/videocall', appointmentId]);
  }

  viewMyExpedient(): void {
    if (this.patient) {
      this.router.navigate(['/expedient', this.patient.id]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
