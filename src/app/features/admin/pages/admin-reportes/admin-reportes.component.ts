import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { ReportesService } from '../../services/reportes.service';
import { ReporteItem } from '../../mock/reportes.mock';

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent, StatusBadgeComponent],
  templateUrl: './admin-reportes.component.html',
  styleUrls: ['./admin-reportes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReportesComponent implements OnInit {
  reportes: ReporteItem[] = [];
  selectedReporte: ReporteItem | null = null;
  readonly rowIdentity = (reporte: ReporteItem): string => reporte.id;
  readonly columns: ColumnDef<ReporteItem>[] = [
    { key: 'nombre', header: 'Reporte', cell: (row) => row.nombre },
    { key: 'tipo', header: 'Tipo', cell: (row) => row.tipo, width: '140px' },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '120px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '130px', isCustom: true }
  ];
  readonly actions: ActionDef<ReporteItem>[] = [
    {
      id: 'descargar',
      label: 'Descargar',
      icon: 'download-outline',
      variant: 'primary',
      handler: (selected) => this.descargar(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminar(selected)
    }
  ];

  constructor(
    private readonly reportesService: ReportesService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.reportesService.getReportes().subscribe((reportes) => {
      this.reportes = reportes;
      this.syncSelectedReporte();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(reporte: ReporteItem | null) {
    this.selectedReporte = reporte;
  }

  clearSelection() {
    this.selectedReporte = null;
  }

  private descargar(selected: ReporteItem | null) {
    if (!selected) {
      return;
    }
    console.log('Descargar reporte', selected.id);
  }

  private eliminar(selected: ReporteItem | null) {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm(`Eliminar reporte ${selected.nombre}?`);
    if (!confirmed) {
      return;
    }
    this.reportes = this.reportes.filter((item) => item.id !== selected.id);
    this.selectedReporte = null;
    this.cdr.markForCheck();
  }

  private syncSelectedReporte() {
    if (!this.selectedReporte) {
      return;
    }
    this.selectedReporte = this.reportes.find((item) => item.id === this.selectedReporte?.id) ?? null;
  }
}
