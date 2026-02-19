import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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

    onAboutImageError(): void {
        this.aboutImageLoaded = false;
    }
}
