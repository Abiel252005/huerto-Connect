export interface FloatingLeaf {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    driftX: number;
    driftY: number;
    opacity: number;
    rotate: number;
}

export interface ParallaxOffset {
    x: number;
    y: number;
}

function seededRandomFactory(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

export function createFloatingLeaves(count: number, seed = 1): FloatingLeaf[] {
    const random = seededRandomFactory(seed);

    return Array.from({ length: count }, () => {
        const duration = 14 + random() * 12;

        return {
            x: random() * 100,
            y: -15 + random() * 20,
            size: 14 + random() * 16,
            duration,
            delay: -(random() * duration),
            driftX: (random() - 0.5) * 18,
            driftY: 8 + random() * 14,
            opacity: 0.22 + random() * 0.32,
            rotate: random() * 360
        };
    });
}

export function calculateParallaxOffset(event: PointerEvent, intensity = 18): ParallaxOffset {
    const element = event.currentTarget as HTMLElement | null;
    if (!element) {
        return { x: 0, y: 0 };
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return { x: 0, y: 0 };
    }

    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;

    return {
        x: Number((relativeX * intensity).toFixed(2)),
        y: Number((relativeY * intensity).toFixed(2))
    };
}
