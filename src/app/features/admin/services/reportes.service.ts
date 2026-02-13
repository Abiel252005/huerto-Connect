import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  INTEGRACIONES_MOCK,
  IntegracionItem,
  REPORTES_MOCK,
  ReporteItem
} from '../mock/reportes.mock';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  getReportes(): Observable<ReporteItem[]> {
    return of(REPORTES_MOCK).pipe(delay(150));
  }

  getIntegraciones(): Observable<IntegracionItem[]> {
    return of(INTEGRACIONES_MOCK).pipe(delay(150));
  }
}
