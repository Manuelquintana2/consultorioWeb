import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Turno } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TurnosService {
  private apiUrl = `${environment.apiUrl}/turnos`;

  constructor(private http: HttpClient) {}

  getTurnos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getTurnosPorFecha(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fecha/${fecha}`);
  }

  crearTurno(turno: Omit<Turno, 'uid'>): Observable<any> {
    return this.http.post(this.apiUrl, turno);
  }

  actualizarTurno(uid: string, turno: Partial<Turno>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${uid}`, turno);
  }

  cancelarTurno(uid: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${uid}/cancelar`, {});
  }

  completarTurno(uid: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${uid}/completar`, {});
  }
} 