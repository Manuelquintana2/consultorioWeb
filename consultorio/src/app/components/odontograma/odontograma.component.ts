import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OdontogramasService } from '../../services/odontogramas.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-odontograma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './odontograma.component.html',
  styleUrls: ['./odontograma.component.css']
})
export class OdontogramaComponent implements OnInit, OnChanges {
  @Input() paciente: any;
  @Input() odontogramaInput: any = null;
  @Input() modoSoloLectura: boolean = false;
  @Output() odontogramaGuardado = new EventEmitter<any>();
  odontograma: any = null;
  loading = false;
  tipo: 'adulto' | 'nino' = 'adulto';

  // Estructura base de piezas y partes para adultos (32 dientes)
  piezasBaseAdulto = [
    [ ...[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28].map(num => ({
      numero_pieza: num,
      partes: this.partesBase()
    })) ],
    [ ...[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38].map(num => ({
      numero_pieza: num,
      partes: this.partesBase()
    })) ]
  ];

  // Estructura base de piezas y partes para niños (20 dientes)
  piezasBaseNino = [
    [ ...[55,54,53,52,51,61,62,63,64,65].map(num => ({
      numero_pieza: num,
      partes: this.partesBase()
    })) ],
    [ ...[85,84,83,82,81,71,72,73,74,75].map(num => ({
      numero_pieza: num,
      partes: this.partesBase()
    })) ]
  ];

  colorMenu = [
    { nombre: 'Rojo', color: '#e53935' },
    { nombre: 'Azul', color: '#1976d2' },
    { nombre: 'Verde', color: '#43a047' },
    { nombre: 'Amarillo', color: '#fbc02d' },
    { nombre: 'Naranja', color: '#fb8c00' },
    { nombre: 'Negro', color: '#222' },
    { nombre: 'Blanco', color: '#fff' }
  ];
  showColorMenu = false;
  colorMenuPos = { x: 0, y: 0 };
  colorTarget: { fila: number, piezaIdx: number, parteIdx: number } | null = null;
  colorActivo: string | null = null;
  simboloActivo: { simbolo: string, color: string } | null = null;

  constructor(private odontogramasService: OdontogramasService) {}

  partesBase() {
    return [
      { nombre_parte: 'vestibular', estado: '', tratamiento: '', color: '', observaciones: '' },
      { nombre_parte: 'lingual', estado: '', tratamiento: '', color: '', observaciones: '' },
      { nombre_parte: 'mesial', estado: '', tratamiento: '', color: '', observaciones: '' },
      { nombre_parte: 'distal', estado: '', tratamiento: '', color: '', observaciones: '' },
      { nombre_parte: 'oclusal', estado: '', tratamiento: '', color: '', observaciones: '' }
    ];
  }

  private normalizarPartes(pieza: any): any[] {
    const nombres = ['vestibular', 'lingual', 'mesial', 'distal', 'oclusal'];
    return nombres.map(nombre => {
      const parte = pieza.partes.find((p: any) => p.nombre_parte === nombre);
      return parte ? parte : { nombre_parte: nombre, estado: '', tratamiento: '', color: '', observaciones: '' };
    });
  }

  ngOnInit(): void {
    if (this.odontogramaInput) {
      this.cargarOdontogramaDesdeInput();
    } else {
      this.cargarOdontograma();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['odontogramaInput'] && changes['odontogramaInput'].currentValue) {
      this.cargarOdontogramaDesdeInput();
    } else if (changes['paciente'] && !changes['paciente'].firstChange) {
      this.cargarOdontograma();
    }
  }

  cargarOdontograma(): void {
    if (!this.paciente) return;
    this.loading = true;
    this.odontogramasService.getOdontogramaPorPaciente(this.paciente.uid).subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          this.odontograma = response.data[0];
          // Detectar tipo según cantidad de dientes
          const piezas = this.odontograma.piezas;
          if (piezas && Array.isArray(piezas)) {
            if (piezas.length === 32) {
              this.tipo = 'adulto';
              this.odontograma.piezas = [
                piezas.slice(0, 16).map(p => ({ ...p, partes: this.normalizarPartes(p) })),
                piezas.slice(16, 32).map(p => ({ ...p, partes: this.normalizarPartes(p) }))
              ];
            } else if (piezas.length === 20) {
              this.tipo = 'nino';
              this.odontograma.piezas = [
                piezas.slice(0, 10).map(p => ({ ...p, partes: this.normalizarPartes(p) })),
                piezas.slice(10, 20).map(p => ({ ...p, partes: this.normalizarPartes(p) }))
              ];
            } else {
              this.setOdontogramaBase();
            }
          } else {
            this.setOdontogramaBase();
          }
        } else {
          this.setOdontogramaBase();
        }
      },
      complete: () => { this.loading = false; }
    });
  }

  cargarOdontogramaDesdeInput() {
    console.log('Cargando odontograma desde input:', this.odontogramaInput); // DEBUG
    // Normaliza igual que en cargarOdontograma
    const piezas = this.odontogramaInput.piezas;
    console.log('Piezas del input:', piezas); // DEBUG
    if (piezas && Array.isArray(piezas)) {
      if (piezas.length === 32) {
        this.tipo = 'adulto';
        this.odontograma = {
          ...this.odontogramaInput,
          piezas: [
            piezas.slice(0, 16).map(p => ({ ...p, partes: this.normalizarPartes(p) })),
            piezas.slice(16, 32).map(p => ({ ...p, partes: this.normalizarPartes(p) }))
          ]
        };
        console.log('Odontograma normalizado (adulto):', this.odontograma); // DEBUG
      } else if (piezas.length === 20) {
        this.tipo = 'nino';
        this.odontograma = {
          ...this.odontogramaInput,
          piezas: [
            piezas.slice(0, 10).map(p => ({ ...p, partes: this.normalizarPartes(p) })),
            piezas.slice(10, 20).map(p => ({ ...p, partes: this.normalizarPartes(p) }))
          ]
        };
        console.log('Odontograma normalizado (niño):', this.odontograma); // DEBUG
      } else {
        this.setOdontogramaBase();
      }
    } else {
      this.setOdontogramaBase();
    }
  }

  setOdontogramaBase() {
    if (this.tipo === 'nino') {
      this.odontograma = { piezas: JSON.parse(JSON.stringify(this.piezasBaseNino)), observaciones: '' };
    } else {
      this.odontograma = { piezas: JSON.parse(JSON.stringify(this.piezasBaseAdulto)), observaciones: '' };
    }
  }

  cambiarTipo(tipo: 'adulto' | 'nino') {
    this.tipo = tipo;
    this.setOdontogramaBase();
  }

  guardarOdontograma(): void {
    if (!this.odontograma) return;
    this.loading = true;
    
    // Mostrar spinner de guardando
    Swal.fire({
      title: 'Guardando...',
      text: 'Guardando odontograma',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Aplanar el array de piezas (de [[fila1],[fila2]] a [..])
    const piezasPlanas = ([] as any[]).concat(...this.odontograma.piezas);
    const payload = {
      paciente_uid: this.paciente.uid,
      observaciones: this.odontograma.observaciones,
      piezas: piezasPlanas
    };

    // Determinar si es crear nuevo o editar existente
    const esEdicion = this.odontogramaInput && this.odontogramaInput.id;
    
    if (esEdicion) {
      // Es una edición - usar PUT
      this.odontogramasService.actualizarOdontograma(this.odontogramaInput.id, payload).subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: 'Odontograma actualizado',
              text: 'Odontograma actualizado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              // Emitir evento para que el componente padre sepa que se guardó exitosamente
              this.odontogramaGuardado.emit(response.data || payload);
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo actualizar el odontograma',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el odontograma',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        },
        complete: () => { this.loading = false; }
      });
    } else {
      // Es un nuevo odontograma - usar POST
      this.odontogramasService.guardarOdontograma(payload).subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: 'Odontograma guardado',
              text: 'Odontograma guardado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              // Emitir evento para que el componente padre sepa que se guardó exitosamente
              this.odontogramaGuardado.emit(response.data || payload);
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo guardar el odontograma',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo guardar el odontograma',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        },
        complete: () => { this.loading = false; }
      });
    }
  }

  // Métodos para manejar la interacción SVG (selección de parte, cambio de color, etc.)
  seleccionarParte(fila: number, piezaIdx: number, parteIdx: number): void {
    this.showColorMenu = true;
    this.colorMenuPos = { x: window.event instanceof MouseEvent ? window.event.clientX : 0, y: window.event instanceof MouseEvent ? window.event.clientY : 0 };
    this.colorTarget = { fila, piezaIdx, parteIdx };
  }

  setColor(color: string) {
    if (this.colorTarget) {
      this.odontograma.piezas[this.colorTarget.fila][this.colorTarget.piezaIdx].partes[this.colorTarget.parteIdx].color = color;
    }
    this.showColorMenu = false;
    this.colorTarget = null;
  }

  setSimbolo(simbolo: string, color: string) {
    if (this.colorTarget) {
      this.odontograma.piezas[this.colorTarget.fila][this.colorTarget.piezaIdx].simbolo = simbolo;
      this.odontograma.piezas[this.colorTarget.fila][this.colorTarget.piezaIdx].simboloColor = color;
    }
    this.showColorMenu = false;
    this.colorTarget = null;
  }

  closeColorMenu() {
    this.showColorMenu = false;
    this.colorTarget = null;
  }

  getSimboloColor(simbolo: string, color?: string): string {
    if (color) {
      switch (color) {
        case 'azul':
          return '#1976d2';
        case 'rojo':
          return '#e53935';
        case 'naranja':
          return '#fb8c00';
        case 'gris':
          return '#888';
        case 'negro':
          return '#222';
        default:
          return '#1976d2';
      }
    }
    // fallback por símbolo si no hay color explícito
    switch (simbolo) {
      case 'x':
        return '#1976d2'; // Azul por defecto para x
      case '=':
        return '#1976d2'; // Azul por defecto para =
      case '\u25a1':
        return '#fb8c00'; // Naranja por defecto para □
      case '\u25cb':
        return '#222'; // Negro por defecto para ○
      default:
        return '#e53935'; // Rojo por defecto para otros
    }
  }

  seleccionarColorActivo(color: string) {
    this.colorActivo = color;
  }

  seleccionarSimboloActivo(simbolo: string, color: string) {
    this.simboloActivo = { simbolo, color };
  }

  limpiarColorActivo() {
    this.colorActivo = null;
  }

  limpiarSimboloActivo() {
    this.simboloActivo = null;
  }

  aplicarColorParte(fila: number, piezaIdx: number, parteIdx: number) {
    if (this.colorActivo) {
      this.odontograma.piezas[fila][piezaIdx].partes[parteIdx].color = this.colorActivo;
    }
  }

  aplicarSimboloPieza(fila: number, piezaIdx: number) {
    const pieza = this.odontograma.piezas[fila][piezaIdx];
    if (!this.simboloActivo || !this.simboloActivo.simbolo) {
      pieza.simbolo = '';
      pieza.simboloColor = '';
      return;
    }
    // Si el símbolo activo es igual al actual, limpiar (toggle)
    if (pieza.simbolo === this.simboloActivo.simbolo && pieza.simboloColor === this.simboloActivo.color) {
      pieza.simbolo = '';
      pieza.simboloColor = '';
      return;
    }
    pieza.simbolo = this.simboloActivo.simbolo;
    pieza.simboloColor = this.simboloActivo.color;
  }
} 