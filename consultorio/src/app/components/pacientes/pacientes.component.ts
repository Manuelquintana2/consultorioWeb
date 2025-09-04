import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PacientesService } from '../../services/pacientes.service';
import { Paciente } from '../../models';
import { FiltroPacientesPipe } from '../../pipes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FiltroPacientesPipe],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  pacientes: any[] = [];
  pacienteForm: FormGroup;
  editando = false;
  mostrandoFormulario = false;
  pacienteEditando: any = null;
  loading = false;
  filtroPacientes = '';

  constructor(
    private pacientesService: PacientesService,
    private fb: FormBuilder
  ) {
    this.pacienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      obraSocial: ['', [Validators.required]],
      domicilio: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      fechaNacimiento: ['', [Validators.required]],
      localidad: ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]],
      seccion: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarPacientes();
    
    // Convertir obra social a mayúsculas automáticamente
    this.pacienteForm.get('obraSocial')?.valueChanges.subscribe(value => {
      if (value) {
        this.pacienteForm.get('obraSocial')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });
    
    // Validar que el teléfono solo contenga números
    this.pacienteForm.get('telefono')?.valueChanges.subscribe(value => {
      if (value) {
        const soloNumeros = value.replace(/[^0-9]/g, '');
        if (soloNumeros !== value) {
          this.pacienteForm.get('telefono')?.setValue(soloNumeros, { emitEvent: false });
        }
      }
    });
  }

  cargarPacientes(): void {
    this.loading = true;
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
        console.error('Error:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.pacienteForm.valid) {
      this.loading = true;
      const pacienteData = this.pacienteForm.value;

      if (this.editando && this.pacienteEditando) {
        this.pacientesService.actualizarPaciente(this.pacienteEditando.uid, pacienteData).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Paciente actualizado exitosamente');
              this.cargarPacientes();
              this.resetForm();
            } else {
              this.showError(response.message || 'Error al actualizar paciente');
            }
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al actualizar paciente');
          },
          complete: () => {
            this.loading = false;
          }
        });
      } else {
        this.pacientesService.crearPaciente(pacienteData).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Paciente creado exitosamente');
              this.cargarPacientes();
              this.resetForm();
            } else {
              this.showError(response.message || 'Error al crear paciente');
            }
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al crear paciente');
          },
          complete: () => {
            this.loading = false;
          }
        });
      }
    }
  }

  editarPaciente(paciente: any): void {
    this.editando = true;
    this.mostrandoFormulario = true;
    this.pacienteEditando = paciente;
    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      obraSocial: paciente.obrasocial,
      domicilio: paciente.domicilio,
      telefono: paciente.telefono,
      fechaNacimiento: paciente.fechanacimiento,
      localidad: paciente.localidad || '',
      seccion: paciente.seccion
    });
  }

  eliminarPaciente(uid: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.pacientesService.eliminarPaciente(uid).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Paciente eliminado exitosamente');
              this.cargarPacientes();
            } else {
              this.showError(response.message || 'Error al eliminar paciente');
            }
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al eliminar paciente');
          },
          complete: () => {
            this.loading = false;
          }
        });
      }
    });
  }

  resetForm(): void {
    this.pacienteForm.reset();
    this.editando = false;
    this.mostrandoFormulario = true;
    this.pacienteEditando = null;
  }

  cancelarEdicion(): void {
    this.pacienteForm.reset();
    this.editando = false;
    this.mostrandoFormulario = false;
    this.pacienteEditando = null;
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
    this.pacienteForm.enable();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Aceptar'
    });
  }
} 