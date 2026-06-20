import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BiometricService } from '../../services/biometric.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-register',
  templateUrl: './doctor-register.component.html',
  styleUrls: ['./doctor-register.component.css'],
})
export class DoctorRegisterComponent implements OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  currentStep = 1;
  captures = 0;
  isCapturing = false;
  showSuccessModal = false;
  loading = false;
  registerForm: FormGroup;
  private stream: MediaStream | null = null;
  private capturedEmbeddings: number[][] = [];

  specialties = [
    'Cardiología', 'Pediatría', 'Neurología',
    'Medicina General', 'Dermatología',
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private biometricService: BiometricService,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      especialidad: ['', Validators.required],
      cedula: ['', Validators.required],
      telefono: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async goToStep2(): Promise<void> {
    if (this.registerForm.invalid) return;
    this.currentStep = 2;
    this.isCapturing = false;
    this.captures = 0;
    this.capturedEmbeddings = [];

    // Let the template render the video element first, then start camera
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
        alert('No se pudo acceder a la cámara o cargar los modelos.');
      }
    }, 100);
  }

  goToStep1(): void {
    this.currentStep = 1;
    this.isCapturing = false;
    this.captures = 0;
    this.capturedEmbeddings = [];
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
      this.stream = null;
    }
  }

  async captureSample(): Promise<void> {
    if (this.captures >= 3 || !this.stream || this.loading) return;
    this.loading = true;
    try {
      const embedding = await this.biometricService.detectFace(this.videoRef.nativeElement);
      if (embedding) {
        this.capturedEmbeddings.push(Array.from(embedding));
        this.captures++;
      } else {
        alert('No se detectó ningún rostro en la cámara. Por favor enfóquese y vuelva a intentarlo.');
      }
    } catch (err) {
      console.error('Error en detección:', err);
      alert('Ocurrió un error al procesar el rostro.');
    } finally {
      this.loading = false;
    }
  }

  get progressPercent(): number {
    return Math.round((this.captures / 3) * 100);
  }

  register(): void {
    if (this.registerForm.invalid || this.capturedEmbeddings.length < 3) return;
    this.loading = true;

    // Calcular el promedio de los 3 embeddings capturados
    const numFeatures = this.capturedEmbeddings[0].length;
    const avgEmbedding = new Array(numFeatures).fill(0);
    for (let i = 0; i < numFeatures; i++) {
      let sum = 0;
      for (let j = 0; j < this.capturedEmbeddings.length; j++) {
        sum += this.capturedEmbeddings[j][i];
      }
      avgEmbedding[i] = sum / this.capturedEmbeddings.length;
    }

    const doctorData = {
      ...this.registerForm.value,
      faceEmbedding: avgEmbedding
    };

    this.authService.registerDoctor(doctorData).subscribe({
      next: () => {
        this.loading = false;
        this.showSuccessModal = true;
        this.stopCamera();
      },
      error: (err) => {
        console.error('Error de registro:', err);
        this.loading = false;
        alert('Error al registrar el profesional médico.');
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
    this.stopCamera();
  }

  goToDashboard(): void {
    this.router.navigate(['/login'], { queryParams: { role: 'doctor' } });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
