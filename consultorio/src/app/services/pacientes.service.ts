import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paciente } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private apiUrl = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  getPacientes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getPaciente(uid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${uid}`);
  }

  crearPaciente(paciente: Omit<Paciente, 'uid' | 'lastLogin'>): Observable<any> {
    return this.http.post(this.apiUrl, paciente);
  }

  actualizarPaciente(uid: string, paciente: Partial<Paciente>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${uid}`, paciente);
  }

  eliminarPaciente(uid: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${uid}`);
  }
} 