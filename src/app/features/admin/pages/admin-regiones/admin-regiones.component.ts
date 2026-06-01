import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapVeracruzComponent } from '../../components/map-veracruz/map-veracruz.component';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { Region } from '../../models/region.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { RegionesService } from '../../services/regiones.service';

@Component({
  selector: 'app-admin-regiones',
  standalone: true,
  imports: [
    CommonModule,
    MapVeracruzComponent,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent
  ],
  templateUrl: './admin-regiones.component.html',
  styleUrls: ['./admin-regiones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRegionesComponent implements OnInit {
  private readonly toast = inject(ToastService);

  regiones: Region[] = [];
  selectedRegion: Region | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmVariant: 'danger' | 'warning' | 'info' = 'info';
  confirmIcon = 'flash-outline';
  confirmLabel = 'Confirmar';
  private pendingAction: (() => void) | null = null;

  // ── Edit modal state ──
  editVisible = false;
  editData: Record<string, unknown> | null = null;
  readonly editFields: EditField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'usuarios', label: 'Usuarios', type: 'number' },
    { key: 'huertos', label: 'Huertos', type: 'number' },
    { key: 'detecciones', label: 'Detecciones', type: 'number' },
    { key: 'actividad', label: 'Actividad', type: 'select', options: ['Alta', 'Media', 'Baja'] }
  ];

  readonly rowIdentity = (region: Region): string => region.id;

  readonly columns: ColumnDef<Region>[] = [
    { key: 'nombre', header: 'Region', cell: (row) => row.nombre },
    { key: 'usuarios', header: 'Usuarios', cell: (row) => row.usuarios, align: 'center', width: '120px' },
    { key: 'huertos', header: 'Huertos', cell: (row) => row.huertos, align: 'center', width: '120px' },
    { key: 'detecciones', header: 'Detecciones', cell: (row) => row.detecciones, align: 'center', width: '120px' },
    { key: 'actividad', header: 'Actividad', cell: (row) => row.actividad, align: 'center', width: '110px' }
  ];

  readonly actions: ActionDef<Region>[] = [
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarRegion(selected)
    },
    {
      id: 'priorizar',
      label: 'Priorizar region',
      icon: 'flash-outline',
      variant: 'ghost',
      handler: (selected) => this.confirmarPriorizar(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarRegion(selected)
    }
  ];

  constructor(
    private readonly regionesService: RegionesService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.regionesService.getRegiones().subscribe((regiones) => {
      this.regiones = regiones;
      this.syncSelectedRegion();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(region: Region | null) {
    this.selectedRegion = region;
  }

  clearSelection() {
    this.selectedRegion = null;
  }

  // ── Edit ──
  private editarRegion(selected: Region | null) {
    if (!selected) { return; }
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as Region;
    this.regiones = this.regiones.map((item) =>
      item.id === updated.id ? { ...item, ...updated } : item
    );
    this.editVisible = false;
    this.editData = null;
    this.syncSelectedRegion();
    this.cdr.markForCheck();
    this.toast.success(`Región "${updated.nombre}" actualizada correctamente`);
  }

  onEditCancel() {
    this.editVisible = false;
    this.editData = null;
  }

  // ── Priorizar ──
  private confirmarPriorizar(selected: Region | null) {
    if (!selected) { return; }
    this.confirmTitle = 'Priorizar región';
    this.confirmMessage = `¿Desea priorizar la región "${selected.nombre}"? Esto establecerá su actividad como Alta.`;
    this.confirmVariant = 'warning';
    this.confirmIcon = 'flash-outline';
    this.confirmLabel = 'Priorizar';
    this.pendingAction = () => {
      this.regiones = this.regiones.map((item) =>
        item.id === selected.id ? { ...item, actividad: 'Alta' } : item
      );
      this.syncSelectedRegion();
      this.cdr.markForCheck();
      this.toast.success(`Región "${selected.nombre}" priorizada correctamente`);
    };
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  // ── Delete ──
  private eliminarRegion(selected: Region | null) {
    if (!selected) { return; }
    this.confirmTitle = 'Eliminar región';
    this.confirmMessage = `¿Está seguro de eliminar la región "${selected.nombre}"? Esta acción no se puede deshacer.`;
    this.confirmVariant = 'danger';
    this.confirmIcon = 'trash-outline';
    this.confirmLabel = 'Eliminar';
    this.pendingAction = () => {
      this.regiones = this.regiones.filter((item) => item.id !== selected.id);
      this.selectedRegion = null;
      this.cdr.markForCheck();
      this.toast.success(`Región "${selected.nombre}" eliminada correctamente`);
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

  private syncSelectedRegion() {
    if (!this.selectedRegion) { return; }
    this.selectedRegion = this.regiones.find((item) => item.id === this.selectedRegion?.id) ?? null;
  }
}
