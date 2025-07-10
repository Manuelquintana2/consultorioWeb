import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'pacientes', 
    loadComponent: () => import('./components/pacientes/pacientes.component').then(m => m.PacientesComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'turnos', 
    loadComponent: () => import('./components/turnos/turnos.component').then(m => m.TurnosComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'horarios', 
    loadComponent: () => import('./components/horarios/horarios.component').then(m => m.HorariosComponent),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];
