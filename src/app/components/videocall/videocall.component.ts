import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private webrtcService: WebRTCService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.role = this.authService.getUserRole();
    
    this.loadPatientFromAppointment();

    this.webrtcService.streamEvent.subscribe(stream => {
      if (this.remoteVideoRef) this.remoteVideoRef.nativeElement.srcObject = stream;
    });
    this.webrtcService.closeEvent.subscribe(() => { 
      this.inCall = false; 
      this.endCall();
    });
    this.webrtcService.errorEvent.subscribe(err => { this.callError = err.message; });
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

  goToEditor(): void {
    if (this.patient) {
      this.webrtcService.endCall();
      this.router.navigate(['/expedient-editor', this.patient.id, this.appointmentId]);
    } else {
      this.endCall();
    }
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
