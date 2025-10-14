import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PdfPaciente {
  id: number;
  uid_paciente: string;
  path: string;
  fecha_creacion: string;
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
  private apiUrl = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los PDFs de un paciente
   */
  obtenerPdfs(uidPaciente: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${uidPaciente}/pdf`);
  }

  /**
   * Subir un nuevo PDF
   */
  subirPdf(uidPaciente: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', archivo);

    return this.http.post(`${this.apiUrl}/${uidPaciente}/pdf`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Descargar un PDF
   */
  descargarPdf(uidPaciente: string, pdfId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${uidPaciente}/pdf/${pdfId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Ver un PDF en nueva pestaña
   */
  verPdf(uidPaciente: string, pdfId: number): void {
    const url = `${this.apiUrl}/${uidPaciente}/pdf/${pdfId}`;
    window.open(url, '_blank');
  }

  /**
   * Obtener información de un PDF
   */
  obtenerInfoPdf(uidPaciente: string, pdfId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${uidPaciente}/pdf/${pdfId}/info`);
  }

  /**
   * Eliminar un PDF
   */
  eliminarPdf(uidPaciente: string, pdfId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${uidPaciente}/pdf/${pdfId}`);
  }

  /**
   * Descargar PDF con nombre personalizado
   */
  descargarPdfConNombre(uidPaciente: string, pdfId: number, nombreArchivo: string): void {
    this.descargarPdf(uidPaciente, pdfId).subscribe(
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
}

