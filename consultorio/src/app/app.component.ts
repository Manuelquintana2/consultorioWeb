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

  constructor(public authService: AuthService) { 

  }
  ngOnInit(): void {
    this.especialista = this.authService.getCurrentUser() as Especialista;
  }

}
