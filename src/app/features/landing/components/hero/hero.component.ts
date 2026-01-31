import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './hero.component.html',
    styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
    stats = [
        { value: '500+', label: 'Huertos Activos' },
        { value: '98%', label: 'Satisfacción' },
        { value: '24/7', label: 'Monitoreo' }
    ];
}
