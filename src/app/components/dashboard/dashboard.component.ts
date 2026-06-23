import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class DashboardComponent implements OnInit, OnDestroy {
  doctor: Doctor | null = null;
  appointments: Appointment[] = [];
  loading = true;

  // Habilitar campos en tiempo real vacíos al inicio
  availabilityStatus = 'Disponible';
  incomingCall: any = null;
  private ws: WebSocket | null = null;

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
      this.connectWebSocket(user.id);
    } else {
      this.router.navigate(['/login']);
    }
  }

  connectWebSocket(doctorId: number): void {
    const wsUrl = `ws://localhost:8000/ws/doctor/${doctorId}`;
    console.log(`Doctor connecting to dashboard WS: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log('Doctor WS Message received:', msg);
      if (msg.type === 'call-request') {
        this.incomingCall = {
          id: msg.data.appointmentId,
          patientName: msg.data.patientName,
          reason: msg.data.reason || 'Consulta Médica',
          patientId: msg.data.patientId
        };
      } else if (msg.type === 'call-ended') {
        this.incomingCall = null;
      }
    };

    this.ws.onclose = () => {
      console.log('Doctor WS disconnected. Reconnecting in 3s...');
      setTimeout(() => {
        if (this.doctor) {
          this.connectWebSocket(doctorId);
        }
      }, 3000);
    };
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
    this.apiService.aceptarLlamada(appointmentId).subscribe({
      next: () => {
        this.disconnectWebSocket();
        this.router.navigate(['/videocall', appointmentId]);
      },
      error: () => {
        this.disconnectWebSocket();
        this.router.navigate(['/videocall', appointmentId]);
      }
    });
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

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  logout(): void {
    this.disconnectWebSocket();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }
}
