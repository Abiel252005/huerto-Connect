import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CULTIVOS_MOCK } from '../mock/cultivos.mock';
import { HUERTOS_MOCK } from '../mock/huertos.mock';
import { Cultivo } from '../models/cultivo.model';
import { Huerto } from '../models/huerto.model';

@Injectable({ providedIn: 'root' })
export class HuertosService {
  getHuertos(): Observable<Huerto[]> {
    return of(HUERTOS_MOCK).pipe(delay(180));
  }

  getCultivos(): Observable<Cultivo[]> {
    return of(CULTIVOS_MOCK).pipe(delay(180));
  }
}
