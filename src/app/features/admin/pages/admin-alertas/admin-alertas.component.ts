import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alerta } from '../../models/alerta.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { AlertasService } from '../../services/alertas.service';

@Component({
  selector: 'app-admin-alertas',
  standalone: true,
  imports: [
    CommonModule,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent,
    StatusBadgeComponent
  ],
  templateUrl: './admin-alertas.component.html',
  styleUrls: ['./admin-alertas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAlertasComponent implements OnInit {
  private readonly toast = inject(ToastService);

  alertas: Alerta[] = [];
  selectedAlerta: Alerta | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmVariant: 'danger' | 'warning' | 'info' = 'info';
  confirmIcon = 'checkmark-done-outline';
  confirmLabel = 'Confirmar';
  private pendingAction: (() => void) | null = null;

  // ── Edit modal state ──
  editVisible = false;
  editData: Record<string, unknown> | null = null;
  readonly editFields: EditField[] = [
    { key: 'titulo', label: 'Título', type: 'text', required: true },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Plaga', 'Riego', 'Sensor', 'Sistema'] },
    { key: 'severidad', label: 'Severidad', type: 'select', options: ['Seguro', 'Advertencia', 'Critico'] },
    { key: 'estado', label: 'Estado', type: 'select', options: ['Abierta', 'En progreso', 'Resuelta'] },
    { key: 'region', label: 'Región', type: 'text' },
    { key: 'responsable', label: 'Responsable', type: 'text' }
  ];

  readonly rowIdentity = (alerta: Alerta): string => alerta.id;

  readonly columns: ColumnDef<Alerta>[] = [
    { key: 'titulo', header: 'Alerta', cell: (row) => row.titulo },
    { key: 'tipo', header: 'Tipo', cell: (row) => row.tipo, align: 'center', width: '120px' },
    { key: 'region', header: 'Region', cell: (row) => row.region, width: '150px' },
    { key: 'severidad', header: 'Severidad', cell: (row) => row.severidad, align: 'center', width: '120px', isCustom: true },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '120px', isCustom: true },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '130px' }
  ];

  readonly actions: ActionDef<Alerta>[] = [
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarAlerta(selected)
    },
    {
      id: 'resolver',
      label: 'Resolver',
      icon: 'checkmark-done-outline',
      variant: 'ghost',
      handler: (selected) => this.confirmarResolver(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarAlerta(selected)
    }
  ];

  constructor(
    private readonly alertasService: AlertasService,
    private readonly cdr: ChangeDetectorRef
  ) { }

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

  // ── Edit ──
  private editarAlerta(selected: Alerta | null) {
    if (!selected) { return; }
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as Alerta;
    this.alertas = this.alertas.map((item) =>
      item.id === updated.id ? { ...item, ...updated } : item
    );
    this.editVisible = false;
    this.editData = null;
    this.syncSelectedAlerta();
    this.cdr.markForCheck();
    this.toast.success(`Alerta "${updated.titulo}" actualizada correctamente`);
  }

  onEditCancel() {
    this.editVisible = false;
    this.editData = null;
  }

  // ── Resolve ──
  private confirmarResolver(selected: Alerta | null) {
    if (!selected) { return; }
    this.confirmTitle = 'Resolver alerta';
    this.confirmMessage = `¿Confirmar que la alerta "${selected.titulo}" ha sido resuelta?`;
    this.confirmVariant = 'info';
    this.confirmIcon = 'checkmark-done-outline';
    this.confirmLabel = 'Resolver';
    this.pendingAction = () => this.resolverAlerta(selected);
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  private resolverAlerta(selected: Alerta) {
    this.alertasService.actualizarEstado(selected.id, 'Resuelta').subscribe(() => {
      this.alertas = this.alertas.map((item) =>
        item.id === selected.id ? { ...item, estado: 'Resuelta', severidad: 'Seguro' } : item
      );
      this.syncSelectedAlerta();
      this.cdr.markForCheck();
      this.toast.success(`Alerta "${selected.titulo}" resuelta correctamente`);
    });
  }

  // ── Delete ──
  private eliminarAlerta(selected: Alerta | null) {
    if (!selected) { return; }
    this.confirmTitle = 'Eliminar alerta';
    this.confirmMessage = `¿Está seguro de eliminar la alerta "${selected.titulo}"? Esta acción no se puede deshacer.`;
    this.confirmVariant = 'danger';
    this.confirmIcon = 'trash-outline';
    this.confirmLabel = 'Eliminar';
    this.pendingAction = () => {
      this.alertas = this.alertas.filter((item) => item.id !== selected.id);
      this.selectedAlerta = null;
      this.cdr.markForCheck();
      this.toast.success(`Alerta "${selected.titulo}" eliminada correctamente`);
    };
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  onConfirm() {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.pendingAction = null;
    this.confirmVisible = false;
    this.cdr.markForCheck();
  }

  onCancelConfirm() {
    this.pendingAction = null;
    this.confirmVisible = false;
  }

  private syncSelectedAlerta() {
    if (!this.selectedAlerta) { return; }
    this.selectedAlerta = this.alertas.find((item) => item.id === this.selectedAlerta?.id) ?? null;
  }
}
