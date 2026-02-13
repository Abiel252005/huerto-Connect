import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Plantio } from '../models/plantio.model';
import { RegionesService } from './regiones.service';

@Injectable({ providedIn: 'root' })
export class PlantiosService {
  constructor(private readonly regionesService: RegionesService) {}

  getPlantios(): Observable<Plantio[]> {
    return this.regionesService.getPlantiosVeracruz().pipe(delay(100));
  }
}
