// Solution:
class SelectorBorder extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.observeActiveAttribute();
    }

    observeActiveAttribute() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'active') {
                    this.render();
                }
            });
        });

        observer.observe(this, { attributes: true });
    }

    render() {
        const isActive = this.getAttribute('active') === 'true';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    animation: 0.5s ease-in-out infinite alternate border-animation;
                    
                    --distance: 8px;
                }
                
                @keyframes border-animation {
                    0% {
                        --distance: 8px;
                    }
                    100% {
                        --distance: 4px;
                    }
                }
              

                .corners {
                    display: ${isActive ? 'block' : 'none'};
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                }

                img {
                    position: absolute;
                    width: 50px;
                    height: 50px;
                }

                .corners .top-left {
                    top: calc(var(--distance) * -1);
                    left: calc(var(--distance) * -1);
                }

                .corners .top-right {
                    top: calc(var(--distance) * -1);
                    right: calc(var(--distance) * -1);
                }

                .corners .bottom-left {
                    bottom: calc(var(--distance) * -1);
                    left: calc(var(--distance) * -1);
                }

                .corners .bottom-right {
                    bottom: calc(var(--distance) * -1);
                    right: calc(var(--distance) * -1);
                }
            </style>
            
            <div class="corners">
                <img src="images/UI/3.png" class="top-right" alt="">
                <img src="images/UI/4.png" class="top-left" alt="">
                <img src="images/UI/1.png" class="bottom-left" alt="">
                <img src="images/UI/2.png" class="bottom-right" alt="">
            </div>
        `;
    }
}

// Define the custom element
customElements.define('selector-border', SelectorBorder);