import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { PlagaDeteccion } from '../../models/plaga-deteccion.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { PlagasService } from '../../services/plagas.service';

@Component({
  selector: 'app-admin-plagas',
  standalone: true,
  imports: [
    CommonModule,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent
  ],
  templateUrl: './admin-plagas.component.html',
  styleUrls: ['./admin-plagas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminPlagasComponent implements OnInit {
  private readonly toast = inject(ToastService);

  detecciones: PlagaDeteccion[] = [];
  selectedDeteccion: PlagaDeteccion | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: (() => void) | null = null;
  confirmVariant: 'danger' | 'warning' | 'info' = 'danger';
  confirmIcon = 'alert-circle-outline';
  confirmLabel = 'Confirmar';

  // ── Edit modal state ──
  editVisible = false;
  editData: Record<string, unknown> | null = null;

  // ── Drawer state ──
  drawerVisible = false;
  drawerItem: PlagaDeteccion | null = null;
  readonly editFields: EditField[] = [
    { key: 'plaga', label: 'Plaga', type: 'text', required: true },
    { key: 'confianza', label: 'Confianza (%)', type: 'number' },
    { key: 'cultivo', label: 'Cultivo', type: 'text' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text' },
    { key: 'severidad', label: 'Severidad', type: 'select', options: ['Baja', 'Media', 'Alta'] },
    { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Confirmada', 'Descartada'] }
  ];

  readonly rowIdentity = (deteccion: PlagaDeteccion): string => deteccion.id;

  readonly columns: ColumnDef<PlagaDeteccion>[] = [
    { key: 'plaga', header: 'Plaga', cell: (row) => row.plaga },
    { key: 'confianza', header: 'Confianza', cell: (row) => `${row.confianza}%`, align: 'center', width: '100px' },
    { key: 'cultivo', header: 'Cultivo', cell: (row) => row.cultivo, align: 'center', width: '120px' },
    { key: 'ubicacion', header: 'Ubicacion', cell: (row) => row.ubicacion, width: '130px' },
    { key: 'severidad', header: 'Severidad', cell: (row) => row.severidad, align: 'center', width: '110px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '120px' },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '140px' }
  ];

  readonly actions: ActionDef<PlagaDeteccion>[] = [
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarDeteccion(selected)
    },
    {
      id: 'correcta',
      label: 'Marcar correcta',
      icon: 'checkmark-outline',
      variant: 'ghost',
      handler: (selected) => this.confirmarMarcar(selected, 'Confirmada')
    },
    {
      id: 'incorrecta',
      label: 'Marcar incorrecta',
      icon: 'close-outline',
      variant: 'danger',
      handler: (selected) => this.confirmarMarcar(selected, 'Descartada')
    }
  ];

  constructor(
    private readonly plagasService: PlagasService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.plagasService.getDetecciones().subscribe((detecciones) => {
      this.detecciones = detecciones;
      this.syncSelectedDeteccion();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(deteccion: PlagaDeteccion | null) {
    this.selectedDeteccion = deteccion;
  }

  clearSelection() {
    this.selectedDeteccion = null;
  }

  // ── Edit ──
  editarDeteccion(selected: PlagaDeteccion | null) {
    if (!selected) { return; }
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as PlagaDeteccion;
    this.detecciones = this.detecciones.map((item) =>
      item.id === updated.id ? { ...item, ...updated } : item
    );
    this.editVisible = false;
    this.editData = null;
    this.syncSelectedDeteccion();
    this.cdr.markForCheck();
    this.toast.success(`Detección "${updated.plaga}" actualizada correctamente`);
  }

  onEditCancel() {
    this.editVisible = false;
    this.editData = null;
  }

  // ── Marcar con confirm ──
  confirmarMarcar(selected: PlagaDeteccion | null, estado: PlagaDeteccion['estado']) {
    if (!selected) { return; }
    const isDescartar = estado === 'Descartada';
    this.confirmTitle = isDescartar ? 'Descartar detección' : 'Confirmar detección';
    this.confirmMessage = isDescartar
      ? `¿Está seguro de marcar la detección "${selected.plaga}" como incorrecta?`
      : `¿Confirmar que la detección "${selected.plaga}" es correcta?`;
    this.confirmVariant = isDescartar ? 'danger' : 'info';
    this.confirmIcon = isDescartar ? 'close-circle-outline' : 'checkmark-circle-outline';
    this.confirmLabel = isDescartar ? 'Descartar' : 'Confirmar';
    this.pendingAction = () => this.marcar(selected, estado);
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

  private marcar(deteccion: PlagaDeteccion, estado: PlagaDeteccion['estado']) {
    this.plagasService.marcarDeteccion(deteccion.id, estado).subscribe(() => {
      this.detecciones = this.detecciones.map((item) =>
        item.id === deteccion.id ? { ...item, estado } : item
      );
      this.syncSelectedDeteccion();
      this.cdr.markForCheck();
      const label = estado === 'Confirmada' ? 'confirmada' : 'descartada';
      this.toast.success(`Detección "${deteccion.plaga}" marcada como ${label}`);
    });
  }

  abrirDrawer(selected: PlagaDeteccion | null) {
    if (!selected) { return; }
    this.drawerItem = selected;
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  cerrarDrawer() {
    this.drawerVisible = false;
    this.cdr.markForCheck();
  }

  private syncSelectedDeteccion() {
    if (!this.selectedDeteccion) { return; }
    this.selectedDeteccion =
      this.detecciones.find((item) => item.id === this.selectedDeteccion?.id) ?? null;
  }
}
