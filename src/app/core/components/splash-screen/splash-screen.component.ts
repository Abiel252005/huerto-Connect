import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  @Output() splashComplete = new EventEmitter<void>();

  isHidden = false;
  isFadingOut = false;

  loadPercent = 0;
  loadingText = 'AI INIT';
  arcOffset = 1000;
  private readonly ARC_TOTAL = 1000;
  private readonly LOAD_DURATION_MS = 4600;
  private readonly FADE_START_MS = 5200;
  private readonly HIDE_MS = 6200;

  private rafId: number | null = null;
  private loadStartTs = 0;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));

    this.fadeTimeout = setTimeout(() => {
      this.isFadingOut = true;
      this.cdr.markForCheck();
    }, this.FADE_START_MS);

    this.hideTimeout = setTimeout(() => {
      this.isHidden = true;
      this.splashComplete.emit();
      this.cdr.markForCheck();
    }, this.HIDE_MS);
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private tick(timestamp: number): void {
    if (!this.loadStartTs) {
      this.loadStartTs = timestamp;
    }

    const elapsed = timestamp - this.loadStartTs;
    const rawProgress = Math.min(elapsed / this.LOAD_DURATION_MS, 1);
    const eased = this.easeInOutCubic(rawProgress);

    this.loadPercent = Math.round(eased * 100);
    this.arcOffset = this.ARC_TOTAL * (1 - eased);
    this.loadingText = this.resolveLoadingText(this.loadPercent);
    this.cdr.markForCheck();

    if (rawProgress < 1) {
      this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    }
  }

  private resolveLoadingText(progress: number): string {
    if (progress < 24) {
      return 'AI INIT';
    }
    if (progress < 48) {
      return 'SYNC RINGS';
    }
    if (progress < 72) {
      return 'NURTURING CORE';
    }
    if (progress < 100) {
      return 'FINALIZING';
    }
    return 'READY';
  }

  private easeInOutCubic(value: number): number {
    if (value < 0.5) {
      return 4 * value * value * value;
    }
    return 1 - Math.pow(-2 * value + 2, 3) / 2;
  }
}
