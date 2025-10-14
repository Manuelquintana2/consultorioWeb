import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    canActivate: [NoAuthGuard]
  },
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
  { 
    path: 'fichas-kinesicas', 
    loadComponent: () => import('./components/fichas-kinesicas/fichas-kinesicas.component').then(m => m.FichasKinesicasComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'odontogramas',
    loadComponent: () => import('./components/odontogramas-lista/odontogramas-lista.component').then(m => m.OdontogramasListaComponent)
  },
  {
    path: 'reportes', loadComponent: () => import('./components/reportes/reportes.component').then(m => m.ReportesComponent)
  },
  { path: '**', redirectTo: '/login' }
];
