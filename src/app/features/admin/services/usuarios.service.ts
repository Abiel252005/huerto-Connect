import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { USUARIOS_MOCK } from '../mock/usuarios.mock';
import { Usuario } from '../models/usuario.model';

export interface UsuarioFiltro {
  busqueda?: string;
  region?: string;
  estado?: Usuario['estado'] | '';
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  getUsuarios(filtro: UsuarioFiltro = {}): Observable<Usuario[]> {
    return of(USUARIOS_MOCK).pipe(
      delay(160),
      map((usuarios) =>
        usuarios.filter((usuario) => {
          const matchBusqueda =
            !filtro.busqueda ||
            `${usuario.nombre} ${usuario.correo}`.toLowerCase().includes(filtro.busqueda.toLowerCase());
          const matchRegion = !filtro.region || usuario.region === filtro.region;
          const matchEstado = !filtro.estado || usuario.estado === filtro.estado;
          return matchBusqueda && matchRegion && matchEstado;
        })
      )
    );
  }

  actualizarEstado(id: string, estado: Usuario['estado']): Observable<boolean> {
    return of(Boolean(id && estado)).pipe(delay(240));
  }
}
