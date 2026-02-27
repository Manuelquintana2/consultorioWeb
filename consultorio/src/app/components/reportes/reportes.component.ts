import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ReportesService  } from '../../services/reportes.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  imports: [CommonModule,ReactiveFormsModule]
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {

  reportes: any[] = [];
  reporteForm: FormGroup;
  editMode: boolean = false;
  reporteEditId: number | null = null;

  vista: 'reportes' | 'estadisticas' = 'estadisticas';

  filtrosForm: FormGroup;
  logsIngresos: Array<{ usuario_uid?: string; usuario: string; dia: string; hora: string; created_at?: string }> = [];
  turnosPorEspecialista: Array<{ especialista_uid: string; especialista_email: string; especialidad: string; cantidad: number }> = [];
  turnosPorDia: Array<{ dia: string; especialista_uid: string; especialista_email: string; especialidad: string; cantidad: number }> = [];
  completadosPorMedico: Array<{ especialista_uid: string; especialista_email: string; especialidad: string; cantidad_completados: number }> = [];

  @ViewChild('turnosEspecialistaBar') turnosEspecialistaBar?: ElementRef<HTMLCanvasElement>;
  @ViewChild('turnosDiaBar') turnosDiaBar?: ElementRef<HTMLCanvasElement>;
  @ViewChild('completadosPie') completadosPie?: ElementRef<HTMLCanvasElement>;

  private chartTurnosEspecialista?: Chart;
  private chartTurnosDia?: Chart;
  private chartCompletados?: Chart;
  private viewReady = false;

  constructor(
    private reportesService: ReportesService,
    private fb: FormBuilder
  ) {
    this.reporteForm = this.fb.group({
      reporte: ['', Validators.required]
    });

    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 30);

    const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

    this.filtrosForm = this.fb.group({
      from: [toIsoDate(desde)],
      to: [toIsoDate(hoy)]
    });
  }

  ngOnInit(): void {
    this.obtenerReportes();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderAllCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  obtenerReportes() {
    this.reportesService.obtenerReportes().subscribe((res: any) => {
      this.reportes = res.data;
    });
  }

  cambiarVista(v: 'reportes' | 'estadisticas') {
    this.vista = v;
    if (v === 'estadisticas') {
      setTimeout(() => this.renderAllCharts(), 0);
    }
  }

  cargarEstadisticas() {
    const { from, to } = this.filtrosForm.value || {};
    const params = {
      from: from || undefined,
      to: to || undefined
    };

    this.reportesService.obtenerLogsIngresos({ ...params, limit: 200 }).subscribe((res: any) => {
      this.logsIngresos = res.data || [];
    });

    this.reportesService.obtenerTurnosPorEspecialista(params).subscribe((res: any) => {
      this.turnosPorEspecialista = res.data || [];
      this.renderTurnosPorEspecialistaChart();
    });

    this.reportesService.obtenerTurnosPorDia(params).subscribe((res: any) => {
      this.turnosPorDia = res.data || [];
      this.renderTurnosPorDiaChart();
    });

    this.reportesService.obtenerCompletadosPorMedico(params).subscribe((res: any) => {
      this.completadosPorMedico = res.data || [];
      this.renderCompletadosPieChart();
    });
  }

  private destroyCharts() {
    this.chartTurnosEspecialista?.destroy();
    this.chartTurnosDia?.destroy();
    this.chartCompletados?.destroy();
    this.chartTurnosEspecialista = undefined;
    this.chartTurnosDia = undefined;
    this.chartCompletados = undefined;
  }

  private renderAllCharts() {
    this.renderTurnosPorEspecialistaChart();
    this.renderTurnosPorDiaChart();
    this.renderCompletadosPieChart();
  }

  private palette(idx: number) {
    const colors = [
      '#4a90e2',
      '#6c5ce7',
      '#00b894',
      '#fdcb6e',
      '#e17055',
      '#d63031',
      '#0984e3',
      '#2d3436',
      '#00cec9',
      '#e84393'
    ];
    return colors[idx % colors.length];
  }

  private renderTurnosPorEspecialistaChart() {
    if (!this.viewReady || !this.turnosEspecialistaBar?.nativeElement) return;

    const labels = this.turnosPorEspecialista.map((x) => x.especialista_email);
    const data = this.turnosPorEspecialista.map((x) => x.cantidad);

    this.chartTurnosEspecialista?.destroy();
    if (labels.length === 0) return;

    this.chartTurnosEspecialista = new Chart(this.turnosEspecialistaBar.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos',
            data,
            backgroundColor: labels.map((_, i) => this.palette(i))
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  private renderTurnosPorDiaChart() {
    if (!this.viewReady || !this.turnosDiaBar?.nativeElement) return;

    const dias = Array.from(new Set(this.turnosPorDia.map((x) => x.dia))).sort();

    this.chartTurnosDia?.destroy();
    if (dias.length === 0) return;

    // Totalizar turnos por día (todos los especialistas)
    const data = dias.map((dia) => {
      return this.turnosPorDia
        .filter((x) => x.dia === dia)
        .reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
    });

    this.chartTurnosDia = new Chart(this.turnosDiaBar.nativeElement, {
      type: 'bar',
      data: {
        labels: dias,
        datasets: [
          {
            label: 'Turnos totales',
            data,
            backgroundColor: dias.map((_, i) => this.palette(i))
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {},
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  private renderCompletadosPieChart() {
    if (!this.viewReady || !this.completadosPie?.nativeElement) return;

    const labels = this.completadosPorMedico.map((x) => x.especialista_email);
    const data = this.completadosPorMedico.map((x) => x.cantidad_completados);

    this.chartCompletados?.destroy();
    if (labels.length === 0) return;

    this.chartCompletados = new Chart(this.completadosPie.nativeElement, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            label: 'Completados',
            data,
            backgroundColor: labels.map((_, i) => this.palette(i))
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
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
