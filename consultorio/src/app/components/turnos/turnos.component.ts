import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TurnosService } from '../../services/turnos.service';
import { PacientesService } from '../../services/pacientes.service';
import { HorariosService } from '../../services/horarios.service';
import { FiltroTurnosPipe } from '../../pipes';
import { Turno } from '../../models';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FiltroTurnosPipe],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: any[] = [];
  pacientes: any[] = [];
  horariosDisponibles: string[] = [];
  turnoForm: FormGroup;
  editando = false;
  mostrandoFormulario = false;
  turnoEditando: any = null;
  loading = false;
  filtroTurnos = '';
  fechaSeleccionada = '';
  especialistaSeleccionado = '';

  constructor(
    private turnosService: TurnosService,
    private pacientesService: PacientesService,
    private horariosService: HorariosService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.turnoForm = this.fb.group({
      especialista_uid: ['', [Validators.required]],
      paciente_uid: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      comentario: ['']
    });
  }

  ngOnInit(): void {
    this.cargarTurnos();
    this.cargarPacientes();
    this.fechaSeleccionada = new Date().toISOString().split('T')[0];
  }

  cargarTurnos(): void {
    this.loading = true;
    this.turnosService.getTurnos().subscribe({
      next: (response) => {
        if (response.success) {
          this.turnos = response.data;
        } else {
          this.showError('Error al cargar turnos: ' + response.message);
        }
      },
      error: (error) => {
        this.showError('Error al cargar turnos');
        console.error('Error:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  cargarPacientes(): void {
    this.pacientesService.getPacientes().subscribe({
      next: (response) => {
        if (response.success) {
          this.pacientes = response.data;
        } else {
          this.showError('Error al cargar pacientes: ' + response.message);
        }
      },
      error: (error) => {
        this.showError('Error al cargar pacientes');
        console.error('Error al cargar pacientes:', error);
      }
    });
  }

  onFechaChange(): void {
    if (this.turnoForm.get('fecha')?.value && this.turnoForm.get('especialista_uid')?.value) {
      this.cargarHorariosDisponibles();
    }
  }

  onEspecialistaChange(): void {
    if (this.turnoForm.get('fecha')?.value && this.turnoForm.get('especialista_uid')?.value) {
      console.log('cargando horarios disponibles');
      this.cargarHorariosDisponibles();
    }
  }
  isKinesiologo(): boolean {
    return this.authService.isKinesiologo();
  }
  isOdontologo(): boolean {
    return this.authService.isOdontologo();
  }

  cargarHorariosDisponibles(): void {
    const fecha = this.turnoForm.get('fecha')?.value;
    const especialista = this.turnoForm.get('especialista_uid')?.value;
    console.log('fecha', fecha);
    console.log('especialista', especialista);
    if (fecha && especialista) {
      this.horariosService.getHorariosDisponibles(fecha).subscribe({
        next: (response) => {
          if (response.success) {
            this.horariosDisponibles = response.data;
          } else {
            this.showError('Error al cargar horarios: ' + response.message);
          }
        },
        error: (error) => {
          this.showError('Error al cargar horarios disponibles');
          this.horariosDisponibles = [];
          console.error('Error al cargar horarios disponibles:', error);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.turnoForm.valid) {
      this.loading = true;
      const turnoData = this.turnoForm.value;

      if (this.editando && this.turnoEditando) {
        this.turnosService.actualizarTurno(this.turnoEditando.uid, turnoData).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Turno actualizado exitosamente');
              this.cargarTurnos();
              this.resetForm();
            } else {
              this.showError(response.message || 'Error al actualizar turno');
            }
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al actualizar turno');
          },
          complete: () => {
            this.loading = false;
          }
        });
      } else {
        this.turnosService.crearTurno(turnoData).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Turno creado exitosamente');
              this.cargarTurnos();
              this.resetForm();
            } else {
              this.showError(response.message || 'Error al crear turno');
            }
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al crear turno');
          },
          complete: () => {
            this.loading = false;
          }
        });
      }
    }
  }

  editarTurno(turno: any): void {
    this.editando = true;
    this.mostrandoFormulario = true;
    this.turnoEditando = turno;
    this.turnoForm.patchValue({
      especialista_uid: turno.especialista_uid,
      paciente_uid: turno.paciente_uid,
      fecha: turno.fecha,
      hora: turno.hora,
      comentario: turno.comentario || ''
    });
  }

  cancelarTurno(uid: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Quieres cancelar este turno?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.turnosService.cancelarTurno(uid).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Turno cancelado exitosamente');
              this.cargarTurnos();
            } else {
              this.showError(response.message || 'Error al cancelar turno');
            }
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al cancelar turno');
          },
          complete: () => {
            this.loading = false;
          }
        });
      }
    });
  }

  completarTurno(uid: string): void {
    this.loading = true;
    this.turnosService.completarTurno(uid).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Turno marcado como completado');
          this.cargarTurnos();
        } else {
          this.showError(response.message || 'Error al completar turno');
        }
      },
      error: (error) => {
        this.showError(error.error?.message || 'Error al completar turno');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.turnoForm.reset();
    this.editando = false;
    this.mostrandoFormulario = true;
    this.turnoEditando = null;
    this.horariosDisponibles = [];
  }

  cancelarEdicion(): void {
    this.turnoForm.reset();
    this.editando = false;
    this.mostrandoFormulario = false;
    this.turnoEditando = null;
    this.horariosDisponibles = [];
  }

  getPacienteNombre(uid: string): string {
    const paciente = this.pacientes.find(p => p.uid === uid);
    return paciente ? paciente.nombre : 'N/A';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'activo': return 'estado-activo';
      case 'cancelado': return 'estado-cancelado';
      case 'completado': return 'estado-completado';
      default: return '';
    }
  }

  showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: message,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Aceptar'
    });
  }

  showError(message: string): void {
    this.loading = false;
    this.turnoForm.enable();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Aceptar'
    });
  }
} 