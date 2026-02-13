import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-features',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './features.component.html',
    styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {
    features = [
        {
            title: 'Monitoreo Inteligente',
            description: 'Sensores IoT que miden en tiempo real cada parámetro vital de tu cultivo.',
            icon: 'cpu',
            color: '#00D4A1'
        },
        {
            title: 'Riego Automatizado',
            description: 'Agua exacta en el momento preciso. Cero desperdicio, máxima eficiencia.',
            icon: 'droplet',
            color: '#00afda'
        },
        {
            title: 'Energía Solar',
            description: 'Operación 100% autónoma con paneles solares de última generación.',
            icon: 'sun',
            color: '#ff9f1c'
        },
        {
            title: 'Control Remoto',
            description: 'Gestiona tu huerto desde cualquier lugar con nuestra app móvil.',
            icon: 'wifi',
            color: '#e056fd'
        },
        {
            title: 'Analytics IA',
            description: 'Predicciones precisas y recomendaciones basadas en inteligencia artificial.',
            icon: 'bar-chart',
            color: '#6c5ce7'
        },
        {
            title: 'Detección Temprana',
            description: 'Alertas instantáneas ante plagas, enfermedades o anomalías.',
            icon: 'shield',
            color: '#ff4757'
        }
    ];
}
