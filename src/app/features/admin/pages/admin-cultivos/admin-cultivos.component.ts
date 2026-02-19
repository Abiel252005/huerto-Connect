import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { Cultivo } from '../../models/cultivo.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { HuertosService } from '../../services/huertos.service';

@Component({
  selector: 'app-admin-cultivos',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-cultivos.component.html',
  styleUrls: ['./admin-cultivos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCultivosComponent implements OnInit {
  cultivos: Cultivo[] = [];
  selectedCultivo: Cultivo | null = null;
  readonly rowIdentity = (cultivo: Cultivo): string => cultivo.id;
  readonly columns: ColumnDef<Cultivo>[] = [
    { key: 'nombre', header: 'Cultivo', cell: (row) => row.nombre },
    { key: 'temporada', header: 'Temporada', cell: (row) => row.temporada },
    { key: 'dificultad', header: 'Dificultad', cell: (row) => row.dificultad, align: 'center', width: '90px' },
    { key: 'riego', header: 'Riego', cell: (row) => row.riego, align: 'center', width: '120px' },
    { key: 'fertilizacion', header: 'Fertilizacion', cell: (row) => row.fertilizacion },
    { key: 'estado', header: 'Estado', cell: (row) => (row.activo ? 'Activo' : 'Inactivo'), align: 'center', width: '100px' }
  ];
  readonly actions: ActionDef<Cultivo>[] = [
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarCultivo(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarCultivo(selected)
    }
  ];

  constructor(
    private readonly huertosService: HuertosService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.huertosService.getCultivos().subscribe((cultivos) => {
      this.cultivos = cultivos;
      this.syncSelectedCultivo();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(cultivo: Cultivo | null) {
    this.selectedCultivo = cultivo;
  }

  clearSelection() {
    this.selectedCultivo = null;
  }

  private editarCultivo(selected: Cultivo | null) {
    if (!selected) {
      return;
    }
    console.log('Editar cultivo', selected.id);
  }

  private eliminarCultivo(selected: Cultivo | null) {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm(`Eliminar cultivo ${selected.nombre}?`);
    if (!confirmed) {
      return;
    }
    this.cultivos = this.cultivos.filter((item) => item.id !== selected.id);
    this.selectedCultivo = null;
    this.cdr.markForCheck();
  }

  private syncSelectedCultivo() {
    if (!this.selectedCultivo) {
      return;
    }
    this.selectedCultivo = this.cultivos.find((item) => item.id === this.selectedCultivo?.id) ?? null;
  }
}
