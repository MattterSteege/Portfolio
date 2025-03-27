class ParticleSystem {
    constructor({
        container = document.body,
        gravity = 9.8,
        particleLifetime = { min: 500, max: 1500 },
        sizeRange = { min: 2, max: 10 },
        colors = ['#5E3FC3', '#3F51B5', '#2196F3'],
        wind = { x: 0, y: 0 }
                }) {
        this.container = container;
        this.gravity = gravity;
        this.particleLifetime = particleLifetime;
        this.sizeRange = sizeRange;
        this.colors = colors;
        this.wind = wind;
    }

    createParticle(x, y, options = {}) {
        const {
            angle = 45,  // Default 45-degree launch angle
            speed = 200, // Initial velocity in pixels/second
            burst = 50,  // Spread factor
            color = null // Optional specific color
        } = options;

        // Create particle element
        const particle = document.createElement('particle');
        // Append the element into the body
        document.body.appendChild(particle);

        // Random size within specified range
        const size = Math.floor(Math.random() *
                                (this.sizeRange.max - this.sizeRange.min + 1) +
                                this.sizeRange.min
        );

        // Set particle styles
        particle.style.position = 'absolute';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor =
            color || this.colors[Math.floor(Math.random() * this.colors.length)];

        // Convert angle to radians
        const angleRad = angle * Math.PI / 180;

        // Calculate initial velocities
        const vx = speed * Math.cos(angleRad);
        const vy = -speed * Math.sin(angleRad);

        // Randomize initial position slightly
        const startX = x + (Math.random() - 0.5) * burst;
        const startY = y + (Math.random() - 0.5) * burst;

        // Calculate lifetime
        const lifetime = Math.random() *
                         (this.particleLifetime.max - this.particleLifetime.min) +
                         this.particleLifetime.min;

        // Keyframes with gravity and wind effects
        const keyframes = [];
        const steps = 50; // Number of animation steps

        for (let i = 0; i <= steps; i++) {
            const t = i / steps * (lifetime / 1000); // time in seconds

            // Calculate positions with gravity and wind
            const dx = startX + (vx + this.wind.x) * t;
            const dy = startY + (vy + this.gravity) * t * t / 2;

            keyframes.push({
                transform: `translate(${dx}px, ${dy}px)`,
                opacity: 1 - i / steps
            });
        }

        // Animate the particle
        const animation = particle.animate(keyframes, {
            duration: lifetime,
            easing: 'linear',
            fill: 'forwards'
        });

        // Remove particle when animation completes
        animation.onfinish = () => {
            particle.remove();
        };

        return particle;
    }

    // Burst method to create multiple particles
    burst(x, y, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            // Vary angle and speed slightly for each particle
            const burstOptions = {
                ...options,
                angle: options.angle + (Math.random() - 0.5) * 20,
                speed: options.speed * (0.8 + Math.random() * 0.4)
            };
            this.createParticle(x, y, burstOptions);
        }
    }
}

// Expose the ParticleSystem for global use if needed
window.ParticleSystem = ParticleSystem;