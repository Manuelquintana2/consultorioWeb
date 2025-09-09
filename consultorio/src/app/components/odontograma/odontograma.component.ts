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
  mostrarModalAtencion = false;
  nuevaAtencion: any = { fecha: '', observaciones: '', presupuesto: null, honorarios: null };


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

  abrirModalAtencion() {
    this.nuevaAtencion = {
      fecha: new Date().toISOString().split('T')[0], // fecha por defecto hoy
      observaciones: '',
      presupuesto: null,
      honorarios: null,
      numero: (this.odontograma.atenciones?.length || 0) + 1
    };
    this.mostrarModalAtencion = true;
  }
  cerrarModalAtencion() {
    this.mostrarModalAtencion = false;
  }

  agregarAtencion() {
    if (!this.odontograma.atenciones) {
      this.odontograma.atenciones = [];
    }
    this.odontograma.atenciones.push({ ...this.nuevaAtencion });
    this.cerrarModalAtencion();
  }

  cargarOdontograma(): void {
    if (!this.paciente) return;
    this.loading = true;
    this.odontogramasService.getOdontogramaPorPaciente(this.paciente.uid).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response); // DEBUG
        if (response.success && response.data.length > 0) {
          this.odontograma = response.data[0];
          console.log('Odontograma cargado:', this.odontograma); // DEBUG
          // Detectar tipo según cantidad de dientes
          const piezas = this.odontograma.piezas;
          console.log('Piezas del odontograma:', piezas); // DEBUG
          
          // Usar el tipo del odontograma si está disponible
          let tipoDetectado = this.odontograma.tipo || 'adulto';
          
          if (piezas && Array.isArray(piezas)) {
            if (piezas.length === 32) {
              tipoDetectado = 'adulto';
            } else if (piezas.length === 20) {
              tipoDetectado = 'nino';
            } else if (piezas.length > 0) {
              // Si hay pocas piezas, detectar por números de pieza
              const numerosPiezas = piezas.map(p => p.numero_pieza);
              const tienePiezasNino = numerosPiezas.some(num => num >= 51 && num <= 85);
              tipoDetectado = tienePiezasNino ? 'nino' : 'adulto';
              console.log('Detectando tipo por números de pieza:', { numerosPiezas, tienePiezasNino, tipoDetectado }); // DEBUG
            }
            
            this.tipo = tipoDetectado;
            this.odontograma.piezas = this.fusionarConEstructuraBase(piezas, this.tipo);
          } else {
            // Si no hay piezas, usar estructura base
            console.log('Usando estructura base - sin piezas'); // DEBUG
            this.setOdontogramaBase();
          }
        } else {
          // Si no hay odontograma, usar estructura base
          console.log('Usando estructura base - sin odontograma'); // DEBUG
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
    
    // Usar el tipo del odontograma si está disponible, sino detectar por cantidad
    let tipoDetectado = this.odontogramaInput.tipo || 'adulto';
    
    if (piezas && Array.isArray(piezas)) {
      if (piezas.length === 32) {
        tipoDetectado = 'adulto';
      } else if (piezas.length === 20) {
        tipoDetectado = 'nino';
      } else if (piezas.length > 0) {
        // Si hay pocas piezas, detectar por números de pieza
        const numerosPiezas = piezas.map(p => p.numero_pieza);
        const tienePiezasNino = numerosPiezas.some(num => num >= 51 && num <= 85);
        tipoDetectado = tienePiezasNino ? 'nino' : 'adulto';
        console.log('Detectando tipo por números de pieza:', { numerosPiezas, tienePiezasNino, tipoDetectado }); // DEBUG
      }
    }
    
    this.tipo = tipoDetectado;
    console.log('Tipo detectado:', this.tipo); // DEBUG
    
    if (piezas && Array.isArray(piezas) && piezas.length > 0) {
      this.odontograma = {
        ...this.odontogramaInput,
        piezas: this.fusionarConEstructuraBase(piezas, this.tipo)
      };
      console.log('Odontograma normalizado:', this.odontograma); // DEBUG
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
    
    // Filtrar solo piezas que tienen modificaciones
    const piezasModificadas = this.filtrarPiezasModificadas(piezasPlanas);
    
    const payload = {
      paciente_uid: this.paciente.uid,
      observaciones: this.odontograma.observaciones,
      piezas: piezasModificadas,
      tipo: this.tipo,
      atenciones: this.odontograma.atenciones || []   // 👈 importante
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
    // Limpiar símbolo activo cuando se selecciona un color
    this.simboloActivo = null;
  }

  seleccionarSimboloActivo(simbolo: string, color: string) {
    this.simboloActivo = { simbolo, color };
    // Limpiar color activo cuando se selecciona un símbolo
    this.colorActivo = null;
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

  // Nuevo método para manejar clic en el centro del diente
  aplicarColorOSimbolo(fila: number, piezaIdx: number, parteIdx: number) {
    if (this.colorActivo) {
      // Si hay un color activo, aplicar el color a la parte específica
      this.odontograma.piezas[fila][piezaIdx].partes[parteIdx].color = this.colorActivo;
    } else if (this.simboloActivo && this.simboloActivo.simbolo) {
      // Si hay un símbolo activo, aplicar el símbolo a toda la pieza
      const pieza = this.odontograma.piezas[fila][piezaIdx];
      if (pieza.simbolo === this.simboloActivo.simbolo && pieza.simboloColor === this.simboloActivo.color) {
        // Toggle: si el símbolo es igual, lo removemos
        pieza.simbolo = '';
        pieza.simboloColor = '';
      } else {
        // Aplicar el nuevo símbolo
        pieza.simbolo = this.simboloActivo.simbolo;
        pieza.simboloColor = this.simboloActivo.color;
      }
    }
  }

  // Método para fusionar datos modificados con estructura base
  private fusionarConEstructuraBase(piezasModificadas: any[], tipo: 'adulto' | 'nino'): any[][] {
    console.log('Fusionando con estructura base:', { piezasModificadas, tipo }); // DEBUG
    
    // Obtener estructura base según el tipo
    const estructuraBase = tipo === 'nino' ? 
      JSON.parse(JSON.stringify(this.piezasBaseNino)) : 
      JSON.parse(JSON.stringify(this.piezasBaseAdulto));
    
    // Si no hay piezas modificadas, devolver estructura base
    if (!piezasModificadas || piezasModificadas.length === 0) {
      console.log('No hay piezas modificadas, devolviendo estructura base'); // DEBUG
      return estructuraBase;
    }
    
    // Crear mapa de piezas modificadas por número de pieza
    const piezasModificadasMap = new Map();
    piezasModificadas.forEach(pieza => {
      piezasModificadasMap.set(pieza.numero_pieza, pieza);
    });
    
    console.log('Mapa de piezas modificadas:', piezasModificadasMap); // DEBUG
    
    // Fusionar datos modificados con estructura base
    const resultado = estructuraBase.map((fila: any[]) => 
      fila.map(piezaBase => {
        const piezaModificada = piezasModificadasMap.get(piezaBase.numero_pieza);
        
        if (piezaModificada) {
          console.log(`Fusionando pieza ${piezaBase.numero_pieza}:`, piezaModificada); // DEBUG
          // Fusionar símbolos
          const piezaFusionada = {
            ...piezaBase,
            simbolo: piezaModificada.simbolo || '',
            simboloColor: piezaModificada.simboloColor || ''
          };
          
          // Fusionar partes
          if (piezaModificada.partes && piezaModificada.partes.length > 0) {
            piezaFusionada.partes = piezaBase.partes.map((parteBase: any) => {
              const parteModificada = piezaModificada.partes.find((p: any) => 
                p.nombre_parte === parteBase.nombre_parte
              );
              
              return parteModificada ? {
                ...parteBase,
                ...parteModificada
              } : parteBase;
            });
          }
          
          return piezaFusionada;
        }
        
        return piezaBase;
      })
    );
    
    console.log('Resultado de fusión:', resultado); // DEBUG
    return resultado;
  }

  // Método para filtrar solo piezas que tienen modificaciones
  private filtrarPiezasModificadas(piezas: any[]): any[] {
    return piezas.filter(pieza => {
      // Verificar si la pieza tiene símbolo
      const tieneSimbolo = pieza.simbolo && pieza.simbolo.trim() !== '';
      
      // Verificar si alguna parte tiene color
      const tieneColor = pieza.partes && pieza.partes.some((parte: any) => 
        parte.color && parte.color.trim() !== ''
      );
      
      // Verificar si alguna parte tiene estado, tratamiento u observaciones
      const tieneDatosAdicionales = pieza.partes && pieza.partes.some((parte: any) => 
        (parte.estado && parte.estado.trim() !== '') ||
        (parte.tratamiento && parte.tratamiento.trim() !== '') ||
        (parte.observaciones && parte.observaciones.trim() !== '')
      );
      
      return tieneSimbolo || tieneColor || tieneDatosAdicionales;
    }).map(pieza => {
      // Solo incluir partes que tienen datos
      const partesModificadas = pieza.partes.filter((parte: any) => 
        (parte.color && parte.color.trim() !== '') ||
        (parte.estado && parte.estado.trim() !== '') ||
        (parte.tratamiento && parte.tratamiento.trim() !== '') ||
        (parte.observaciones && parte.observaciones.trim() !== '')
      );
      
      return {
        numero_pieza: pieza.numero_pieza,
        simbolo: pieza.simbolo || '',
        simboloColor: pieza.simboloColor || '',
        partes: partesModificadas
      };
    });
  }
} 