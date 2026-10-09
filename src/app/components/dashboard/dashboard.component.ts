import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Doctor } from '../../models/doctor';
import { Appointment } from '../../models/appointment';
import { environment } from '../../../environments/environment';
import { RecentConsultation } from '../../models/recent-consultation';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  doctor: Doctor | null = null;
  appointments: Appointment[] = [];
  loading = true;
  error = '';

  // Habilitar campos en tiempo real vacíos al inicio
  availabilityStatus = 'Disponible';
  incomingCall: any = null;
  private ws: WebSocket | null = null;

  recentHistory: RecentConsultation[] = [];

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
      this.loadRecentHistory();
      this.connectWebSocket(user.id);
    } else {
      this.router.navigate(['/login']);
    }
  }

  connectWebSocket(doctorId: number): void {
    const wsUrl = `${environment.wsUrl}/ws/doctor/${doctorId}`;
    console.log(`Doctor connecting to dashboard WS: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    // El backend exige que el primer mensaje sea el token (no va en la URL para no quedar en logs)
    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: 'auth', token: this.authService.getToken() }));
    };

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

    this.ws.onclose = (event) => {
      // 1008 = el backend rechazó el token; reintentar no sirve
      if (event.code === 1008) {
        this.error = 'No se pudo conectar al canal de llamadas. Vuelve a iniciar sesión.';
        return;
      }
      console.log('Doctor WS disconnected. Reconnecting in 3s...');
      setTimeout(() => {
        if (this.doctor && this.ws) {
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
        this.error = 'No se pudieron cargar tus citas. Intenta de nuevo en unos minutos.';
        this.loading = false;
      },
    });
  }

  loadRecentHistory(): void {
    this.apiService.getConsultasRecientes().subscribe({
      next: (items) => (this.recentHistory = items),
      error: () => (this.recentHistory = []),
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
