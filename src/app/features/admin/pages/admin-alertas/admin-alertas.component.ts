import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alerta } from '../../models/alerta.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { AlertasService } from '../../services/alertas.service';

@Component({
  selector: 'app-admin-alertas',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-alertas.component.html',
  styleUrls: ['./admin-alertas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAlertasComponent implements OnInit {
  alertas: Alerta[] = [];
  selectedAlerta: Alerta | null = null;
  readonly rowIdentity = (alerta: Alerta): string => alerta.id;
  readonly columns: ColumnDef<Alerta>[] = [
    { key: 'titulo', header: 'Alerta', cell: (row) => row.titulo },
    { key: 'tipo', header: 'Tipo', cell: (row) => row.tipo, align: 'center', width: '120px' },
    { key: 'region', header: 'Region', cell: (row) => row.region, width: '150px' },
    { key: 'severidad', header: 'Severidad', cell: (row) => row.severidad, align: 'center', width: '120px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '120px' },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '130px' }
  ];
  readonly actions: ActionDef<Alerta>[] = [
    {
      id: 'resolver',
      label: 'Resolver',
      icon: 'checkmark-done-outline',
      variant: 'primary',
      handler: (selected) => this.resolverAlerta(selected)
    },
    {
      id: 'detalle',
      label: 'Ver detalle',
      icon: 'eye-outline',
      variant: 'ghost',
      handler: (selected) => this.verDetalle(selected)
    }
  ];

  constructor(
    private readonly alertasService: AlertasService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.alertasService.getAlertas().subscribe((alertas) => {
      this.alertas = alertas;
      this.syncSelectedAlerta();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(alerta: Alerta | null) {
    this.selectedAlerta = alerta;
  }

  clearSelection() {
    this.selectedAlerta = null;
  }

  private resolverAlerta(selected: Alerta | null) {
    if (!selected) {
      return;
    }
    this.alertasService.actualizarEstado(selected.id, 'Resuelta').subscribe(() => {
      this.alertas = this.alertas.map((item) =>
        item.id === selected.id ? { ...item, estado: 'Resuelta', severidad: 'Seguro' } : item
      );
      this.syncSelectedAlerta();
      this.cdr.markForCheck();
    });
  }

  private verDetalle(selected: Alerta | null) {
    if (!selected) {
      return;
    }
    console.log('Detalle alerta', selected.id);
  }

  private syncSelectedAlerta() {
    if (!this.selectedAlerta) {
      return;
    }
    this.selectedAlerta = this.alertas.find((item) => item.id === this.selectedAlerta?.id) ?? null;
  }
}
