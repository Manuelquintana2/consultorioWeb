import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { }

  // Crear reporte
  subirReporte(data: FormData) {
    return this.http.post(`${this.apiUrl}/`, data);
  }

  // Obtener todos los reportes
  obtenerReportes() {
    return this.http.get(`${this.apiUrl}`);
  }

  // Modificar reporte por id
  modificarReporte(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar reporte por id
  eliminarReporte(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
