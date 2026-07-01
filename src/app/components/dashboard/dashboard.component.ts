import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  isAdmin = false;
  doctors: any[] = [];
  showAddModal = false;
  doctorForm: FormGroup;
  specialties = [
    'Cardiología', 'Pediatría', 'Neurología',
    'Medicina General', 'Dermatología',
  ];
  activeTab: 'citas' | 'pacientes' = 'citas';
  patients: any[] = [];

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
    private router: Router,
    private fb: FormBuilder
  ) {
    this.doctorForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      especialidad: ['', Validators.required],
      cedula: ['', Validators.required],
      telefono: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.doctor = user;
    if (user) {
      this.isAdmin = user.rol === 'admin';
      if (this.isAdmin) {
        this.loadDoctors();
      } else {
        this.loadAppointments(user.id);
        this.loadPatients();
        this.connectWebSocket(user.id);
      }
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

  loadDoctors(): void {
    this.apiService.getDoctores().subscribe({
      next: (docs) => {
        this.doctors = docs.filter(d => d.rol !== 'admin');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadPatients(): void {
    this.apiService.getPacientes().subscribe({
      next: (pats) => {
        this.patients = pats;
      },
      error: (err) => console.error(err)
    });
  }

  registerDoctor(): void {
    if (this.doctorForm.invalid) return;
    this.loading = true;
    const formVal = this.doctorForm.value;
    
    this.apiService.createDoctor({
      nombres: formVal.nombres,
      apellidos: formVal.apellidos,
      correo: formVal.correo,
      especialidad: formVal.especialidad,
      cedula: formVal.cedula,
      telefono: formVal.telefono,
      password: formVal.password,
      activo: true
    }).subscribe({
      next: () => {
        this.loading = false;
        this.showAddModal = false;
        this.doctorForm.reset({ especialidad: '' });
        this.loadDoctors();
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.detail || 'Error al registrar al médico.');
      }
    });
  }

  deleteDoctor(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar a este médico de la plataforma?')) {
      this.apiService.deleteDoctor(id).subscribe({
        next: () => this.loadDoctors(),
        error: (err) => console.error(err)
      });
    }
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
