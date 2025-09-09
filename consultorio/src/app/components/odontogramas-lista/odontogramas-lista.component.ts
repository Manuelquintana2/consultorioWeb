import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OdontogramasService } from '../../services/odontogramas.service';
import { PacientesService } from '../../services/pacientes.service';
import { OdontogramaComponent } from '../odontograma/odontograma.component';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { FiltroOdontogramasPipe } from '../../pipes/filtro-odontogramas.pipe';

@Component({
  selector: 'app-odontogramas-lista',
  standalone: true,
  imports: [CommonModule, OdontogramaComponent, FormsModule, FiltroOdontogramasPipe],
  templateUrl: './odontogramas-lista.component.html',
  styleUrls: ['./odontogramas-lista.component.css']
})
export class OdontogramasListaComponent implements OnInit {
  odontogramas: any[] = [];
  pacientes: any[] = [];
  loading = false;
  creando = false;
  editando = false;
  viendo = false;
  odontogramaSeleccionado: any = null;
  pacienteSeleccionado: any = null;
  filtroPacientes: string = '';

  constructor(
    private odontogramasService: OdontogramasService,
    private pacientesService: PacientesService
  ) {}

  ngOnInit(): void {
    this.cargarOdontogramas();
    this.cargarPacientes();
  }

  cargarOdontogramas(): void {
    this.loading = true;
    this.odontogramasService.getTodosOdontogramas().subscribe({
      next: (response) => {
        if (response.success) {
          this.odontogramas = response.data;
        }
      },
      complete: () => { this.loading = false; }
    });
  }

  cargarPacientes(): void {
    this.pacientesService.getPacientes().subscribe({
      next: (response) => {
        if (response.success) {
          this.pacientes = response.data.filter((p: any) => p.seccion === 'Odontologia' || p.seccion === 'Ambas');
        }
      }
    });
  }

  nuevoOdontograma(): void {
    this.creando = true;
    this.pacienteSeleccionado = null;
    this.odontogramaSeleccionado = null;
  }

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.odontogramaSeleccionado = null;
  }

  verOdontograma(odontograma: any): void {
    console.log('Ver odontograma:', odontograma); // DEBUG
    
    // Mostrar spinner de cargando
    Swal.fire({
      title: 'Cargando...',
      text: 'Cargando odontograma',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.viendo = true;
    this.editando = false;
    this.odontogramaSeleccionado = null; // Limpiar antes de cargar
    this.pacienteSeleccionado = this.pacientes.find(p => p.uid === odontograma.paciente_uid);

    // Cargar el odontograma completo por ID
    this.odontogramasService.getOdontograma(odontograma.id).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response); // DEBUG
        if (response.success && response.data) {
          this.odontogramaSeleccionado = response.data;
          console.log('Odontograma seleccionado:', this.odontogramaSeleccionado); // DEBUG
          // Cerrar el spinner
          Swal.close();
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el odontograma',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el odontograma',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editarOdontograma(odontograma: any): void {
    // Mostrar spinner de cargando
    Swal.fire({
      title: 'Cargando...',
      text: 'Cargando odontograma',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.editando = true;
    this.viendo = false;
    this.odontogramaSeleccionado = null; // Limpiar antes de cargar
    this.pacienteSeleccionado = this.pacientes.find(p => p.uid === odontograma.paciente_uid);

    // Cargar el odontograma completo por ID
    this.odontogramasService.getOdontograma(odontograma.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.odontogramaSeleccionado = response.data;
          // Cerrar el spinner
          Swal.close();
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el odontograma',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el odontograma',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  borrarOdontograma(odontograma: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Seguro que deseas borrar este odontograma?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.odontogramasService.eliminarOdontograma(odontograma.id).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                title: 'Odontograma eliminado',
                text: 'El odontograma ha sido eliminado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
              this.cargarOdontogramas();
            } else {
              Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el odontograma',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          },
          error: () => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el odontograma',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  cancelar(): void {
    this.creando = false;
    this.editando = false;
    this.viendo = false;
    this.odontogramaSeleccionado = null;
    this.pacienteSeleccionado = null;
  }

  getNombrePaciente(uid: string): string {
    const paciente = this.pacientes.find(p => p.uid === uid);
    return paciente ? paciente.nombre : 'Desconocido';
  }

  onOdontogramaGuardado(odontogramaGuardado: any): void {
    // Volver al listado
    this.cancelar();
    // Recargar la lista de odontogramas para mostrar el nuevo
    this.cargarOdontogramas();
  }
} 