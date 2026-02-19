import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ALERTAS_MOCK } from '../mock/alertas.mock';
import { Alerta } from '../models/alerta.model';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  getAlertas(): Observable<Alerta[]> {
    return of(ALERTAS_MOCK).pipe(delay(150));
  }

  actualizarEstado(id: string, estado: Alerta['estado']): Observable<boolean> {
    return of(Boolean(id && estado)).pipe(delay(180));
  }
}
