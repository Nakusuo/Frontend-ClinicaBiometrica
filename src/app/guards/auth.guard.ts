import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

/**
 * Exige sesión activa. Si la ruta declara `data: { roles: [...] }`, además exige uno de esos roles
 * y manda al usuario a su propio panel cuando no corresponde.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.parseUrl('/login');
    }

    const roles = route.data['roles'] as UserRole[] | undefined;
    const role = this.authService.getUserRole();
    if (roles && (!role || !roles.includes(role))) {
      return this.router.parseUrl(this.authService.homeFor(role));
    }
    return true;
  }
}
