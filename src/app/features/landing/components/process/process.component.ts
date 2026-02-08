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

    stats = [
        { value: '+40%', label: 'Producción', desc: 'Incremento promedio', icon: 'trending-up', color: 'green' },
        { value: '-60%', label: 'Agua', desc: 'Ahorro en consumo', icon: 'droplet', color: 'blue' },
        { value: '80%', label: 'Menos Químicos', desc: 'Reducción de uso', icon: 'leaf', color: 'emerald' },
        { value: '$', label: 'ROI en 18 meses', desc: 'Retorno garantizado', icon: 'dollar', color: 'gold' },
        { value: '70%', label: 'Menos Tiempo', desc: 'Automatización total', icon: 'clock', color: 'purple' },
        { value: '95%', label: 'Prevención', desc: 'Detección temprana', icon: 'shield', color: 'cyan' }
    ];
}
