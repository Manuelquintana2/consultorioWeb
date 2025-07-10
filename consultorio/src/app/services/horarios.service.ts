import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Horarios } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private apiUrl = `${environment.apiUrl}/horarios`;

  constructor(private http: HttpClient) {}

  getHorarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  actualizarHorarios(horarios: Horarios): Observable<any> {
    return this.http.put(this.apiUrl, horarios);
  }

  getHorariosDisponibles(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/disponibles/${fecha}`);
  }
} 