import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Doctor } from '../../models/doctor';
import { aFechaISO } from '../../utils/fechas';

// Horarios de atención ofrecidos al paciente (cada 30 min, 8:00 a 17:30)
export const HORARIOS: string[] = Array.from({ length: 20 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = i % 2 ? '30' : '00';
  const sufijo = h < 12 ? 'AM' : 'PM';
  const h12 = h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${m} ${sufijo}`;
});

@Component({
  selector: 'app-appointment-book',
  templateUrl: './appointment-book.component.html',
})
export class AppointmentBookComponent implements OnInit {
  doctores: Doctor[] = [];
  horarios = HORARIOS;
  hoy = aFechaISO(new Date())!;
  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    doctorId: [0, [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.maxLength(200)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.getDoctores().subscribe({
      next: (doctores) => (this.doctores = doctores),
      error: () => (this.error = 'No se pudo cargar la lista de médicos.'),
    });
  }

  agendar(): void {
    const paciente = this.authService.getCurrentUser();
    if (this.form.invalid || !paciente) return;
    if (this.form.value.fecha! < this.hoy) {
      this.error = 'La fecha no puede ser anterior a hoy.';
      return;
    }
    this.loading = true;
    this.error = '';
    const { doctorId, fecha, hora, motivo } = this.form.getRawValue();
    this.apiService
      .createCita({ paciente_id: paciente.id, doctor_id: doctorId, fecha, hora, motivo })
      .subscribe({
        next: () => this.router.navigate(['/patient-dashboard']),
        error: (err) => {
          this.error = err?.error?.detail || 'No se pudo agendar la cita. Intenta de nuevo.';
          this.loading = false;
        },
      });
  }
}
