import { Component, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BiometricService } from '../../services/biometric.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-setup-biometrics',
  templateUrl: './setup-biometrics.component.html',
  styleUrls: ['./setup-biometrics.component.css']
})
export class SetupBiometricsComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  captures = 0;
  isCapturing = false;
  showSuccessModal = false;
  loading = false;
  error = '';
  private stream: MediaStream | null = null;
  private capturedEmbeddings: number[][] = [];
  currentUser: any = null;

  constructor(
    private router: Router,
    private biometricService: BiometricService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.startCamera();
  }

  async startCamera(): Promise<void> {
    this.isCapturing = false;
    this.captures = 0;
    this.capturedEmbeddings = [];
    this.error = '';

    setTimeout(async () => {
      try {
        this.loading = true;
        await this.biometricService.loadModels();
        this.stream = await this.biometricService.startCamera(this.videoRef.nativeElement);
        this.isCapturing = !!this.stream;
        this.loading = false;
      } catch (err) {
        console.error('Error al iniciar cámara:', err);
        this.loading = false;
        this.error = 'No se pudo acceder a la cámara o cargar los modelos.';
      }
    }, 100);
  }

  async captureSample(): Promise<void> {
    if (this.captures >= 3 || !this.stream || this.loading) return;
    this.loading = true;
    this.error = '';
    try {
      const embedding = await this.biometricService.detectFace(this.videoRef.nativeElement);
      if (embedding) {
        this.capturedEmbeddings.push(Array.from(embedding));
        this.captures++;
      } else {
        this.error = 'No se detectó ningún rostro en la cámara. Por favor enfóquese y vuelva a intentarlo.';
      }
    } catch (err) {
      console.error('Error en detección:', err);
      this.error = 'Ocurrió un error al procesar el rostro.';
    } finally {
      this.loading = false;
    }
  }

  get progressPercent(): number {
    return Math.round((this.captures / 3) * 100);
  }

  registerBiometrics(): void {
    if (this.capturedEmbeddings.length < 3 || !this.currentUser) return;
    this.loading = true;
    this.error = '';

    // Calcular el promedio de los 3 embeddings
    const numFeatures = this.capturedEmbeddings[0].length;
    const avgEmbedding = new Array(numFeatures).fill(0);
    for (let i = 0; i < numFeatures; i++) {
      let sum = 0;
      for (let j = 0; j < this.capturedEmbeddings.length; j++) {
        sum += this.capturedEmbeddings[j][i];
      }
      avgEmbedding[i] = sum / this.capturedEmbeddings.length;
    }

    this.authService.saveDoctorBiometrics(this.currentUser.id, avgEmbedding).subscribe({
      next: () => {
        this.loading = false;
        this.showSuccessModal = true;
        this.stopCamera();
        
        // Actualizar el estado del usuario localmente
        this.currentUser.has_biometrics = true;
        sessionStorage.setItem('user', JSON.stringify(this.currentUser));
      },
      error: (err) => {
        console.error('Error al guardar biometría:', err);
        this.loading = false;
        this.error = 'Error al registrar su biometría facial.';
      }
    });
  }

  stopCamera(): void {
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
      this.stream = null;
    }
    this.isCapturing = false;
  }

  bypassCaptures(): void {
    this.capturedEmbeddings = [
      new Array(128).fill(0.1),
      new Array(128).fill(0.2),
      new Array(128).fill(0.3)
    ];
    this.captures = 3;
    this.isCapturing = false;
    this.error = '';
    this.stopCamera();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
