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
  password = '';
  showBiometrics = false;
  showPasswordLogin = false;
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
      this.authService.loginFacial(this.email, Array.from(embedding), this.role).subscribe({
        next: (res) => this.startSession(res),
        error: (err) => {
          this.error = this.loginErrorMessage(err, 'Rostro no reconocido');
          this.loading = false;
        },
      });
    } catch {
      this.error = 'Error al procesar la imagen';
      this.loading = false;
    }
  }

  togglePasswordLogin(): void {
    this.showPasswordLogin = !this.showPasswordLogin;
    this.error = '';
  }

  loginWithPassword(): void {
    if (!this.email || !this.password) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.loginPassword(this.email, this.password, this.role).subscribe({
      next: (res) => this.startSession(res),
      error: (err) => {
        this.error = this.loginErrorMessage(err, 'Correo o contraseña incorrectos.');
        this.loading = false;
      },
    });
  }

  private startSession(res: any): void {
    const userObj = this.role === 'doctor' ? res.doctor : res.patient;
    if (!userObj || !res.access_token) {
      this.error = 'Esta cuenta no corresponde al portal seleccionado.';
      this.loading = false;
      return;
    }
    this.authService.setSession(userObj, this.role, res.access_token);
    this.router.navigate([this.authService.homeFor(this.role)]);
  }

  private loginErrorMessage(err: any, fallback: string): string {
    // 403 = médico registrado pero todavía sin aprobar
    if (err?.status === 403 && err?.error?.detail) return err.error.detail;
    if (err?.status === 0) return 'No se pudo conectar con el servidor.';
    return fallback;
  }

  ngOnDestroy(): void {
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
    }
  }
}
