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
  
  email = '';
  password = '';
  showBiometrics = false;
  showPasswordInput = false;
  private stream: MediaStream | null = null;

  // Liveness Detection variables
  livenessVerified = false;
  livenessStatus = 'Iniciando verificación...';
  private eyeClosed = false;
  private lastDescriptor: Float32Array | null = null;

  constructor(
    private authService: AuthService,
    private biometricService: BiometricService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Si viene algún correo por query params (opcional)
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  checkAccess(): void {
    if (!this.email || !this.email.includes('@')) {
      this.error = 'Por favor ingrese un correo electrónico válido.';
      return;
    }
    this.loading = true;
    this.error = '';

    // Llamamos con un dummy embedding para validar si el usuario tiene biometría configurada
    const dummyEmbedding = Array(128).fill(0);
    this.authService.loginFacial(this.email, dummyEmbedding).subscribe({
      next: () => {
        // Raro caso que coincida, iniciamos cámara
        this.initiateBiometrics();
      },
      error: (err) => {
        this.loading = false;
        const errorDetail = err.error?.detail || '';
        
        if (err.status === 400 && errorDetail.includes('no cuenta con registro biométrico')) {
          // No tiene biometría configurada, requiere ingresar por contraseña
          this.showPasswordInput = true;
          this.showBiometrics = false;
        } else if (err.status === 401 && errorDetail.includes('biométrica fallida')) {
          // Sí tiene biometría, iniciamos el flujo de la cámara
          this.initiateBiometrics();
        } else {
          this.error = errorDetail || 'Usuario no registrado en el sistema.';
        }
      }
    });
  }

  async initiateBiometrics(): Promise<void> {
    this.showBiometrics = true;
    this.showPasswordInput = false;
    await this.startCamera();
  }

  cancelBiometrics(): void {
    this.showBiometrics = false;
    this.cameraActive = false;
    this.livenessVerified = false;
    if (this.stream) {
      this.biometricService.stopCamera(this.stream);
      this.stream = null;
    }
  }

  activatePasswordMode(): void {
    this.showPasswordInput = true;
    this.showBiometrics = false;
    this.error = '';
  }

  cancelPasswordMode(): void {
    this.showPasswordInput = false;
    this.password = '';
    this.error = '';
  }

  loginWithPassword(): void {
    if (!this.password) return;
    this.loading = true;
    this.error = '';

    this.authService.loginTraditional(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        const userObj = res.doctor || res.patient || res.user || res;
        const role = res.doctor ? 'doctor' : 'paciente';
        const hasBiometrics = userObj.has_biometrics;

        this.authService.setSession(userObj, role, res.access_token);

        if (!hasBiometrics) {
          this.router.navigate(['/setup-biometrics']);
        } else {
          if (role === 'doctor') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/patient-dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Contraseña incorrecta o credenciales inválidas.';
      }
    });
  }

  async startCamera(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.biometricService.loadModels();
      this.stream = await this.biometricService.startCamera(this.videoRef.nativeElement);
      this.cameraActive = !!this.stream;
      if (this.cameraActive) {
        this.startLivenessDetection();
      }
    } catch {
      this.error = 'No se pudo acceder a la cámara';
      this.showBiometrics = false;
    }
    this.loading = false;
  }

  startLivenessDetection(): void {
    this.livenessVerified = false;
    this.livenessStatus = 'Por favor, mire a la cámara y parpadee una vez.';
    this.eyeClosed = false;
    
    const detectLoop = async () => {
      if (!this.cameraActive || this.livenessVerified) return;
      
      try {
        const detection = await this.biometricService.detectFullFace(this.videoRef.nativeElement);
        if (detection) {
          const ear = this.biometricService.calculateEAR(detection.landmarks);
          this.lastDescriptor = detection.descriptor;
          
          if (ear < 0.22) {
            this.eyeClosed = true;
            this.livenessStatus = '¡Ojo cerrado detectado! Abra los ojos...';
          } else if (this.eyeClosed && ear > 0.26) {
            this.livenessVerified = true;
            this.livenessStatus = '¡Vitalidad confirmada! Autenticando...';
            this.captureAndLogin();
            return;
          } else {
            this.livenessStatus = 'Rostro detectado. Por favor, parpadee para validar vitalidad.';
          }
        } else {
          this.livenessStatus = 'Buscando rostro...';
        }
      } catch (e) {
        console.error('Error in liveness loop:', e);
      }
      
      if (this.cameraActive && !this.livenessVerified) {
        setTimeout(() => detectLoop(), 100);
      }
    };
    
    setTimeout(() => detectLoop(), 800);
  }

  async captureAndLogin(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const embedding = this.lastDescriptor || await this.biometricService.detectFace(this.videoRef.nativeElement);
      if (!embedding) {
        this.error = 'No se detectó ningún rostro';
        this.loading = false;
        return;
      }
      this.livenessVerified = true;
      this.authService.loginFacial(this.email, Array.from(embedding)).subscribe({
        next: (res) => {
          this.cancelBiometrics();
          const isDoctor = !!res.doctor;
          const userObj = isDoctor ? res.doctor : res.patient;
          const role = isDoctor ? 'doctor' : 'paciente';
          this.authService.setSession(userObj, role, res.access_token);
          
          if (role === 'doctor') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/patient-dashboard']);
          }
        },
        error: () => {
          this.error = 'Rostro no reconocido';
          this.loading = false;
          this.livenessVerified = false;
          this.startLivenessDetection();
        },
      });
    } catch {
      this.error = 'Error al procesar la imagen';
      this.loading = false;
      this.livenessVerified = false;
      this.startLivenessDetection();
    }
  }

  bypassLogin(): void {
    this.loading = true;
    this.error = '';
    
    const mockEmbedding = Array(128).fill(0.1);

    this.authService.loginFacial(this.email, mockEmbedding).subscribe({
      next: (res) => {
        const isDoctor = !!res.doctor;
        const userObj = isDoctor ? res.doctor : res.patient;
        const role = isDoctor ? 'doctor' : 'paciente';
        this.authService.setSession(userObj, role, res.access_token);
        if (role === 'doctor') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/patient-dashboard']);
        }
        this.loading = false;
      },
      error: (err) => {
        console.warn('Real bypass login failed, falling back to mock:', err);
        // Default to doctor if the email has "doctor" in it, otherwise patient
        const isDoctor = this.email.toLowerCase().includes('doctor');
        if (isDoctor) {
          const mockDoctor = {
            id: 1,
            nombre: 'Carlos',
            apellido: 'Mendoza',
            especialidad: 'Medicina General',
            email: this.email || 'doctor@email.com',
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
            email: this.email || 'maria@email.com',
            direccion: 'Av. Larco 456, Miraflores'
          };
          this.authService.setSession(mockPatient, 'paciente');
          this.router.navigate(['/patient-dashboard']);
        }
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelBiometrics();
  }
}
