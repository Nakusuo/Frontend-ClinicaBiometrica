import { Component, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  loading = false;
  error = '';
  cameraActive = false;
  role: 'doctor' | 'paciente' = 'doctor';
  
  // Visual Guide fields
  email = '';
  showBiometrics = false;
  private stream: MediaStream | null = null;

  constructor(
    private authService: AuthService,
    private biometricService: BiometricService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['role'] === 'paciente') {
        this.role = 'paciente';
      } else {
        this.role = 'doctor';
      }
    });
  }

  async initiateBiometrics(): Promise<void> {
    if (!this.email || !this.email.includes('@')) {
      this.error = 'Por favor ingrese un correo electrónico válido.';
      return;
    }
    this.showBiometrics = true;
    await this.startCamera();
  }

  cancelBiometrics(): void {
    this.showBiometrics = false;
    this.cameraActive = false;
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
      this.stream = null;
    }
  }

  async startCamera(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.biometricService.loadModels();
      this.stream = await this.biometricService.startCamera(this.videoRef.nativeElement);
      this.cameraActive = !!this.stream;
    } catch {
      this.error = 'No se pudo acceder a la cámara';
      this.showBiometrics = false;
    }
    this.loading = false;
  }

  async captureAndLogin(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const embedding = await this.biometricService.detectFace(this.videoRef.nativeElement);
      if (!embedding) {
        this.error = 'No se detectó ningún rostro';
        this.loading = false;
        return;
      }
      this.authService.loginFacial(Array.from(embedding), this.role).subscribe({
        next: (res) => {
          const userObj = this.role === 'doctor' ? (res.doctor || res.user || res) : (res.patient || res.user || res);
          this.authService.setSession(userObj, this.role);
          if (this.role === 'doctor') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/patient-dashboard']);
          }
        },
        error: () => {
          this.error = 'Rostro no reconocido';
          this.loading = false;
        },
      });
    } catch {
      this.error = 'Error al procesar la imagen';
      this.loading = false;
    }
  }

  bypassLogin(): void {
    this.loading = true;
    this.error = '';
    if (this.role === 'doctor') {
      const mockDoctor = {
        id: 1,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        especialidad: 'Medicina General',
        email: this.email || 'carlos.mendoza@clinica.com',
        telefono: '+51 999 111 222'
      };
      this.authService.setSession(mockDoctor, 'doctor');
      this.router.navigate(['/dashboard']);
    } else {
      const mockPatient = {
        id: 1,
        nombre: 'María',
        apellido: 'Delgado',
        dni: '76543210',
        fechaNacimiento: '1995-10-20',
        telefono: '+51 987 654 321',
        email: this.email || 'maria.delgado@email.com',
        direccion: 'Av. Larco 456, Miraflores'
      };
      this.authService.setSession(mockPatient, 'paciente');
      this.router.navigate(['/patient-dashboard']);
    }
    this.loading = false;
  }

  ngOnDestroy(): void {
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
    }
  }
}
