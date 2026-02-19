import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PLANTIOS_VERACRUZ_MOCK } from '../mock/plantios-veracruz.mock';
import { REGIONES_MOCK } from '../mock/regiones.mock';
import { Plantio } from '../models/plantio.model';
import { Region } from '../models/region.model';

@Injectable({ providedIn: 'root' })
export class RegionesService {
  getRegiones(): Observable<Region[]> {
    return of(REGIONES_MOCK).pipe(delay(140));
  }

  getPlantiosVeracruz(): Observable<Plantio[]> {
    return of(PLANTIOS_VERACRUZ_MOCK).pipe(delay(220));
  }
}
