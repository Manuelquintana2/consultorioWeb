import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OdontogramasService {
  private apiUrl = `${environment.apiUrl}/odontogramas`;

  constructor(private http: HttpClient) {}

  getOdontogramaPorPaciente(paciente_uid: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/paciente/${paciente_uid}`);
  }

  getOdontograma(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getTodosOdontogramas(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  guardarOdontograma(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarOdontograma(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarOdontograma(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 