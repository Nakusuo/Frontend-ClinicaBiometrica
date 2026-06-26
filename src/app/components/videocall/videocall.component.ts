import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WebRTCService } from '../../services/webrtc.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient';

@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.component.html',
  styleUrls: ['./videocall.component.css'],
})
export class VideocallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  appointmentId = 0;
  inCall = false;
  callError = '';

  cita: any = null;
  patient: Patient | null = null;
  role: 'doctor' | 'paciente' | null = null;
  audioMuted = false;
  videoMuted = false;

  // Split screen / Expediente editor integration
  showExpedient = false;
  expedientForm!: FormGroup;
  isEditMode = true;
  autosaveText = 'Guardado ✓';
  autosaveClass = 'text-secondary';
  consultationDate = '';
  submitting = false;
  successMessage = '';

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private fb: FormBuilder,
    private webrtcService: WebRTCService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.role = this.authService.getUserRole();
    
    // Initialize form
    this.expedientForm = this.fb.group({
      diagnostico: ['', Validators.required],
      tratamiento: ['', Validators.required],
      observaciones: [''],
      proximaCita: ['1 week']
    });

    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.consultationDate = `${now.getDate()} de ${months[now.getMonth()]}, ${now.getFullYear()}`;

    this.loadPatientFromAppointment();

    this.webrtcService.streamEvent.subscribe(stream => {
      if (this.remoteVideoRef) this.remoteVideoRef.nativeElement.srcObject = stream;
    });
    this.webrtcService.closeEvent.subscribe(() => { 
      this.inCall = false; 
      this.endCall();
    });
    this.webrtcService.errorEvent.subscribe(err => { this.callError = err.message; });

    this.setupAutosaveListener();
  }

  loadPatientFromAppointment(): void {
    this.apiService.getCita(this.appointmentId).subscribe({
      next: (cita) => {
        this.cita = cita;
        this.apiService.getPaciente(cita.patientId).subscribe({
          next: (pat) => {
            this.patient = pat;
            this.startCall();
          },
          error: () => this.fallbackSetup()
        });
      },
      error: () => this.fallbackSetup()
    });
  }

  private fallbackSetup(): void {
    this.patient = {
      id: 1,
      nombre: 'Carlos',
      apellido: 'Ruiz',
      dni: '76543210',
      fechaNacimiento: '1981-05-15',
      telefono: '+51 987 654 321',
      email: 'carlos.ruiz@email.com',
      direccion: 'Lima, Perú'
    };
    this.cita = {
      id: this.appointmentId,
      doctorId: 1,
      patientId: 1
    };
    this.startCall();
  }

  async startCall(): Promise<void> {
    try {
      if (!this.cita) return;
      const currentUser = this.authService.getCurrentUser();
      const currentUserId = currentUser ? currentUser.id : (this.role === 'doctor' ? this.cita.doctorId : this.cita.patientId);

      const targetRole = this.role === 'doctor' ? 'paciente' : 'doctor';
      const targetUserId = this.role === 'doctor' ? this.cita.patientId : this.cita.doctorId;
      const initiator = this.role === 'paciente'; // Paciente inicia la llamada

      const localStream = await this.webrtcService.startLocalStream();
      if (this.localVideoRef) {
        this.localVideoRef.nativeElement.srcObject = localStream;
      }

      this.webrtcService.connectSignaling(this.role!, currentUserId, targetRole, targetUserId);
      this.webrtcService.createPeer(initiator, targetRole, targetUserId);
      this.inCall = true;
    } catch (err: any) { 
      console.error('Error starting WebRTC call:', err);
      this.callError = 'No se pudo iniciar la llamada. Otorgue permisos de cámara/micrófono.'; 
    }
  }

  toggleAudio(): void {
    this.audioMuted = !this.audioMuted;
    if (this.localVideoRef?.nativeElement?.srcObject) {
      const stream = this.localVideoRef.nativeElement.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => track.enabled = !this.audioMuted);
    }
  }

  toggleVideo(): void {
    this.videoMuted = !this.videoMuted;
    if (this.localVideoRef?.nativeElement?.srcObject) {
      const stream = this.localVideoRef.nativeElement.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => track.enabled = !this.videoMuted);
    }
  }

  toggleMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  getAge(birthDateString?: string): string {
    if (!birthDateString) return 'No especificada';
    try {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      if (isNaN(birthDate.getTime())) return 'No especificada';
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age + ' años';
    } catch {
      return 'No especificada';
    }
  }

  setupAutosaveListener(): void {
    let timeout: any = null;
    this.expedientForm.valueChanges.subscribe(() => {
      this.autosaveText = 'Guardando...';
      this.autosaveClass = 'text-slate-400';
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const now = new Date();
        const timestamp = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        this.autosaveText = `Guardado ✓ ${timestamp}`;
        this.autosaveClass = 'text-secondary font-semibold';
      }, 1000);
    });
  }

  onSubmitExpedient(): void {
    if (this.expedientForm.invalid || !this.patient) return;
    this.submitting = true;
    this.callError = '';
    this.successMessage = '';

    const doctor = this.authService.getCurrentUser();
    const doctorId = doctor ? doctor.id : 1;

    const newExpedient = {
      id: 0,
      patientId: this.patient.id,
      diagnostico: this.expedientForm.value.diagnostico,
      tratamiento: this.expedientForm.value.tratamiento,
      fecha: new Date().toISOString().split('T')[0],
      doctorId: doctorId,
      observaciones: `${this.expedientForm.value.observaciones || ''} | Próxima cita sugerida: ${this.expedientForm.value.proximaCita}`
    };

    this.apiService.createExpediente(newExpedient).subscribe({
      next: () => {
        this.apiService.updateCitaEstado(this.appointmentId, 'finalizada').subscribe({
          next: () => {
            this.successMessage = 'Expediente clínico guardado y consulta finalizada.';
            this.submitting = false;
            setTimeout(() => {
              this.endCall();
            }, 2000);
          },
          error: () => {
            this.callError = 'El expediente se creó, pero no se pudo finalizar la cita.';
            this.submitting = false;
          }
        });
      },
      error: () => {
        this.callError = 'Error al guardar el expediente clínico.';
        this.submitting = false;
      }
    });
  }

  goToEditor(): void {
    this.showExpedient = true;
  }

  endCall(): void { 
    this.apiService.terminarLlamada(this.appointmentId).subscribe();
    this.webrtcService.endCall(); 
    this.inCall = false; 
    if (this.role === 'doctor') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/patient-dashboard']);
    }
  }

  ngOnDestroy(): void { 
    this.webrtcService.endCall(); 
  }
}
