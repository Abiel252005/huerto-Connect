import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-splash-screen',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './splash-screen.component.html',
    styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit {
    @Output() splashComplete = new EventEmitter<void>();

    isHidden = false;
    isFadingOut = false;

    ngOnInit(): void {
        // After the animation plays, start fade-out
        setTimeout(() => {
            this.isFadingOut = true;
        }, 4000);

        // After fade-out completes, hide completely and emit event
        setTimeout(() => {
            this.isHidden = true;
            this.splashComplete.emit();
        }, 4800);
    }
}
