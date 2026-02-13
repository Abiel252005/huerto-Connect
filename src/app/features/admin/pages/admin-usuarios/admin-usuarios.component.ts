import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiltersBarComponent, FilterField } from '../../components/filters-bar/filters-bar.component';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { Usuario } from '../../models/usuario.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FiltersBarComponent, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  selectedUsuario: Usuario | null = null;
  search = '';
  fields: FilterField[] = [
    { id: 'region', label: 'Region', value: '', options: [] },
    { id: 'estado', label: 'Estado', value: '', options: ['Activo', 'Inactivo', 'Suspendido'] }
  ];
  readonly rowIdentity = (usuario: Usuario): string => usuario.id;
  readonly columns: ColumnDef<Usuario>[] = [
    { key: 'nombre', header: 'Nombre', cell: (row) => row.nombre },
    { key: 'correo', header: 'Correo', cell: (row) => row.correo },
    { key: 'region', header: 'Region', cell: (row) => row.region },
    { key: 'rol', header: 'Rol', cell: (row) => row.rol, align: 'center', width: '110px' },
    { key: 'huertos', header: 'Huertos', cell: (row) => row.huertos, align: 'center', width: '90px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '110px' },
    { key: 'ultimaActividad', header: 'Ultima actividad', cell: (row) => row.ultimaActividad, width: '130px' }
  ];
  readonly actions: ActionDef<Usuario>[] = [
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarUsuario(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarUsuario(selected)
    }
  ];

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.reload();
  }

  onSearch(value: string) {
    this.search = value;
    this.reload();
  }

  onFieldsChange(fields: FilterField[]) {
    this.fields = fields;
    this.reload();
  }

  onSelectedChange(usuario: Usuario | null) {
    this.selectedUsuario = usuario;
  }

  clearSelection() {
    this.selectedUsuario = null;
  }

  private reload() {
    const region = this.fields.find((item) => item.id === 'region')?.value ?? '';
    const estado = this.fields.find((item) => item.id === 'estado')?.value as Usuario['estado'] | '';

    this.usuariosService
      .getUsuarios({ busqueda: this.search, region, estado })
      .subscribe((usuarios) => {
        this.usuarios = usuarios;
        this.syncSelectedUsuario();
        const regionField = this.fields.find((item) => item.id === 'region');
        if (regionField && regionField.options.length === 0) {
          regionField.options = [...new Set(usuarios.map((item) => item.region))];
        }
        this.cdr.markForCheck();
      });
  }

  private editarUsuario(selected: Usuario | null) {
    if (!selected) {
      return;
    }
    console.log('Editar usuario', selected.id);
  }

  private eliminarUsuario(selected: Usuario | null) {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm(`Eliminar usuario ${selected.nombre}?`);
    if (!confirmed) {
      return;
    }
    this.usuarios = this.usuarios.filter((item) => item.id !== selected.id);
    this.selectedUsuario = null;
    this.cdr.markForCheck();
  }

  private syncSelectedUsuario() {
    if (!this.selectedUsuario) {
      return;
    }

    const selected = this.usuarios.find((item) => item.id === this.selectedUsuario?.id) ?? null;
    this.selectedUsuario = selected;
  }
}
