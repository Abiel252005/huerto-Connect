import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { Cultivo } from '../../models/cultivo.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { HuertosService } from '../../services/huertos.service';

@Component({
  selector: 'app-admin-cultivos',
  standalone: true,
  imports: [
    CommonModule,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent
  ],
  templateUrl: './admin-cultivos.component.html',
  styleUrls: ['./admin-cultivos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCultivosComponent implements OnInit {
  private readonly toast = inject(ToastService);

  cultivos: Cultivo[] = [];
  selectedCultivo: Cultivo | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingDeleteId: string | null = null;

  // ── Edit modal state ──
  editVisible = false;
  editData: Record<string, unknown> | null = null;
  readonly editFields: EditField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    { key: 'temporada', label: 'Temporada', type: 'text' },
    { key: 'dificultad', label: 'Dificultad', type: 'select', options: ['Baja', 'Media', 'Alta'] },
    { key: 'riego', label: 'Riego', type: 'text' },
    { key: 'fertilizacion', label: 'Fertilización', type: 'text' },
    { key: 'activo', label: 'Activo', type: 'checkbox' }
  ];

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
  ) { }

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

  // ── Edit ──
  private editarCultivo(selected: Cultivo | null) {
    if (!selected) { return; }
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as Cultivo;
    this.cultivos = this.cultivos.map((item) =>
      item.id === updated.id ? { ...item, ...updated } : item
    );
    this.editVisible = false;
    this.editData = null;
    this.syncSelectedCultivo();
    this.cdr.markForCheck();
    this.toast.success(`Cultivo "${updated.nombre}" actualizado correctamente`);
  }

  onEditCancel() {
    this.editVisible = false;
    this.editData = null;
  }

  // ── Delete ──
  private eliminarCultivo(selected: Cultivo | null) {
    if (!selected) { return; }
    this.pendingDeleteId = selected.id;
    this.confirmTitle = 'Eliminar cultivo';
    this.confirmMessage = `¿Está seguro de eliminar el cultivo "${selected.nombre}"? Esta acción no se puede deshacer.`;
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  onConfirmDelete() {
    if (!this.pendingDeleteId) { return; }
    const nombre = this.cultivos.find((c) => c.id === this.pendingDeleteId)?.nombre ?? '';
    this.cultivos = this.cultivos.filter((item) => item.id !== this.pendingDeleteId);
    this.selectedCultivo = null;
    this.pendingDeleteId = null;
    this.confirmVisible = false;
    this.cdr.markForCheck();
    this.toast.success(`Cultivo "${nombre}" eliminado correctamente`);
  }

  onCancelDelete() {
    this.pendingDeleteId = null;
    this.confirmVisible = false;
  }

  private syncSelectedCultivo() {
    if (!this.selectedCultivo) { return; }
    this.selectedCultivo = this.cultivos.find((item) => item.id === this.selectedCultivo?.id) ?? null;
  }
}
