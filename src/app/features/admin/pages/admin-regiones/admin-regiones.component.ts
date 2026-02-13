import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapVeracruzComponent } from '../../components/map-veracruz/map-veracruz.component';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { Region } from '../../models/region.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { RegionesService } from '../../services/regiones.service';

@Component({
  selector: 'app-admin-regiones',
  standalone: true,
  imports: [CommonModule, MapVeracruzComponent, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-regiones.component.html',
  styleUrls: ['./admin-regiones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRegionesComponent implements OnInit {
  regiones: Region[] = [];
  selectedRegion: Region | null = null;
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
      id: 'ver',
      label: 'Ver detalle',
      icon: 'eye-outline',
      variant: 'primary',
      handler: (selected) => this.verDetalle(selected)
    },
    {
      id: 'priorizar',
      label: 'Priorizar region',
      icon: 'flash-outline',
      variant: 'ghost',
      handler: (selected) => this.priorizarRegion(selected)
    }
  ];

  constructor(
    private readonly regionesService: RegionesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

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

  private verDetalle(selected: Region | null) {
    if (!selected) {
      return;
    }
    console.log('Ver detalle region', selected.id);
  }

  private priorizarRegion(selected: Region | null) {
    if (!selected) {
      return;
    }
    this.regiones = this.regiones.map((item) =>
      item.id === selected.id ? { ...item, actividad: 'Alta' } : item
    );
    this.syncSelectedRegion();
    this.cdr.markForCheck();
  }

  private syncSelectedRegion() {
    if (!this.selectedRegion) {
      return;
    }
    this.selectedRegion = this.regiones.find((item) => item.id === this.selectedRegion?.id) ?? null;
  }
}
