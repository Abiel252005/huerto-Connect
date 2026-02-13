import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AUDITORIA_MOCK } from '../mock/auditoria.mock';
import { AuditoriaLog } from '../models/auditoria-log.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  getLogs(): Observable<AuditoriaLog[]> {
    return of(AUDITORIA_MOCK).pipe(delay(120));
  }
}
