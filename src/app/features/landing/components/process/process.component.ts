import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-process',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './process.component.html',
    styleUrls: ['./process.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProcessComponent {
    screens = [
        {
            id: 'perfil',
            label: 'Perfil',
            icon: 'person-outline',
            title: 'Define tu Perfil',
            desc: 'Indica tu nivel de experiencia agrícola para que la Inteligencia Artificial adapte sus recomendaciones y consejos técnicos a tus conocimientos previos.',
            features: [
                'Adaptación de lenguaje técnico',
                'Recomendaciones personalizadas',
                'Curva de aprendizaje guiada'
            ]
        },
        {
            id: 'area',
            label: 'Terreno',
            icon: 'grid-outline',
            title: 'Área de Cultivo',
            desc: 'Establece las dimensiones exactas de tu huerto. Esto le permite al sistema calcular requerimientos de agua, semillas y fertilizantes de forma automática.',
            features: [
                'Cálculo de insumos automático',
                'Estimación de rendimiento',
                'Distribución espacial óptima'
            ]
        },
        {
            id: 'agua',
            label: 'Ubicación y Agua',
            icon: 'water-outline',
            title: 'Contexto Ambiental',
            desc: 'La disponibilidad de agua y tu ubicación geográfica definen qué cultivos serán viables. Huerto Connect ajusta el cronograma según tu clima y tipo de riego.',
            features: [
                'Gestión eficiente de recursos',
                'Prevención de estrés hídrico',
                'Alertas meteorológicas'
            ]
        },
        {
            id: 'inicio',
            label: 'Dashboard',
            icon: 'apps-outline',
            title: 'Tu Panel Central',
            desc: 'Un espacio centralizado que resume la salud general de tu cultivo, te notifica sobre acciones importantes y te da acceso inmediato al motor gráfico de análisis.',
            features: [
                'Rastreo de actividades diarias',
                'Notificaciones oportunas',
                'Visión integral del huerto'
            ]
        }
    ];

    activeScreenId = 'perfil';

    steps = [
        {
            number: '01',
            title: 'Configura tu Perfil',
            desc: 'Ingresa datos de tu terreno, fuente de agua, ubicación y zona climática.',
            icon: 'options-outline'
        },
        {
            number: '02',
            title: 'IA Sugiere Cultivos',
            desc: 'La inteligencia artificial analiza tu región y recomienda los cultivos ideales.',
            icon: 'hardware-chip-outline'
        },
        {
            number: '03',
            title: 'Selecciona tu Siembra',
            desc: 'Elige si ya sembraste o si estás por sembrar y recibe tips personalizados.',
            icon: 'leaf-outline'
        },
        {
            number: '04',
            title: 'Cronograma Inteligente',
            desc: 'Obtén tu línea de tiempo, programa actividades y fecha estimada de cosecha.',
            icon: 'calendar-outline'
        }
    ];

    setActiveScreen(id: string) {
        this.activeScreenId = id;
    }

    nextScreen() {
        const currentIndex = this.screens.findIndex(s => s.id === this.activeScreenId);
        if (currentIndex < this.screens.length - 1) {
            this.activeScreenId = this.screens[currentIndex + 1].id;
        }
    }

    get activeScreen() {
        return this.screens.find(s => s.id === this.activeScreenId) || this.screens[0];
    }
}
