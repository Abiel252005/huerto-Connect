import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { combineLatest, Subscription } from 'rxjs';
import { UsuariosService } from '../../services/usuarios.service';
import { RegionesService } from '../../services/regiones.service';
import { PlagasService } from '../../services/plagas.service';
import { ChatbotService } from '../../services/chatbot.service';
import { Usuario } from '../../models/usuario.model';
import { Region } from '../../models/region.model';
import { PlagaDeteccion } from '../../models/plaga-deteccion.model';
import { ChatMetric } from '../../mock/chatbot.mock';

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

  usuariosRegionData: Array<{ label: string; value: number }> = [];
  plagasSeveridadData: Array<{ label: string; value: number }> = [];
  chatbotTemaData: Array<{ label: string; value: number }> = [];
  comparativaRegionalData: { labels: string[]; huertos: number[]; detecciones: number[] } = {
    labels: [],
    huertos: [],
    detecciones: [],
  };

  private readonly usuariosService = inject(UsuariosService);
  private readonly regionesService = inject(RegionesService);
  private readonly plagasService = inject(PlagasService);
  private readonly chatbotService = inject(ChatbotService);

  private readonly charts: Chart[] = [];
  private readonly subscriptions = new Subscription();

  ngAfterViewInit(): void {
    const statsSub = combineLatest({
      usuarios: this.usuariosService.getUsuarios(),
      regiones: this.regionesService.getRegiones(),
      plagas: this.plagasService.getDetecciones(),
      chatMetricas: this.chatbotService.getMetricas(),
    }).subscribe({
      next: ({ usuarios, regiones, plagas, chatMetricas }) => {
        this.usuariosRegionData = this.buildUsuariosPorRegion(usuarios, regiones);
        this.plagasSeveridadData = this.buildPlagasPorSeveridad(plagas);
        this.chatbotTemaData = this.buildChatbotTemas(chatMetricas);
        this.comparativaRegionalData = this.buildComparativaRegional(regiones);
        this.renderCharts();
      },
      error: () => {
        this.usuariosRegionData = [];
        this.plagasSeveridadData = [];
        this.chatbotTemaData = [];
        this.comparativaRegionalData = { labels: [], huertos: [], detecciones: [] };
        this.renderCharts();
      },
    });

    this.subscriptions.add(statsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  private renderCharts(): void {
    this.destroyCharts();
    this.clearCanvas(this.usuariosRegionCanvas);
    this.clearCanvas(this.plagasSeveridadCanvas);
    this.clearCanvas(this.chatbotTemaCanvas);
    this.clearCanvas(this.comparativaRegionalCanvas);

    const colors = {
      text: '#173831',
      textMuted: '#8CB79B',
      line: 'rgba(35, 83, 71, 0.15)',
      primary: '#051F20',
      accent: '#235347',
      accentSoft: '#8CB79B',
      warn: '#eab308',
      danger: '#ef4444',
      info: '#22d3ee',
    };

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            color: colors.textMuted,
            usePointStyle: true,
            boxWidth: 6,
            padding: 14,
            font: { family: 'Inter', size: 12, weight: 500 }
          }
        },
        tooltip: {
          backgroundColor: '#051F20',
          titleColor: '#8CB79B',
          bodyColor: '#ffffff',
          padding: 8,
          cornerRadius: 6,
          displayColors: true,
          intersect: false,
          mode: 'index' as const,
          titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 13, weight: 600 }
        }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' as const }
    };

    const uCtx = this.usuariosRegionCanvas.nativeElement.getContext('2d');
    if (uCtx && this.usuariosRegionData.length > 0) {
      const uGradient = uCtx.createLinearGradient(0, 0, 0, 260);
      uGradient.addColorStop(0, 'rgba(35, 83, 71, 0.42)');
      uGradient.addColorStop(1, 'rgba(35, 83, 71, 0.02)');

      const usuariosConfig: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: this.usuariosRegionData.map((item) => item.label),
          datasets: [{
            label: 'Usuarios',
            data: this.usuariosRegionData.map((item) => item.value),
            borderColor: colors.accent,
            backgroundColor: uGradient,
            fill: 'start',
            borderWidth: 2.6,
            pointRadius: 2.6,
            pointHoverRadius: 4.8,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: colors.accent,
            pointBorderWidth: 1.6,
            tension: 0.35,
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { ...commonOptions.plugins.legend, display: false }
          },
          scales: this.buildVerticalScales(colors)
        }
      };

      this.charts.push(new Chart(uCtx, usuariosConfig));
    }

    const pCtx = this.plagasSeveridadCanvas.nativeElement.getContext('2d');
    if (pCtx && this.plagasSeveridadData.length > 0) {
      const plagasConfig: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: this.plagasSeveridadData.map((item) => item.label),
          datasets: [{
            data: this.plagasSeveridadData.map((item) => item.value),
            backgroundColor: [colors.accentSoft, colors.warn, colors.danger],
            hoverOffset: 8,
            borderWidth: 0
          }]
        },
        options: {
          ...commonOptions,
          cutout: '72%',
          plugins: {
            ...commonOptions.plugins,
            legend: {
              ...commonOptions.plugins.legend,
              display: true,
              position: 'bottom' as const,
              align: 'center' as const
            }
          }
        }
      };

      this.charts.push(new Chart(pCtx, plagasConfig));
    }

    const tCtx = this.chatbotTemaCanvas.nativeElement.getContext('2d');
    if (tCtx && this.chatbotTemaData.length > 0) {
      const chatbotConfig: ChartConfiguration<'radar'> = {
        type: 'radar',
        data: {
          labels: this.chatbotTemaData.map((item) => item.label),
          datasets: [{
            label: 'Consultas',
            data: this.chatbotTemaData.map((item) => item.value),
            borderColor: colors.info,
            backgroundColor: 'rgba(34, 211, 238, 0.20)',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: colors.info,
            pointBorderWidth: 1.4,
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { ...commonOptions.plugins.legend, display: false }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(35, 83, 71, 0.12)' },
              grid: { color: 'rgba(35, 83, 71, 0.10)' },
              pointLabels: { color: colors.text, font: { family: 'Inter', size: 12, weight: 500 } },
              ticks: { display: false },
              beginAtZero: true
            }
          }
        }
      };

      this.charts.push(new Chart(tCtx, chatbotConfig));
    }

    const cCtx = this.comparativaRegionalCanvas.nativeElement.getContext('2d');
    if (cCtx && this.comparativaRegionalData.labels.length > 0) {
      const cGradient1 = cCtx.createLinearGradient(0, 0, 0, 260);
      cGradient1.addColorStop(0, 'rgba(35, 83, 71, 0.34)');
      cGradient1.addColorStop(1, 'rgba(35, 83, 71, 0.02)');

      const cGradient2 = cCtx.createLinearGradient(0, 0, 0, 260);
      cGradient2.addColorStop(0, 'rgba(239, 68, 68, 0.26)');
      cGradient2.addColorStop(1, 'rgba(239, 68, 68, 0.01)');

      const comparativaConfig: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: this.comparativaRegionalData.labels,
          datasets: [
            {
              label: 'Huertos',
              data: this.comparativaRegionalData.huertos,
              borderColor: colors.accent,
              backgroundColor: cGradient1,
              borderWidth: 2.4,
              tension: 0.35,
              fill: true,
              pointRadius: 2,
              pointHoverRadius: 5,
              pointBackgroundColor: '#fff',
              pointBorderColor: colors.accent,
              pointBorderWidth: 1.4
            },
            {
              label: 'Detecciones',
              data: this.comparativaRegionalData.detecciones,
              borderColor: colors.danger,
              backgroundColor: cGradient2,
              borderWidth: 2.2,
              tension: 0.35,
              fill: true,
              pointRadius: 2,
              pointHoverRadius: 5,
              pointBackgroundColor: '#fff',
              pointBorderColor: colors.danger,
              pointBorderWidth: 1.4
            }
          ]
        },
        options: {
          ...commonOptions,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            ...commonOptions.plugins,
            legend: { ...commonOptions.plugins.legend, display: true }
          },
          scales: {
            x: {
              border: { display: false },
              grid: { display: false },
              ticks: { color: colors.textMuted, font: { family: 'Inter', size: 12 } }
            },
            y: {
              border: { display: false },
              grid: { color: 'rgba(35, 83, 71, 0.10)', tickLength: 0 },
              ticks: { color: colors.textMuted, padding: 8, font: { family: 'Inter', size: 11 } }
            }
          }
        }
      };

      this.charts.push(new Chart(cCtx, comparativaConfig));
    }
  }

  private destroyCharts(): void {
    while (this.charts.length > 0) {
      this.charts.pop()?.destroy();
    }
  }

  private clearCanvas(canvasRef: ElementRef<HTMLCanvasElement>): void {
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private buildVerticalScales(colors: { textMuted: string; line: string }) {
    return {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: colors.textMuted, font: { family: 'Inter', size: 12 } }
      },
      y: {
        border: { display: false },
        grid: { color: colors.line, tickLength: 0 },
        ticks: { color: colors.textMuted, padding: 10, font: { family: 'Inter', size: 12 } }
      }
    };
  }

  private buildUsuariosPorRegion(usuarios: Usuario[], regiones: Region[]): Array<{ label: string; value: number }> {
    if (usuarios.length === 0) {
      return [];
    }

    const regionNameById = new Map(regiones.map((region) => [region.id, region.nombre]));
    const counts = new Map<string, number>();

    usuarios.forEach((usuario) => {
      const key = usuario.region || '';
      const label = key ? (regionNameById.get(key) ?? key) : 'Sin region';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }

  private buildPlagasPorSeveridad(plagas: PlagaDeteccion[]): Array<{ label: string; value: number }> {
    if (plagas.length === 0) {
      return [];
    }

    const buckets: Record<'Baja' | 'Media' | 'Alta', number> = {
      Baja: 0,
      Media: 0,
      Alta: 0,
    };

    plagas.forEach((plaga) => {
      buckets[plaga.severidad] += 1;
    });

    return (['Baja', 'Media', 'Alta'] as const)
      .map((label) => ({ label, value: buckets[label] }))
      .filter((item) => item.value > 0);
  }

  private buildChatbotTemas(chatMetricas: ChatMetric[]): Array<{ label: string; value: number }> {
    if (chatMetricas.length === 0) {
      return [];
    }

    return [...chatMetricas]
      .map((item) => ({ label: item.tema, value: item.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }

  private buildComparativaRegional(regiones: Region[]): { labels: string[]; huertos: number[]; detecciones: number[] } {
    const ranked = [...regiones]
      .filter((region) => region.huertos > 0 || region.detecciones > 0)
      .sort((a, b) => b.huertos - a.huertos)
      .slice(0, 7);

    return {
      labels: ranked.map((region) => region.nombre),
      huertos: ranked.map((region) => region.huertos),
      detecciones: ranked.map((region) => region.detecciones),
    };
  }
}
