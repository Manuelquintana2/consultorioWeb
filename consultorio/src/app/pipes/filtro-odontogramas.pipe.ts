import { Pipe, PipeTransform } from '@angular/core';
import { Odontograma, Paciente } from '../models';

@Pipe({
  name: 'filtroOdontogramas'
})
export class FiltroOdontogramasPipe implements PipeTransform {

   transform(
    odontogramas: Odontograma[],
    searchText: string,
    pacientes: Paciente[]
  ): Odontograma[] {
    if (!odontogramas || !searchText || !pacientes) {
      return odontogramas;
    }

    searchText = searchText.toLowerCase();

    return odontogramas.filter(odo => {
      const paciente = pacientes.find(p => p.uid!.toString() === odo.paciente_uid.toString());
      return paciente ? paciente.nombre.toLowerCase().includes(searchText) : false;
    });
  }
}
