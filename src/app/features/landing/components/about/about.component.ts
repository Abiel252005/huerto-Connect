import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createFloatingLeaves, FloatingLeaf } from '../../../../shared/ui-effects/parallax-leaves.util';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent {
    readonly aboutImage = 'assets/images/huertooo.webp';
    readonly leaves: FloatingLeaf[] = createFloatingLeaves(12, 3101);
    aboutImageLoaded = true;

    onAboutImageError(): void {
        this.aboutImageLoaded = false;
    }
}
