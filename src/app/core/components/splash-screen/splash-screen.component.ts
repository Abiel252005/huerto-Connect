import {
    Component,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
    ChangeDetectorRef,
    NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-splash-screen',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './splash-screen.component.html',
    styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit, OnDestroy {
    @Output() splashComplete = new EventEmitter<void>();

    isHidden = false;
    isFadingOut = false;

    loadPercent = 0;
    loadingText = 'INICIALIZANDO';
    arcOffset = 1021; // full arc length (hidden)
    private readonly ARC_TOTAL = 1021;
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        // Smooth counter synced with arc (4.5s fill)
        this.ngZone.run(() => {
            this.intervalId = setInterval(() => {
                if (this.loadPercent < 100) {
                    if (this.loadPercent < 25) {
                        this.loadPercent += 1;
                    } else if (this.loadPercent < 55) {
                        this.loadPercent += 2;
                    } else if (this.loadPercent < 80) {
                        this.loadPercent += 3;
                    } else {
                        this.loadPercent += 2;
                    }
                    this.loadPercent = Math.min(100, this.loadPercent);
                    this.arcOffset = this.ARC_TOTAL * (1 - this.loadPercent / 100);

                    if (this.loadPercent >= 20 && this.loadPercent < 23) {
                        this.loadingText = 'CARGANDO MÓDULOS';
                    } else if (this.loadPercent >= 50 && this.loadPercent < 53) {
                        this.loadingText = 'CONECTANDO DATOS';
                    } else if (this.loadPercent >= 80 && this.loadPercent < 83) {
                        this.loadingText = 'CASI LISTO';
                    } else if (this.loadPercent >= 100) {
                        this.loadingText = 'LISTO';
                        if (this.intervalId) {
                            clearInterval(this.intervalId);
                            this.intervalId = null;
                        }
                    }
                    this.cdr.detectChanges();
                }
            }, 52);
        });

        // Cinematic fade-out
        setTimeout(() => {
            this.isFadingOut = true;
            this.cdr.detectChanges();
        }, 5200);

        // Remove from DOM
        setTimeout(() => {
            this.isHidden = true;
            this.splashComplete.emit();
            this.cdr.detectChanges();
        }, 7000);
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
