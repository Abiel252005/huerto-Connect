import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PLAGAS_MOCK } from '../mock/plagas.mock';
import { PlagaDeteccion } from '../models/plaga-deteccion.model';

@Injectable({ providedIn: 'root' })
export class PlagasService {
  getDetecciones(): Observable<PlagaDeteccion[]> {
    return of(PLAGAS_MOCK).pipe(delay(200));
  }

  marcarDeteccion(id: string, estado: PlagaDeteccion['estado']): Observable<boolean> {
    return of(Boolean(id && estado)).pipe(delay(200));
  }
}
