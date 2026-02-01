import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-features',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './features.component.html',
    styleUrls: ['./features.component.scss']
})
export class FeaturesComponent implements AfterViewInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

    features = [
        {
            title: 'Monitoreo Inteligente',
            description: 'Sensores IoT miden humedad, pH y temperatura en tiempo real.',
            icon: 'cpu',
            color: 'linear-gradient(135deg, #00C9A7 0%, #00D4A1 100%)',
            size: 'large',
            delay: '0ms'
        },
        {
            title: 'Riego Autónomo',
            description: 'Automatización precisa basada en datos, 0% desperdicio.',
            icon: 'droplet',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            size: 'normal',
            delay: '100ms'
        },
        {
            title: 'Energía Solar',
            description: 'Tu huerto 100% autosuficiente.',
            icon: 'sun',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            size: 'normal',
            delay: '200ms'
        },
        {
            title: 'Control Total',
            description: 'App móvil para gestión remota desde cualquier parte del mundo.',
            icon: 'wifi',
            color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            size: 'wide',
            delay: '300ms'
        },
        {
            title: 'Analytics IA',
            description: 'Predicciones de cosecha y detección de plagas antes de que ocurran.',
            icon: 'bar-chart',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            size: 'tall',
            delay: '400ms'
        },
        {
            title: 'Seguridad 24/7',
            description: 'Alertas inmediatas de actividad.',
            icon: 'shield',
            color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
            size: 'normal',
            delay: '500ms'
        },
        // Duplicate for loop illusion (x2)
        {
            title: 'Monitoreo Inteligente',
            description: 'Sensores IoT miden humedad, pH y temperatura en tiempo real.',
            icon: 'cpu',
            color: 'linear-gradient(135deg, #00C9A7 0%, #00D4A1 100%)',
            size: 'large',
            delay: '0ms'
        },
        {
            title: 'Riego Autónomo',
            description: 'Automatización precisa basada en datos, 0% desperdicio.',
            icon: 'droplet',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            size: 'normal',
            delay: '100ms'
        },
        {
            title: 'Energía Solar',
            description: 'Tu huerto 100% autosuficiente.',
            icon: 'sun',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            size: 'normal',
            delay: '200ms'
        },
        {
            title: 'Control Total',
            description: 'App móvil para gestión remota desde cualquier parte del mundo.',
            icon: 'wifi',
            color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            size: 'wide',
            delay: '300ms'
        },
        {
            title: 'Analytics IA',
            description: 'Predicciones de cosecha y detección de plagas antes de que ocurran.',
            icon: 'bar-chart',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            size: 'tall',
            delay: '400ms'
        },
        {
            title: 'Seguridad 24/7',
            description: 'Alertas inmediatas de actividad.',
            icon: 'shield',
            color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
            size: 'normal',
            delay: '500ms'
        }
    ];

    private animationId: number | null = null;
    private isDown = false;
    private startX: number = 0;
    private scrollLeft: number = 0;
    private autoScrollSpeed = 0.5; // pixels per frame

    ngAfterViewInit() {
        this.startAutoScroll();
    }

    ngOnDestroy() {
        this.stopAutoScroll();
    }

    // --- AUTO SCROLL ---
    startAutoScroll() {
        // Prevent multiple loops
        if (this.animationId) return;

        const animate = () => {
            if (!this.scrollContainer) return;
            const el = this.scrollContainer.nativeElement;

            // Increment scroll
            el.scrollLeft += this.autoScrollSpeed;

            // Infinite loop logic: If we reached the middle (end of first set), snap back to start
            // We assume the content is duplicated. reset when we scroll nearly half the width
            if (el.scrollLeft >= (el.scrollWidth / 2)) {
                el.scrollLeft = 0;
            }

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    stopAutoScroll() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // --- MOUSE DRAG HANDLERS ---
    onMouseDown(e: MouseEvent) {
        this.isDown = true;
        this.stopAutoScroll(); // Stop auto moving while dragging
        this.scrollContainer.nativeElement.classList.add('active');
        this.startX = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
        this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
    }

    onMouseLeave() {
        this.isDown = false;
        this.scrollContainer.nativeElement.classList.remove('active');
        this.startAutoScroll(); // Resume auto
    }

    onMouseUp() {
        this.isDown = false;
        this.scrollContainer.nativeElement.classList.remove('active');
        this.startAutoScroll(); // Resume auto
    }

    onMouseMove(e: MouseEvent) {
        if (!this.isDown) return;
        e.preventDefault();
        const x = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
        const walk = (x - this.startX) * 2; // Scroll-fast factor
        this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - walk;
    }
}
