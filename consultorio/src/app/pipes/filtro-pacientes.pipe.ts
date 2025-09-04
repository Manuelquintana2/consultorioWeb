import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroPacientes',
  standalone: true
})
export class FiltroPacientesPipe implements PipeTransform {
  transform(pacientes: any[], filtro: string): any[] {
    if (!pacientes || !filtro || filtro.trim() === '') {
      return pacientes;
    }

    const termino = filtro.toLowerCase().trim();
    
    return pacientes.filter(paciente => {
      return (
        paciente.nombre?.toLowerCase().includes(termino) ||
        paciente.obrasocial?.toLowerCase().includes(termino) ||
        paciente.domicilio?.toLowerCase().includes(termino) ||
        paciente.telefono?.includes(termino) ||
        paciente.localidad?.toLowerCase().includes(termino) ||
        paciente.seccion?.toLowerCase().includes(termino)
      );
    });
  }
} 