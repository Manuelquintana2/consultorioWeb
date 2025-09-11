import { Component, OnInit } from '@angular/core';
import { ReportesService  } from '../../services/reportes.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  imports: [CommonModule,ReactiveFormsModule]
})
export class ReportesComponent implements OnInit {

  reportes: any[] = [];
  reporteForm: FormGroup;
  editMode: boolean = false;
  reporteEditId: number | null = null;

  constructor(
    private reportesService: ReportesService,
    private fb: FormBuilder
  ) {
    this.reporteForm = this.fb.group({
      reporte: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.obtenerReportes();
  }

  obtenerReportes() {
    this.reportesService.obtenerReportes().subscribe((res: any) => {
      this.reportes = res.data;
    });
  }

  agregarReporte() {
    if (this.reporteForm.invalid) return;

    if (this.editMode && this.reporteEditId !== null) {
      // Editar
      this.reportesService.modificarReporte(this.reporteEditId, this.reporteForm.value).subscribe(() => {
        this.obtenerReportes();
        this.cancelarEdicion();
      });
    } else {
      // Crear nuevo
      this.reportesService.subirReporte(this.reporteForm.value).subscribe(() => {
        this.obtenerReportes();
        this.reporteForm.reset();
      });
    }
  }

  editarReporte(reporte: any) {
    this.editMode = true;
    this.reporteEditId = reporte.id;
    this.reporteForm.patchValue({
      reporte: reporte.reporte
    });
  }

  cancelarEdicion() {
    this.editMode = false;
    this.reporteEditId = null;
    this.reporteForm.reset();
  }


  eliminarReporte(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reportesService.eliminarReporte(id).subscribe(() => {
          this.obtenerReportes();
          Swal.fire({
            title: 'Eliminado',
            text: 'El reporte ha sido eliminado correctamente.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        });
      }
    });
  }

}
