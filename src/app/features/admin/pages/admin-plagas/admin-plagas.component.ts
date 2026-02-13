import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { PlagaDeteccion } from '../../models/plaga-deteccion.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { PlagasService } from '../../services/plagas.service';

@Component({
  selector: 'app-admin-plagas',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-plagas.component.html',
  styleUrls: ['./admin-plagas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPlagasComponent implements OnInit {
  detecciones: PlagaDeteccion[] = [];
  selectedDeteccion: PlagaDeteccion | null = null;
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
      id: 'evidencia',
      label: 'Ver evidencia',
      icon: 'image-outline',
      variant: 'primary',
      handler: (selected) => this.verEvidencia(selected)
    },
    {
      id: 'correcta',
      label: 'Marcar correcta',
      icon: 'checkmark-outline',
      variant: 'ghost',
      handler: (selected) => this.marcar(selected, 'Confirmada')
    },
    {
      id: 'incorrecta',
      label: 'Marcar incorrecta',
      icon: 'close-outline',
      variant: 'danger',
      handler: (selected) => this.marcar(selected, 'Descartada')
    }
  ];

  constructor(
    private readonly plagasService: PlagasService,
    private readonly cdr: ChangeDetectorRef
  ) {}

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

  marcar(deteccion: PlagaDeteccion | null, estado: PlagaDeteccion['estado']) {
    if (!deteccion) {
      return;
    }
    this.plagasService.marcarDeteccion(deteccion.id, estado).subscribe(() => {
      this.detecciones = this.detecciones.map((item) =>
        item.id === deteccion.id ? { ...item, estado } : item
      );
      this.syncSelectedDeteccion();
      this.cdr.markForCheck();
    });
  }

  private verEvidencia(selected: PlagaDeteccion | null) {
    if (!selected) {
      return;
    }
    window.open(selected.imagenUrl, '_blank', 'noopener,noreferrer');
  }

  private syncSelectedDeteccion() {
    if (!this.selectedDeteccion) {
      return;
    }
    this.selectedDeteccion =
      this.detecciones.find((item) => item.id === this.selectedDeteccion?.id) ?? null;
  }
}
