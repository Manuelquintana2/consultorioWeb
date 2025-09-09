import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroEstado'
})
export class FiltroEstadoPipe implements PipeTransform {

transform(turnos: any[], filtro: string, pacientes: any[] = []): any[] {
    if (!turnos || !filtro || filtro.trim() === '') {
      return turnos;
    }

    const termino = filtro.toLowerCase().trim();
    
    return turnos.filter(turno => {    
      // Buscar por estado
      if (turno.estado?.toLowerCase().includes(termino)) return true;
      return false;
    });
  }
} 
