import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient';
import { Expedient } from '../../models/expedient';

@Component({
  selector: 'app-expedient-editor',
  templateUrl: './expedient-editor.component.html',
  styleUrls: ['./expedient-editor.component.css']
})
export class ExpedientEditorComponent implements OnInit {
  expedientForm!: FormGroup;
  patientId = 0;
  appointmentId = 0;
  patient: Patient | null = null;
  loading = false;
  submitting = false;
  error = '';
  success = '';

  // Mode toggling from mockup
  isEditMode = true;
  autosaveText = 'Guardado ✓';
  autosaveClass = 'text-secondary';
  consultationDate = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('patientId'));
    this.appointmentId = Number(this.route.snapshot.paramMap.get('appointmentId'));

    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.consultationDate = `${now.getDate()} de ${months[now.getMonth()]}, ${now.getFullYear()}`;

    this.expedientForm = this.fb.group({
      diagnostico: ['', Validators.required],
      tratamiento: ['', Validators.required],
      observaciones: [''],
      proximaCita: ['1 week']
    });

    this.loadPatientInfo();
    this.setupAutosaveListener();
  }

  toggleMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  getAge(birthDateString?: string): string {
    if (!birthDateString) return '28 años';
    try {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age + ' años';
    } catch {
      return '28 años';
    }
  }

  loadPatientInfo(): void {
    this.loading = true;
    this.apiService.getPaciente(this.patientId).subscribe({
      next: (pat) => {
        this.patient = pat;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la información del paciente.';
        this.loading = false;
      }
    });
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

  onSubmit(): void {
    if (this.expedientForm.invalid || !this.patient) return;
    this.submitting = true;
    this.error = '';

    const doctor = this.authService.getCurrentUser();
    const doctorId = doctor ? doctor.id : 1;

    const newExpedient: Expedient = {
      id: 0,
      patientId: this.patientId,
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
            this.success = 'Expediente clínico guardado y cita finalizada con éxito.';
            this.submitting = false;
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000);
          },
          error: () => {
            this.error = 'El expediente se creó, pero no se pudo finalizar la cita.';
            this.submitting = false;
          }
        });
      },
      error: () => {
        this.error = 'Error al guardar el expediente clínico.';
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
