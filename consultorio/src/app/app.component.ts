import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Especialista } from './models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'consultorio';
  especialista : any = null;
  menuAbierto: boolean = false;

  constructor(public authService: AuthService) { 

  }
  ngOnInit(): void {
    this.especialista = this.authService.getCurrentUser() as Especialista;
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  getBackgroundClass(): string {
    if (this.authService.isAuthenticated()) {
      const especialidad = this.authService.getCurrentUser()?.especialidad;
      if (especialidad === 'Kinesiologia') {
        return 'bg-kinesiologia';
      } else if (especialidad === 'Odontologia') {
        return 'bg-odontologia';
      }
    }
    // si no está autenticado o no tiene especialidad → kinesiología
    return 'bg-kinesiologia';
  }

}
