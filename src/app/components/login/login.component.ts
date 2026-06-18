import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  loading = false;
  error = '';
  cameraActive = false;
  private stream: MediaStream | null = null;

  constructor(
    private authService: AuthService,
    private biometricService: BiometricService,
    private router: Router
  ) {}

  async startCamera(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.biometricService.loadModels();
      this.stream = await this.biometricService.startCamera(this.videoRef.nativeElement);
      this.cameraActive = !!this.stream;
    } catch {
      this.error = 'No se pudo acceder a la cámara';
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
      this.authService.loginFacial(Array.from(embedding)).subscribe({
        next: (res) => {
          this.authService.setSession(res.doctor);
          this.router.navigate(['/dashboard']);
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

  ngOnDestroy(): void {
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
    }
  }
}
