import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selector',
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.css'],
})
export class RoleSelectorComponent {
  constructor(private router: Router) {}

  selectRole(role: 'paciente' | 'doctor' | 'admin'): void {
    this.router.navigate(['/login'], { queryParams: { role } });
  }
}
