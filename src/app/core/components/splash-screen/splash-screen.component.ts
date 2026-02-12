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

    // Animated tagline
    taglineChars = 'Cultivando el futuro'.split('');

    // Loading percentage
    loadPercent = 0;
    loadingText = 'Inicializando...';
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        // Start the percentage counter after a short delay (when the loader becomes visible)
        setTimeout(() => {
            this.startCounter();
        }, 500);

        // Start fade-out
        setTimeout(() => {
            this.isFadingOut = true;
            this.cdr.detectChanges();
        }, 4500);

        // Fully hidden
        setTimeout(() => {
            this.isHidden = true;
            this.splashComplete.emit();
            this.cdr.detectChanges();
        }, 6000);
    }

    private startCounter(): void {
        this.ngZone.run(() => {
            this.intervalId = setInterval(() => {
                if (this.loadPercent < 100) {
                    // Smooth acceleration
                    if (this.loadPercent < 30) {
                        this.loadPercent += 1;
                    } else if (this.loadPercent < 60) {
                        this.loadPercent += 2;
                    } else if (this.loadPercent < 85) {
                        this.loadPercent += 3;
                    } else {
                        this.loadPercent += 2;
                    }

                    this.loadPercent = Math.min(100, this.loadPercent);

                    // Update text at milestones
                    if (this.loadPercent >= 25 && this.loadPercent < 28) {
                        this.loadingText = 'Cargando recursos...';
                    } else if (this.loadPercent >= 55 && this.loadPercent < 58) {
                        this.loadingText = 'Preparando interfaz...';
                    } else if (this.loadPercent >= 80 && this.loadPercent < 83) {
                        this.loadingText = 'Casi listo...';
                    } else if (this.loadPercent >= 100) {
                        this.loadingText = '¡Listo!';
                        if (this.intervalId) {
                            clearInterval(this.intervalId);
                            this.intervalId = null;
                        }
                    }

                    this.cdr.detectChanges();
                }
            }, 50);
        });
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
