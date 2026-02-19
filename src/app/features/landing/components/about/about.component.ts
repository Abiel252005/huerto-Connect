import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { calculateParallaxOffset, createFloatingLeaves, FloatingLeaf } from '../../../../shared/ui-effects/parallax-leaves.util';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent {
    readonly aboutImage = 'assets/images/huertooo.webp';
    aboutImageLoaded = true;
    readonly leaves: FloatingLeaf[] = createFloatingLeaves(12, 3101);
    parallaxX = 0;
    parallaxY = 0;

    onParallaxMove(event: PointerEvent): void {
        const offset = calculateParallaxOffset(event, 14);
        this.parallaxX = offset.x;
        this.parallaxY = offset.y;
    }

    onParallaxLeave(): void {
        this.parallaxX = 0;
        this.parallaxY = 0;
    }

    onAboutImageError(): void {
        this.aboutImageLoaded = false;
    }
}
