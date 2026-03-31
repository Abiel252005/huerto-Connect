import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, BehaviorSubject } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { MapVeracruzComponent } from '../../components/map-veracruz/map-veracruz.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { AlertasService } from '../../services/alertas.service';
import { ChatbotService } from '../../services/chatbot.service';
import { HuertosService } from '../../services/huertos.service';
import { PlagasService } from '../../services/plagas.service';
import { RegionesService } from '../../services/regiones.service';
import { UsuariosService } from '../../services/usuarios.service';
import { formatAdminDate } from '../../utils/date-format.util';

Chart.register(...registerables);

@Component({
  selector: 'app-mini-chart',
  standalone: true,
  template: `<canvas #chartCanvas style="width: 100%; height: 100%; object-fit: contain;"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: number[] = [];
  @Input() color: 'primary' | 'danger' = 'primary';

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  ngAfterViewInit() { this.createChart(); }
  ngOnChanges(changes: SimpleChanges) { if (changes['data'] && !changes['data'].firstChange) this.createChart(); }
  ngOnDestroy() { if (this.chartInstance) this.chartInstance.destroy(); }

  private createChart() {
    if (!this.chartCanvas || !this.data || this.data.length === 0) return;
    if (this.chartInstance) this.chartInstance.destroy();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const stroke = this.color === 'danger' ? '#ef4444' : '#235347';
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    if (this.color === 'danger') {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.34)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(35, 83, 71, 0.34)');
      gradient.addColorStop(1, 'rgba(35, 83, 71, 0.02)');
    }

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data.map((_, i) => String(i)),
        datasets: [{
          data: this.data,
          borderColor: stroke,
          backgroundColor: gradient,
          fill: 'start',
          borderWidth: 2.5,
          tension: 0.36,
          pointRadius: 2.5,
          pointHoverRadius: 4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: stroke,
          pointBorderWidth: 1.4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: { x: { display: false }, y: { display: false } },
        animation: { duration: 800 }
      }
    });
  }
}

interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'down' | 'steady';
  icon: string;
  spark: number[];
  chartType?: 'line' | 'area' | 'bar';
}

export type DashboardFilter = 'all' | 'map' | 'ai' | 'stats';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, MapVeracruzComponent, StatusBadgeComponent, MiniChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminDashboardComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly huertosService = inject(HuertosService);
  private readonly plagasService = inject(PlagasService);
  private readonly alertasService = inject(AlertasService);
  private readonly regionesService = inject(RegionesService);
  private readonly chatbotService = inject(ChatbotService);

  kpis: DashboardKpi[] = [];

  // Filter logic
  filter$ = new BehaviorSubject<DashboardFilter>('all');
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  setFilter(filter: DashboardFilter) {
    this.filter$.next(filter);
    this.isMenuOpen = false;
  }

  readonly vm$ = combineLatest({
    usuarios: this.usuariosService.getUsuarios(),
    huertos: this.huertosService.getHuertos(),
    plagas: this.plagasService.getDetecciones(),
    alertas: this.alertasService.getAlertas(),
    regiones: this.regionesService.getRegiones(),
    chatMetricas: this.chatbotService.getMetricas(),
    chatConversations: this.chatbotService.getConversaciones(),
    filter: this.filter$
  }).pipe(
    map((data) => {
      const { filter } = data;

      const activosHoy = data.usuarios.filter((item) => item.estado === 'Activo').length;
      const alertasCriticas = data.alertas.filter((item) => item.severidad === 'Critico').length;
      const deteccionesHoy = data.plagas.length;
      const totalChats = data.chatConversations.length;
      const growthSeries = this.buildUserRegistrationsSeries(data.usuarios, 12);
      const plagaSeriesFromDates = this.buildSeriesFromDates(data.plagas.map((item) => item.fecha), 12);
      const plagaSeries = plagaSeriesFromDates.length > 0
        ? plagaSeriesFromDates
        : this.buildSeveridadSeries(data.plagas);

      const growthSpark = this.takeLastValues(growthSeries, 7);
      const plagaSpark = this.takeLastValues(plagaSeries, 7);
      const alertSpark = this.takeLastValues(
        this.buildSeriesFromDates(data.alertas.map((item) => item.fecha), 7),
        7
      );
      const chatSpark = this.takeLastValues(
        this.buildSeriesFromDates(data.chatConversations.map((item) => item.fecha), 7),
        7
      );
      const chatTopicSpark = this.takeLastValues(data.chatMetricas.map((item) => item.total), 7);
      const huertoSpark = this.takeLastValues(data.huertos.map((item) => Math.round(item.salud ?? 0)), 7);
      const regionSpark = this.takeLastValues(
        data.regiones.map((item) => Math.max(item.huertos ?? 0, item.detecciones ?? 0)),
        7
      );
      const confianzaSpark = this.takeLastValues(data.plagas.map((item) => Number(item.confianza ?? 0)), 7);

      // Select KPIs based on the activated filter
      if (filter === 'map') {
        this.kpis = [
          { label: 'Alertas críticas activas', value: alertasCriticas.toString(), delta: '+3 (hoy)', tone: 'down', icon: 'warning-outline', spark: alertSpark, chartType: 'line' },
          { label: 'Regiones en riesgo', value: '3', delta: 'Estable', tone: 'steady', icon: 'map-outline', spark: regionSpark, chartType: 'area' },
          { label: 'Total reportes regionales', value: data.alertas.length.toString(), delta: '+12%', tone: 'down', icon: 'alert-circle-outline', spark: alertSpark, chartType: 'bar' },
        ];
      } else if (filter === 'ai') {
        this.kpis = [
          { label: 'Consultas totales Chatbot', value: totalChats.toString(), delta: '+14.2%', tone: 'up', icon: 'chatbubbles-outline', spark: chatSpark.length > 0 ? chatSpark : chatTopicSpark, chartType: 'bar' },
          { label: 'Detecciones de plagas', value: deteccionesHoy.toString(), delta: '-2.1%', tone: 'down', icon: 'bug-outline', spark: plagaSpark, chartType: 'area' },
          { label: 'Confianza de la IA', value: '94.2%', delta: '+0.5%', tone: 'up', icon: 'hardware-chip-outline', spark: confianzaSpark, chartType: 'line' },
        ];
      } else if (filter === 'stats') {
        this.kpis = [
          { label: 'Tendencia de crecimiento', value: '+18.4%', delta: 'Mejora', tone: 'up', icon: 'trending-up-outline', spark: growthSpark, chartType: 'area' },
          { label: 'Usuarios nuevos', value: growthSpark.length > 0 ? String(growthSpark[growthSpark.length - 1]) : '0', delta: '+5', tone: 'up', icon: 'person-add-outline', spark: growthSpark, chartType: 'bar' },
          { label: 'Métricas de sanidad', value: '88/100', delta: 'Estable', tone: 'steady', icon: 'heart-outline', spark: huertoSpark, chartType: 'line' },
        ];
      } else {
        // All
        this.kpis = [
          { label: 'Usuarios activos hoy', value: activosHoy.toString(), delta: '+6.3%', tone: 'up', icon: 'people-outline', spark: growthSpark, chartType: 'area' },
          { label: 'Huertos registrados', value: data.huertos.length.toString(), delta: '+9.1%', tone: 'up', icon: 'leaf-outline', spark: huertoSpark, chartType: 'line' },
          { label: 'Detecciones de plagas hoy', value: deteccionesHoy.toString(), delta: '-2.1%', tone: 'down', icon: 'bug-outline', spark: plagaSpark, chartType: 'bar' },
          { label: 'Alertas criticas', value: alertasCriticas.toString(), delta: 'estable', tone: 'steady', icon: 'warning-outline', spark: alertSpark, chartType: 'line' },
          { label: 'Conversaciones chatbot hoy', value: totalChats.toString(), delta: '+14.2%', tone: 'up', icon: 'chatbubbles-outline', spark: chatSpark.length > 0 ? chatSpark : chatTopicSpark, chartType: 'area' },
          { label: 'Regiones activas', value: data.regiones.length.toString(), delta: '+2', tone: 'up', icon: 'earth-outline', spark: regionSpark, chartType: 'bar' }
        ];
      }

      return {
        ...data,
        alertas: data.alertas,
        plagas: data.plagas,
        usuariosActivos: activosHoy,
        alertasCriticas,
        deteccionesHoy,
        totalChats,
        growthSeries,
        plagaSeries,
        currentFilter: filter
      };
    })
  );

  trackByIndex(index: number): number {
    return index;
  }

  formatFecha(value: string | null): string {
    return formatAdminDate(value);
  }

  private buildUserRegistrationsSeries(
    usuarios: Array<{ createdAt?: string | null }>,
    months = 12
  ): number[] {
    if (!usuarios.length || months <= 0) {
      return [];
    }

    const now = new Date();
    const currentMonthKey = now.getFullYear() * 12 + now.getMonth();
    const series = Array.from({ length: months }, () => 0);
    let hasValidDates = false;

    for (const usuario of usuarios) {
      const createdDate = this.parseDate(usuario.createdAt);
      if (!createdDate) {
        continue;
      }

      const createdMonthKey = createdDate.getFullYear() * 12 + createdDate.getMonth();
      const diffMonths = currentMonthKey - createdMonthKey;

      if (diffMonths < 0 || diffMonths >= months) {
        continue;
      }

      const bucket = months - 1 - diffMonths;
      series[bucket] += 1;
      hasValidDates = true;
    }

    return hasValidDates ? series : [];
  }

  private buildSeriesFromDates(
    dates: Array<string | null | undefined>,
    buckets = 12
  ): number[] {
    if (!dates.length || buckets <= 0) {
      return [];
    }

    const now = new Date();
    const useDailyBuckets = buckets <= 8;
    const series = Array.from({ length: buckets }, () => 0);
    let hasValidDates = false;

    if (useDailyBuckets) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const dayMs = 24 * 60 * 60 * 1000;

      for (const value of dates) {
        const parsed = this.parseDate(value);
        if (!parsed) {
          continue;
        }

        const dateStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
        const diffDays = Math.floor((todayStart - dateStart) / dayMs);
        if (diffDays < 0 || diffDays >= buckets) {
          continue;
        }

        const bucketIndex = buckets - 1 - diffDays;
        series[bucketIndex] += 1;
        hasValidDates = true;
      }

      return hasValidDates ? series : [];
    }

    const currentMonthKey = now.getFullYear() * 12 + now.getMonth();
    for (const value of dates) {
      const parsed = this.parseDate(value);
      if (!parsed) {
        continue;
      }

      const monthKey = parsed.getFullYear() * 12 + parsed.getMonth();
      const diffMonths = currentMonthKey - monthKey;
      if (diffMonths < 0 || diffMonths >= buckets) {
        continue;
      }

      const bucketIndex = buckets - 1 - diffMonths;
      series[bucketIndex] += 1;
      hasValidDates = true;
    }

    return hasValidDates ? series : [];
  }

  private buildSeveridadSeries(
    plagas: Array<{ severidad: 'Baja' | 'Media' | 'Alta' }>
  ): number[] {
    if (!plagas.length) {
      return [];
    }

    const severidad = {
      Baja: 0,
      Media: 0,
      Alta: 0,
    };

    for (const plaga of plagas) {
      severidad[plaga.severidad] += 1;
    }

    const values = [severidad.Baja, severidad.Media, severidad.Alta];
    return values.some((value) => value > 0) ? values : [];
  }

  private takeLastValues(values: number[], size: number): number[] {
    if (!values.length || size <= 0) {
      return [];
    }

    if (values.length <= size) {
      return [...values];
    }

    return values.slice(values.length - size);
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
