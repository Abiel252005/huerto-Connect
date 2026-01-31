import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-process',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './process.component.html',
    styleUrls: ['./process.component.scss']
})
export class ProcessComponent {
    steps = [
        { number: '01', title: 'Evaluación Inicial', desc: 'Analizamos tu terreno, cultivos y objetivos.', icon: 'search' },
        { number: '02', title: 'Instalación', desc: 'Nuestro equipo instala sensores y sistemas de riego.', icon: 'settings' },
        { number: '03', title: 'Activación', desc: 'Configuramos el sistema y te capacitamos.', icon: 'power' },
        { number: '04', title: 'Optimización Continua', desc: 'Monitoreamos y ajustamos constantemente.', icon: 'trending-up' }
    ];
}
