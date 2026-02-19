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
        {
            number: '01',
            title: 'Configura tu Perfil',
            desc: 'Ingresa datos de tu terreno, fuente de agua, ubicación y zona climática.',
            icon: 'user-cog'
        },
        {
            number: '02',
            title: 'IA Sugiere Cultivos',
            desc: 'La IA analiza tu región y recomienda los cultivos ideales para tu zona.',
            icon: 'brain'
        },
        {
            number: '03',
            title: 'Selecciona tu Siembra',
            desc: 'Elige si vas a sembrar o ya sembraste y recibe tips personalizados.',
            icon: 'seedling'
        },
        {
            number: '04',
            title: 'Cronograma Inteligente',
            desc: 'Obtén tu línea de tiempo, programa de actividades y fecha estimada de cosecha.',
            icon: 'calendar'
        }
    ];

    stats = [
        { value: '24/7', label: 'Asistencia', desc: 'IA siempre disponible', icon: 'robot', color: 'green' },
        { value: '+50', label: 'Cultivos', desc: 'Base de conocimiento', icon: 'leaf', color: 'emerald' },
        { value: '100%', label: 'Personalizado', desc: 'Adaptado a tu zona', icon: 'target', color: 'blue' },
        { value: 'Tips', label: 'Inteligentes', desc: 'Mejora continua', icon: 'lightbulb', color: 'gold' },
        { value: 'Diario', label: 'Planificador', desc: 'Actividades diarias', icon: 'clock', color: 'purple' },
        { value: 'Red', label: 'Agricultores', desc: 'Aprende de otros', icon: 'users', color: 'cyan' }
    ];
}
