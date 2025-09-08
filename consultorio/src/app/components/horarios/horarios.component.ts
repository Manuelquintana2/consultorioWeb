import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HorariosService } from '../../services/horarios.service';
import { Horarios } from '../../models';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './horarios.component.html',
  styleUrls: ['./horarios.component.css']
})
export class HorariosComponent implements OnInit {
  horarios: any = null;
  horariosForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  horasDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  constructor(
    private horariosService: HorariosService,
    private fb: FormBuilder
  ) {
    this.horariosForm = this.fb.group({
      lunes: [[]],
      martes: [[]],
      miercoles: [[]],
      jueves: [[]],
      viernes: [[]],
      sabado: [[]]
    });
  }

  ngOnInit(): void {
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    this.loading = true;
    this.horariosService.getHorarios().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.horarios = response.data;
          this.horariosForm.patchValue({
            lunes: this.horarios.lunes || [],
            martes: this.horarios.martes || [],
            miercoles: this.horarios.miercoles || [],
            jueves: this.horarios.jueves || [],
            viernes: this.horarios.viernes || [],
            sabado: this.horarios.sabado || []
          });
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar horarios';
        console.error('Error:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.horariosForm.valid) {
      this.loading = true;
      const horariosData = this.horariosForm.value;

      this.horariosService.actualizarHorarios(horariosData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Horarios actualizados exitosamente';
            this.cargarHorarios();
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al actualizar horarios';
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  toggleHora(dia: string, hora: string): void {
    const diaControl = this.horariosForm.get(dia);
    if (diaControl) {
      const horasActuales = diaControl.value || [];
      const index = horasActuales.indexOf(hora);
      
      if (index > -1) {
        horasActuales.splice(index, 1);
      } else {
        horasActuales.push(hora);
      }
      
      horasActuales.sort();
      diaControl.setValue(horasActuales);
    }
  }

  isHoraSeleccionada(dia: string, hora: string): boolean {
    const diaControl = this.horariosForm.get(dia);
    if (diaControl) {
      const horasActuales = diaControl.value || [];
      return horasActuales.includes(hora);
    }
    return false;
  }

  seleccionarTodas(dia: string): void {
    const diaControl = this.horariosForm.get(dia);
    if (diaControl) {
      diaControl.setValue([...this.horasDisponibles]);
    }
  }

  deseleccionarTodas(dia: string): void {
    const diaControl = this.horariosForm.get(dia);
    if (diaControl) {
      diaControl.setValue([]);
    }
  }

  getDiaNombre(dia: string): string {
    const nombres = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado'
    };
    return nombres[dia as keyof typeof nombres] || dia;
  }

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
} 