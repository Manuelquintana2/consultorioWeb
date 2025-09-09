import { Pipe, PipeTransform } from '@angular/core';
import { FichaKinesica, Paciente } from '../models';

@Pipe({
  name: 'filtroFichasKinesio'
})
export class FiltroFichasKinesioPipe implements PipeTransform {
 transform(
    fichas: FichaKinesica[],
    searchText: string,
    pacientes: Paciente[]
  ): FichaKinesica[] {
    if (!fichas || !searchText || !pacientes) {
      return fichas;
    }

    searchText = searchText.toLowerCase();

    return fichas.filter(ficha => {
      const paciente = pacientes.find(p => p.uid === ficha.paciente_uid);
      return paciente ? paciente.nombre.toLowerCase().includes(searchText) : false;
    });
  }
}
