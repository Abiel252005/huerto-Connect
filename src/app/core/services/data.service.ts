import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface Testimonial {
    name: string;
    role: string;
    location: string;
    text: string;
    rating: number;
    image: string;
    cover: string;
}

export interface FAQ {
    question: string;
    answer: string;
    open?: boolean;
}

export interface ContactData {
    name: string;
    email: string;
    phone?: string;
    message: string;
}

export interface HeroData {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: string; label: string }[];
    backgroundImage: string;
}

export interface HeaderLink {
    label: string;
    sectionId: string;
}

@Injectable({
    providedIn: 'root'
})
export class DataService {

    constructor() { }

    getHeaderLinks(): Observable<HeaderLink[]> {
        const links: HeaderLink[] = [
            { label: 'Nosotros', sectionId: 'about' },
            { label: 'Servicios', sectionId: 'services' },
            { label: 'Proceso', sectionId: 'process' },
            { label: 'Testimonios', sectionId: 'testimonials' },
            { label: 'FAQ', sectionId: 'faq' }
        ];
        return of(links).pipe(delay(100));
    }

    getHeroData(): Observable<HeroData> {
        const data: HeroData = {
            badge: 'Agricultura Inteligente',
            title: 'Tu Huerto,',
            highlight: 'Infinitas Posibilidades',
            subtitle: 'Cosecha más, usa menos. Tecnología que respeta la tierra y multiplica tus resultados.',
            ctaPrimary: 'Comenzar Ahora →',
            ctaSecondary: 'Ver Demo',
            stats: [
                { value: '500+', label: 'Huertos Activos' },
                { value: '98%', label: 'Satisfacción' },
                { value: '24/7', label: 'Monitoreo' }
            ],
            backgroundImage: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        };
        return of(data).pipe(delay(200));
    }

    getTestimonials(): Observable<Testimonial[]> {
        const data: Testimonial[] = [
            {
                name: 'Carlos Ramírez',
                role: 'Productor de Tomate',
                location: 'Veracruz',
                text: 'Duplicamos nuestra producción en 6 meses. El sistema de riego automático me ahorra 3 horas diarias. Increíble inversión.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1583160867452-944a1ac94e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                cover: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            {
                name: 'María González',
                role: 'Agricultora Orgánica',
                location: 'Xalapa',
                text: 'Como productora orgánica, la detección temprana de plagas cambió todo. Reduje pérdidas en 85% sin usar químicos.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                cover: 'https://images.unsplash.com/photo-1625246333195-098705332fc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            {
                name: 'José Hernández',
                role: 'Invernadero Familiar',
                location: 'Córdoba',
                text: 'ROI en menos de 18 meses. Ahora compito con grandes productores. La tecnología niveló el campo de juego.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                cover: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            }
        ];
        return of(data).pipe(delay(500)); // Simulate network latency
    }

    getFAQs(): Observable<FAQ[]> {
        const data: FAQ[] = [
            { question: '¿Qué tamaño de huerto necesito para usar Huerto Connect?', answer: 'Nuestra tecnología es escalable. Funciona perfectamente desde pequeños invernaderos familiares de 500m² hasta grandes extensiones de cientos de hectáreas.' },
            { question: '¿Cuánto cuesta la implementación?', answer: 'El costo varía según el tamaño y necesidades específicas. Ofrecemos planes iniciales muy accesibles. Contáctanos para una cotización a medida.' },
            { question: '¿Necesito internet en mi huerto?', answer: 'Idealmente sí, pero nuestros sensores tienen almacenamiento local y pueden sincronizarse cuando se restablece la conexión o mediante nodos LoRaWAN de largo alcance.' },
            { question: '¿Qué pasa si falla el sistema?', answer: 'Contamos con redundancia y alertas automáticas. Si un sensor falla, el sistema te notifica inmediatamente. Además, nuestro soporte técnico está disponible para ayudarte.' },
            { question: '¿Es difícil de usar?', answer: 'Diseñamos la plataforma pensando en la facilidad de uso. Cualquier persona con un smartphone puede monitorear su huerto. Incluimos capacitación inicial gratuita.' },
            { question: '¿Funciona con cualquier tipo de cultivo?', answer: 'Sí, la plataforma permite configurar parámetros específicos para más de 50 tipos de cultivos diferentes, desde hortalizas hasta frutales.' },
            { question: '¿Cuánto tiempo toma la instalación?', answer: 'Una instalación promedio toma entre 3 y 7 días hábiles, dependiendo de la extensión del terreno y la complejidad del sistema de riego.' },
            { question: '¿Ofrecen garantías de resultados?', answer: 'Garantizamos el funcionamiento de nuestra tecnología y brindamos acompañamiento para que logres tus objetivos de productividad y ahorro.' }
        ];
        return of(data).pipe(delay(300));
    }

    sendContactForm(data: ContactData): Observable<boolean> {
        console.log('Sending contact data to API:', data);
        return of(true).pipe(delay(1500)); // Simulate API call time
    }
}
