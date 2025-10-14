import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PdfPaciente {
  id: number;
  uid_paciente: string;
  path: string;
  fecha_subida: string;
}

export interface PdfInfo extends PdfPaciente {
  fileInfo: {
    size: number;
    sizeFormatted: string;
    exists: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PacientesPdfService {
  private apiUrl = `${environment.apiUrl}/pdf-pacientes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los PDFs de un paciente
   */
  obtenerPdfs(uidPaciente: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/paciente/${uidPaciente}`);
  }

  /**
   * Obtener un PDF por ID
   */
  obtenerPdfPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Subir un nuevo PDF
   */
  subirPdf(uidPaciente: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', archivo);
    formData.append('uidPaciente', uidPaciente);

    return this.http.post(`${this.apiUrl}`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Descargar un PDF
   */
  descargarPdf(path: string): Observable<Blob> {
    // Construir URL sin /api porque los uploads están en la raíz del servidor
    const baseUrl = environment.apiUrl.replace('/api', '');
    return this.http.get(`${baseUrl}/${path}`, {
      responseType: 'blob'
    });
  }

  /**
   * Ver un PDF en nueva pestaña
   */
  verPdf(path: string): void {
    // Construir URL sin /api porque los uploads están en la raíz del servidor
    const baseUrl = environment.apiUrl.replace('/api', '');
    const url = `${baseUrl}/${path}`;
    window.open(url, '_blank');
  }

  /**
   * Eliminar un PDF
   */
  eliminarPdf(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Descargar PDF con nombre personalizado
   */
  descargarPdfConNombre(path: string, nombreArchivo: string): void {
    this.descargarPdf(path).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error => {
        console.error('Error al descargar PDF:', error);
      }
    );
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Extraer nombre del archivo del path
   */
  extraerNombreArchivo(path: string): string {
    const partes = path.split('-');
    if (partes.length > 2) {
      return partes.slice(2).join('-');
    }
    return path.split('/').pop() || 'archivo.pdf';
  }
}

