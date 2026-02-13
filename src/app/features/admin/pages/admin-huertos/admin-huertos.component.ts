import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { HuertosService } from '../../services/huertos.service';
import { Huerto } from '../../models/huerto.model';

@Component({
  selector: 'app-admin-huertos',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-huertos.component.html',
  styleUrls: ['./admin-huertos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminHuertosComponent implements OnInit {
  huertos: Huerto[] = [];
  selectedHuerto: Huerto | null = null;
  readonly rowIdentity = (huerto: Huerto): string => huerto.id;
  readonly columns: ColumnDef<Huerto>[] = [
    { key: 'nombre', header: 'Huerto', cell: (row) => row.nombre },
    { key: 'usuario', header: 'Usuario', cell: (row) => row.usuario },
    { key: 'municipio', header: 'Municipio', cell: (row) => row.municipio, width: '120px' },
    { key: 'cultivosActivos', header: 'Cultivos', cell: (row) => row.cultivosActivos, align: 'center', width: '90px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '110px' },
    { key: 'salud', header: 'Salud', cell: (row) => `${row.salud}%`, align: 'center', width: '90px' },
    { key: 'alertas', header: 'Alertas', cell: (row) => row.alertas, align: 'center', width: '90px' }
  ];
  readonly actions: ActionDef<Huerto>[] = [
    {
      id: 'detalle',
      label: 'Ver detalle',
      icon: 'eye-outline',
      variant: 'primary',
      handler: (selected) => this.verDetalle(selected)
    },
    {
      id: 'revision',
      label: 'Marcar revision',
      icon: 'flag-outline',
      variant: 'ghost',
      handler: (selected) => this.marcarRevision(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarHuerto(selected)
    }
  ];

  constructor(
    private readonly huertosService: HuertosService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.huertosService.getHuertos().subscribe((huertos) => {
      this.huertos = huertos;
      this.syncSelectedHuerto();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(huerto: Huerto | null) {
    this.selectedHuerto = huerto;
  }

  clearSelection() {
    this.selectedHuerto = null;
  }

  private verDetalle(selected: Huerto | null) {
    if (!selected) {
      return;
    }
    console.log('Ver detalle huerto', selected.id);
  }

  private marcarRevision(selected: Huerto | null) {
    if (!selected) {
      return;
    }
    this.huertos = this.huertos.map((item) =>
      item.id === selected.id ? { ...item, estado: 'Atencion' } : item
    );
    this.syncSelectedHuerto();
    this.cdr.markForCheck();
  }

  private eliminarHuerto(selected: Huerto | null) {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm(`Eliminar huerto ${selected.nombre}?`);
    if (!confirmed) {
      return;
    }
    this.huertos = this.huertos.filter((item) => item.id !== selected.id);
    this.selectedHuerto = null;
    this.cdr.markForCheck();
  }

  private syncSelectedHuerto() {
    if (!this.selectedHuerto) {
      return;
    }
    this.selectedHuerto = this.huertos.find((item) => item.id === this.selectedHuerto?.id) ?? null;
  }
}
