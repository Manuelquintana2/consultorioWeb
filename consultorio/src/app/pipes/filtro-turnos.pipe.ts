import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroTurnos',
  standalone: true
})
export class FiltroTurnosPipe implements PipeTransform {
  transform(turnos: any[], filtro: string, pacientes: any[] = []): any[] {
    if (!turnos || !filtro || filtro.trim() === '') {
      return turnos;
    }

    const termino = filtro.toLowerCase().trim();
    
    return turnos.filter(turno => {
      // Buscar por hora
      if (turno.hora?.toLowerCase().includes(termino)) return true;
      
      // Buscar por especialista
      const especialista = turno.especialista_uid === 'esp_kinesiologa' ? 'kinesióloga' : 'odontólogo';
      if (especialista.includes(termino)) return true;
      
      // Buscar por estado
      if (turno.estado?.toLowerCase().includes(termino)) return true;
      
      // Buscar por comentario
      if (turno.comentario?.toLowerCase().includes(termino)) return true;
      
      // Buscar por nombre del paciente
      const paciente = pacientes.find(p => p.uid === turno.paciente_uid);
      if (paciente) {
        if (paciente.nombre?.toLowerCase().includes(termino) ||
            paciente.obrasocial?.toLowerCase().includes(termino)) {
          return true;
        }
      }
      
      return false;
    });
  }
} 