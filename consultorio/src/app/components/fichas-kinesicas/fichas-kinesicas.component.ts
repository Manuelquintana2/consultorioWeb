import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FichasKinesicasService } from '../../services/fichas-kinesicas.service';
import { PacientesService } from '../../services/pacientes.service';
import { FichaKinesica, SesionKinesica, Paciente } from '../../models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fichas-kinesicas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './fichas-kinesicas.component.html',
  styleUrls: ['./fichas-kinesicas.component.css']
})
export class FichasKinesicasComponent implements OnInit {
  fichas: FichaKinesica[] = [];
  pacientes: Paciente[] = [];
  fichaForm: FormGroup;
  sesionForm: FormGroup;
  showForm = false;
  showSesionForm = false;
  editingFicha: FichaKinesica | null = null;
  selectedFicha: FichaKinesica | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private fichasService: FichasKinesicasService,
    private pacientesService: PacientesService,
    private fb: FormBuilder
  ) {
    this.fichaForm = this.fb.group({
      paciente_uid: ['', Validators.required],
      diagnostico: ['', Validators.required],
      evaluacion: ['', Validators.required],
      sintomas: ['', Validators.required],
      estudios: [[]],
      tratamiento: ['', Validators.required],
      sesiones: [[]],
      observaciones: ['', Validators.required]
    });

    this.sesionForm = this.fb.group({
      numero: ['', [Validators.required, Validators.min(1)]],
      fecha: ['', Validators.required],
      descripcion: [''],
      notas: ['']
    });
  }

  ngOnInit(): void {
    this.loadFichas();
    this.loadPacientes();
  }

  loadFichas(): void {
    this.loading = true;
    this.fichasService.getFichasKinesicas().subscribe({
      next: (fichas) => {
        this.fichas = fichas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando fichas:', error);
        this.errorMessage = 'Error al cargar las fichas kinesicas';
        this.loading = false;
      }
    });
  }

  loadPacientes(): void {
    this.pacientesService.getPacientes().subscribe({
      next: (response) => {
        if (response.success) {
          // Filtrar solo pacientes de kinesiología
          this.pacientes = response.data.filter((p: Paciente) => 
            p.seccion === 'Kinesiologia' || p.seccion === 'Ambas'
          );
        } else {
          this.errorMessage = 'Error al cargar los pacientes: ' + response.message;
        }
      },
      error: (error) => {
        console.error('Error cargando pacientes:', error);
        this.errorMessage = 'Error al cargar los pacientes';
      }
    });
  }

  showCreateForm(): void {
    this.showForm = true;
    this.editingFicha = null;
    this.fichaForm.reset();
  }

  showEditForm(ficha: FichaKinesica): void {
    this.showForm = true;
    this.editingFicha = ficha;
    this.fichaForm.patchValue({
      paciente_uid: ficha.paciente_uid,
      diagnostico: ficha.diagnostico,
      evaluacion: ficha.evaluacion,
      sintomas: ficha.sintomas,
      estudios: Array.isArray(ficha.estudios) ? ficha.estudios : [],
      tratamiento: ficha.tratamiento,
      sesiones: Array.isArray(ficha.sesiones) ? ficha.sesiones : [],
      observaciones: ficha.observaciones
    });
  }

  hideForm(): void {
    this.showForm = false;
    this.editingFicha = null;
    this.fichaForm.reset();
  }

  onSubmit(): void {
    if (this.fichaForm.valid) {
      this.loading = true;
      const fichaData = this.fichaForm.value;
      
      // Asegurar que estudios y sesiones sean arrays
      fichaData.estudios = fichaData.estudios || [];
      fichaData.sesiones = fichaData.sesiones || [];

      if (this.editingFicha) {
        // Actualizar ficha existente
        this.fichasService.updateFichaKinesica(this.editingFicha.id!, fichaData).subscribe({
          next: (ficha) => {
            const index = this.fichas.findIndex(f => f.id === ficha.id);
            if (index !== -1) {
              this.fichas[index] = ficha;
            }
            this.hideForm();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error actualizando ficha:', error);
            this.errorMessage = 'Error al actualizar la ficha';
            this.loading = false;
          }
        });
      } else {
        // Crear nueva ficha
        this.fichasService.createFichaKinesica(fichaData).subscribe({
          next: (ficha) => {
            this.fichas.unshift(ficha);
            this.hideForm();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creando ficha:', error);
            this.errorMessage = 'Error al crear la ficha';
            this.loading = false;
          }
        });
      }
    }
  }

  deleteFicha(ficha: FichaKinesica): void {
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
        this.fichasService.deleteFichaKinesica(ficha.id!).subscribe({
          next: () => {
            this.fichas = this.fichas.filter(f => f.id !== ficha.id);
            this.loading = false;
            Swal.fire(
              '¡Eliminada!',
              'La ficha ha sido eliminada.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error eliminando ficha:', error);
            this.errorMessage = 'Error al eliminar la ficha';
            this.loading = false;
            Swal.fire(
              'Error',
              'No se pudo eliminar la ficha.',
              'error'
            );
          }
        });
      }
    });
  }

  viewFicha(ficha: FichaKinesica): void {
    this.selectedFicha = ficha;
  }

  closeFichaView(): void {
    this.selectedFicha = null;
  }

  // Métodos para manejar sesiones
  showSesionFormModal(ficha: FichaKinesica): void {
    this.selectedFicha = ficha;
    this.showSesionForm = true;
    this.sesionForm.reset();
    
    // Auto-generar número de sesión
    const nextSessionNumber = (ficha.sesiones?.length || 0) + 1;
    this.sesionForm.patchValue({
      numero: nextSessionNumber,
      fecha: new Date().toISOString().split('T')[0]
    });
  }

  hideSesionForm(): void {
    this.showSesionForm = false;
    this.sesionForm.reset();
  }

  onSubmitSesion(): void {
    if (this.sesionForm.valid && this.selectedFicha) {
      this.loading = true;
      const sesionData = this.sesionForm.value;

      this.fichasService.agregarSesion(this.selectedFicha.id!, sesionData).subscribe({
        next: (ficha) => {
          const index = this.fichas.findIndex(f => f.id === ficha.id);
          if (index !== -1) {
            this.fichas[index] = ficha;
          }
          if (this.selectedFicha && this.selectedFicha.id === ficha.id) {
            this.selectedFicha = ficha;
          }
          this.hideSesionForm();
          this.loading = false;
          Swal.fire(
            '¡Sesión agregada!',
            'La sesión se ha agregado correctamente.',
            'success'
          );
        },
        error: (error) => {
          console.error('Error agregando sesión:', error);
          this.errorMessage = 'Error al agregar la sesión';
          this.loading = false;
          Swal.fire(
            'Error',
            'No se pudo agregar la sesión.',
            'error'
          );
        }
      });
    }
  }

  deleteSesion(ficha: FichaKinesica, numeroSesion: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Quieres eliminar esta sesión?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.fichasService.eliminarSesion(ficha.id!, numeroSesion).subscribe({
          next: (fichaActualizada) => {
            const index = this.fichas.findIndex(f => f.id === ficha.id);
            if (index !== -1) {
              this.fichas[index] = fichaActualizada;
            }
            if (this.selectedFicha && this.selectedFicha.id === ficha.id) {
              this.selectedFicha = fichaActualizada;
            }
            this.loading = false;
            Swal.fire(
              '¡Eliminada!',
              'La sesión ha sido eliminada.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error eliminando sesión:', error);
            this.errorMessage = 'Error al eliminar la sesión';
            this.loading = false;
            Swal.fire(
              'Error',
              'No se pudo eliminar la sesión.',
              'error'
            );
          }
        });
      }
    });
  }

  // Métodos para manejar estudios
  addEstudio(ficha: FichaKinesica, estudio: string): void {
    if (estudio.trim()) {
      // Obtener estudios actuales de la ficha
      const estudiosActuales = [...(ficha.estudios || [])];
      estudiosActuales.push(estudio.trim());
      this.updateFichaEstudios(ficha, estudiosActuales);
    }
  }

  removeEstudio(ficha: FichaKinesica, index: number): void {
    const estudiosActuales = [...(ficha.estudios || [])];
    estudiosActuales.splice(index, 1);
    this.updateFichaEstudios(ficha, estudiosActuales);
  }

  private updateFichaEstudios(ficha: FichaKinesica, estudios: string[]): void {
    this.loading = true;
    const fichaData = { ...ficha, estudios };
    
    this.fichasService.updateFichaKinesica(ficha.id!, fichaData).subscribe({
      next: (fichaActualizada) => {
        const index = this.fichas.findIndex(f => f.id === ficha.id);
        if (index !== -1) {
          this.fichas[index] = fichaActualizada;
        }
        if (this.selectedFicha && this.selectedFicha.id === ficha.id) {
          this.selectedFicha = fichaActualizada;
        }
        this.loading = false;
        Swal.fire(
          '¡Actualizado!',
          'Los estudios se han actualizado correctamente.',
          'success'
        );
      },
      error: (error) => {
        console.error('Error actualizando estudios:', error);
        this.errorMessage = 'Error al actualizar los estudios';
        this.loading = false;
        Swal.fire(
          'Error',
          'No se pudieron actualizar los estudios.',
          'error'
        );
      }
    });
  }

  getPacienteNombre(pacienteUid: string): string {
    const paciente = this.pacientes.find(p => p.uid === pacienteUid);
    return paciente ? paciente.nombre : 'Paciente no encontrado';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }
} 