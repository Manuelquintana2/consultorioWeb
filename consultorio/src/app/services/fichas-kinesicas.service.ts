import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FichaKinesica, SesionKinesica } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FichasKinesicasService {
  private apiUrl = `${environment.apiUrl}/fichas-kinesicas`;

  constructor(private http: HttpClient) { }

  // Obtener todas las fichas kinesicas
  getFichasKinesicas(): Observable<FichaKinesica[]> {
    return this.http.get<FichaKinesica[]>(this.apiUrl);
  }

  // Obtener fichas kinesicas por paciente
  getFichasKinesicasByPaciente(pacienteUid: string): Observable<FichaKinesica[]> {
    return this.http.get<FichaKinesica[]>(`${this.apiUrl}/paciente/${pacienteUid}`);
  }

  // Obtener una ficha kinesica específica
  getFichaKinesica(id: number): Observable<FichaKinesica> {
    return this.http.get<FichaKinesica>(`${this.apiUrl}/${id}`);
  }

  // Crear una nueva ficha kinesica
  createFichaKinesica(ficha: FichaKinesica): Observable<FichaKinesica> {
    return this.http.post<FichaKinesica>(this.apiUrl, ficha);
  }

  // Actualizar una ficha kinesica existente
  updateFichaKinesica(id: number, ficha: FichaKinesica): Observable<FichaKinesica> {
    return this.http.put<FichaKinesica>(`${this.apiUrl}/${id}`, ficha);
  }

  // Eliminar una ficha kinesica
  deleteFichaKinesica(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Agregar una nueva sesión a una ficha kinesica
  agregarSesion(id: number, sesion: SesionKinesica): Observable<FichaKinesica> {
    return this.http.post<FichaKinesica>(`${this.apiUrl}/${id}/sesiones`, sesion);
  }

  // Actualizar una sesión específica
  actualizarSesion(id: number, numeroSesion: number, sesion: SesionKinesica): Observable<FichaKinesica> {
    return this.http.put<FichaKinesica>(`${this.apiUrl}/${id}/sesiones/${numeroSesion}`, sesion);
  }

  // Eliminar una sesión
  eliminarSesion(id: number, numeroSesion: number): Observable<FichaKinesica> {
    return this.http.delete<FichaKinesica>(`${this.apiUrl}/${id}/sesiones/${numeroSesion}`);
  }
} 