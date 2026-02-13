import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-estadisticas.component.html',
  styleUrls: ['./admin-estadisticas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEstadisticasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('usuariosRegionCanvas') usuariosRegionCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('plagasSeveridadCanvas') plagasSeveridadCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chatbotTemaCanvas') chatbotTemaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comparativaRegionalCanvas') comparativaRegionalCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly charts: Chart[] = [];

  ngAfterViewInit() {
    this.renderCharts();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private renderCharts() {
    this.destroyCharts();

    const colors = this.readThemeColors();

    const usuariosPorRegion = [
      { label: 'Veracruz Puerto', value: 1280 },
      { label: 'Xalapa', value: 940 },
      { label: 'Cordoba', value: 760 },
      { label: 'Orizaba', value: 540 },
      { label: 'Poza Rica', value: 470 },
      { label: 'Coatzacoalcos', value: 410 }
    ];
    const plagasPorSeveridad = [
      { label: 'Baja', value: 112 },
      { label: 'Media', value: 86 },
      { label: 'Alta', value: 41 }
    ];
    const consultasPorTema = [
      { label: 'Riego', value: 6200 },
      { label: 'Plagas', value: 4300 },
      { label: 'Fertilizacion', value: 3800 },
      { label: 'Calendario', value: 2900 },
      { label: 'Otros', value: 1500 }
    ];
    const comparativaRegional = {
      labels: ['Veracruz', 'Xalapa', 'Cordoba', 'Orizaba', 'Poza Rica', 'Coatzacoalcos'],
      huertos: [860, 720, 640, 520, 470, 410],
      detecciones: [124, 108, 92, 76, 62, 55]
    };

    const usuariosConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: usuariosPorRegion.map((item) => item.label),
        datasets: [
          {
            label: 'Usuarios',
            data: usuariosPorRegion.map((item) => item.value),
            backgroundColor: colors.accentSecondary,
            borderRadius: 8,
            maxBarThickness: 36
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: this.buildScales(colors)
      }
    };

    const plagasConfig: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: plagasPorSeveridad.map((item) => item.label),
        datasets: [
          {
            label: 'Detecciones',
            data: plagasPorSeveridad.map((item) => item.value),
            backgroundColor: [colors.accent, colors.warn, colors.danger],
            borderColor: colors.panel,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: colors.text
            }
          }
        }
      }
    };

    const chatbotConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: consultasPorTema.map((item) => item.label),
        datasets: [
          {
            label: 'Consultas',
            data: consultasPorTema.map((item) => item.value),
            backgroundColor: colors.accent,
            borderRadius: 8,
            maxBarThickness: 32
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: this.buildScales(colors)
      }
    };

    const comparativaConfig: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: comparativaRegional.labels,
        datasets: [
          {
            label: 'Huertos',
            data: comparativaRegional.huertos,
            borderColor: colors.accentSecondary,
            backgroundColor: colors.accentSecondary,
            tension: 0.28
          },
          {
            label: 'Detecciones',
            data: comparativaRegional.detecciones,
            borderColor: colors.danger,
            backgroundColor: colors.danger,
            tension: 0.28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: this.buildScales(colors),
        plugins: {
          legend: {
            labels: {
              color: colors.text
            }
          }
        }
      }
    };

    this.charts.push(
      new Chart(this.usuariosRegionCanvas.nativeElement.getContext('2d')!, usuariosConfig),
      new Chart(this.plagasSeveridadCanvas.nativeElement.getContext('2d')!, plagasConfig),
      new Chart(this.chatbotTemaCanvas.nativeElement.getContext('2d')!, chatbotConfig),
      new Chart(this.comparativaRegionalCanvas.nativeElement.getContext('2d')!, comparativaConfig)
    );
  }

  private destroyCharts() {
    while (this.charts.length > 0) {
      this.charts.pop()?.destroy();
    }
  }

  private buildScales(colors: { text: string; line: string }) {
    return {
      x: {
        ticks: { color: colors.text },
        grid: { color: colors.line }
      },
      y: {
        ticks: { color: colors.text },
        grid: { color: colors.line }
      }
    };
  }

  private readThemeColors(): {
    text: string;
    line: string;
    accent: string;
    accentSecondary: string;
    warn: string;
    danger: string;
    panel: string;
  } {
    const shell = document.querySelector('.admin-shell') as HTMLElement | null;
    const styles = getComputedStyle(shell ?? document.documentElement);

    return {
      text: styles.getPropertyValue('--admin-text-dim').trim() || '#2f6e66',
      line: styles.getPropertyValue('--admin-line-soft').trim() || 'rgba(6, 122, 112, 0.14)',
      accent: styles.getPropertyValue('--admin-accent').trim() || '#00c28c',
      accentSecondary: styles.getPropertyValue('--admin-accent-2').trim() || '#00c2ff',
      warn: styles.getPropertyValue('--admin-warn').trim() || '#b07900',
      danger: styles.getPropertyValue('--admin-danger').trim() || '#bf3f63',
      panel: styles.getPropertyValue('--admin-panel').trim() || 'rgba(255, 255, 255, 0.78)'
    };
  }
}
