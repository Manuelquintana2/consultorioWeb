import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Si el usuario NO está autenticado, permite el acceso
    if (!this.authService.isAuthenticated()) {
      return true;
    } else {
      // Si el usuario YA está autenticado, redirige al dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }
  }
}

