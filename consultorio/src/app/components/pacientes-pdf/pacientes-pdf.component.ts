import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PacientesPdfService, PdfPaciente } from '../../services/pacientes-pdf.service';
import { PacientesService } from '../../services/pacientes.service';

@Component({
  selector: 'app-pacientes-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes-pdf.component.html',
  styleUrls: ['./pacientes-pdf.component.css']
})
export class PacientesPdfComponent implements OnInit {
  uidPaciente: string = '';
  paciente: any = null;
  pdfs: PdfPaciente[] = [];
  loading: boolean = true;
  subiendo: boolean = false;
  progresoSubida: number = 0;
  
  // Modal y mensajes
  mostrarModalEliminar: boolean = false;
  pdfAEliminar: PdfPaciente | null = null;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pdfService: PacientesPdfService,
    private pacientesService: PacientesService
  ) {}

  ngOnInit(): void {
    this.uidPaciente = this.route.snapshot.paramMap.get('uid') || '';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Cargar información del paciente
    this.pacientesService.getPaciente(this.uidPaciente).subscribe({
      next: (response) => {
        if (response.success) {
          this.paciente = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar paciente:', error);
        this.mostrarMensaje('Error al cargar información del paciente', 'error');
      }
    });

    // Cargar PDFs
    this.cargarPdfs();
  }

  cargarPdfs(): void {
    this.pdfService.obtenerPdfs(this.uidPaciente).subscribe({
      next: (response) => {
        if (response.success) {
          this.pdfs = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar PDFs:', error);
        this.mostrarMensaje('Error al cargar los PDFs', 'error');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      this.mostrarMensaje('Solo se permiten archivos PDF', 'error');
      return;
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB en bytes
    if (file.size > maxSize) {
      this.mostrarMensaje('El archivo es demasiado grande. Máximo 50MB', 'error');
      return;
    }

    this.subirPdf(file);
  }

  subirPdf(archivo: File): void {
    this.subiendo = true;
    this.progresoSubida = 0;

    this.pdfService.subirPdf(this.uidPaciente, archivo).subscribe({
      next: (event: any) => {
        if (event.type === 1) { // UploadProgress
          this.progresoSubida = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === 4) { // Response
          this.mostrarMensaje('PDF subido exitosamente', 'success');
          this.cargarPdfs();
          this.subiendo = false;
          this.progresoSubida = 0;
          
          // Limpiar input file
          const input = document.getElementById('fileInput') as HTMLInputElement;
          if (input) input.value = '';
        }
      },
      error: (error) => {
        console.error('Error al subir PDF:', error);
        this.mostrarMensaje(
          error.error?.message || 'Error al subir el PDF',
          'error'
        );
        this.subiendo = false;
        this.progresoSubida = 0;
      }
    });
  }

  verPdf(pdf: PdfPaciente): void {
    this.pdfService.verPdf(this.uidPaciente, pdf.id);
  }

  descargarPdf(pdf: PdfPaciente): void {
    const nombreArchivo = pdf.path;
    this.pdfService.descargarPdfConNombre(this.uidPaciente, pdf.id, nombreArchivo);
  }

  confirmarEliminar(pdf: PdfPaciente): void {
    this.pdfAEliminar = pdf;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar = false;
    this.pdfAEliminar = null;
  }

  eliminarPdf(): void {
    if (!this.pdfAEliminar) return;

    this.pdfService.eliminarPdf(this.uidPaciente, this.pdfAEliminar.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('PDF eliminado exitosamente', 'success');
          this.cargarPdfs();
        }
      },
      error: (error) => {
        console.error('Error al eliminar PDF:', error);
        this.mostrarMensaje('Error al eliminar el PDF', 'error');
      },
      complete: () => {
        this.cancelarEliminar();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/pacientes']);
  }

  formatearFecha(fecha: string): string {
    return fecha;
  }

  formatearNombreArchivo(path: string): string {
    // Extraer solo el nombre del archivo sin el timestamp
    const partes = path.split('-');
    if (partes.length > 2) {
      return partes.slice(2).join('-');
    }
    return path;
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  cerrarMensaje(): void {
    this.mensaje = '';
  }
}
