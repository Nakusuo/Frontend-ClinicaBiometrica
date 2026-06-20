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

  // Mockup elements
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
    this.webrtcService.closeEvent.subscribe(() => { this.inCall = false; });
    this.webrtcService.errorEvent.subscribe(err => { this.callError = err.message; });
    
    // Automatically start call on enter for visual presentation
    setTimeout(() => {
      this.startCall();
    }, 500);
  }

  loadPatientFromAppointment(): void {
    this.apiService.getCita(this.appointmentId).subscribe({
      next: (cita) => {
        this.apiService.getPaciente(cita.patientId).subscribe({
          next: (pat) => {
            this.patient = pat;
          }
        });
      },
      error: () => {
        // Fallback for mock preview
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
      }
    });
  }

  async startCall(): Promise<void> {
    try {
      const localStream = await this.webrtcService.startLocalStream();
      this.localVideoRef.nativeElement.srcObject = localStream;
      this.webrtcService.createPeer(true);
      this.inCall = true;
    } catch { 
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
