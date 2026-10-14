import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';

/** Registra o reemplaza el rostro del usuario que tiene la sesión abierta. */
@Component({
  selector: 'app-biometric-enroll',
  templateUrl: './biometric-enroll.component.html',
  styleUrls: ['./biometric-enroll.component.css'],
})
export class BiometricEnrollComponent implements OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  readonly totalSamples = 3;
  samples: number[][] = [];
  cameraActive = false;
  loading = false;
  saving = false;
  success = false;
  error = '';
  private stream: MediaStream | null = null;

  constructor(
    private biometricService: BiometricService,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  async startCamera(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.biometricService.loadModels();
      this.stream = await this.biometricService.startCamera(this.videoRef.nativeElement);
      this.cameraActive = !!this.stream;
      if (!this.stream) this.error = 'No se pudo acceder a la cámara.';
    } catch {
      this.error = 'No se pudo acceder a la cámara o cargar los modelos.';
    }
    this.loading = false;
  }

  async captureSample(): Promise<void> {
    if (!this.cameraActive || this.loading || this.samples.length >= this.totalSamples) return;
    this.loading = true;
    this.error = '';
    try {
      const descriptor = await this.biometricService.detectFace(this.videoRef.nativeElement);
      if (descriptor) {
        this.samples.push(Array.from(descriptor));
      } else {
        this.error = 'No se detectó ningún rostro. Mira a la cámara con buena luz e inténtalo de nuevo.';
      }
    } catch {
      this.error = 'Ocurrió un error al procesar el rostro.';
    }
    this.loading = false;
  }

  save(): void {
    const user = this.authService.getCurrentUser();
    const role = this.authService.getUserRole();
    if (!user || !role || this.samples.length < this.totalSamples) return;

    this.saving = true;
    this.error = '';
    const embedding = this.biometricService.averageEmbeddings(this.samples);
    this.apiService.registrarBiometria(role, user.id, embedding).subscribe({
      next: () => {
        this.saving = false;
        this.success = true;
        this.authService.updateCurrentUser({ has_biometrics: true });
        this.stopCamera();
      },
      error: () => {
        this.saving = false;
        this.error = 'No se pudo guardar tu rostro. Inténtalo de nuevo.';
      },
    });
  }

  restart(): void {
    this.samples = [];
    this.error = '';
  }

  goBack(): void {
    this.router.navigate([this.authService.homeFor(this.authService.getUserRole())]);
  }

  private stopCamera(): void {
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
      this.stream = null;
    }
    this.cameraActive = false;
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
