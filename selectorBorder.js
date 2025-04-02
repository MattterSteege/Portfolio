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
                    width: 95px;
                    height: 22px;
                    left: 2px;
                    top: 1px;
                    pointer-events: none;
                    animation: 0.5s ease-in-out infinite alternate border-animation;
                    
                    --distance: 0px;
                }
                
                @keyframes border-animation {
                    0% {
                        --distance: 0px;
                    }
                    100% {
                        --distance: 1px;
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
                    width: 5px;
                    height: 5px;
                }

                .corners .top-left {
                    top: calc(var(--distance) * -1);
                    left: calc(var(--distance) * -1);
                    rotate: 90deg;
                }

                .corners .top-right {
                    top: calc(var(--distance) * -1);
                    right: calc(var(--distance) * -1);
                    rotate: 180deg;
                }

                .corners .bottom-left {
                    bottom: calc(var(--distance) * -1);
                    left: calc(var(--distance) * -1);
                    rotate: 0deg;
                }

                .corners .bottom-right {
                    bottom: calc(var(--distance) * -1);
                    right: calc(var(--distance) * -1);
                    rotate: 270deg;
                }
            </style>
            
            <div class="corners">
                <img src="images/UI/1.svg" class="top-right" alt="">
                <img src="images/UI/1.svg" class="top-left" alt="">
                <img src="images/UI/1.svg" class="bottom-left" alt="">
                <img src="images/UI/1.svg" class="bottom-right" alt="">
            </div>
        `;
    }
}

// Define the custom element
customElements.define('selector-border', SelectorBorder);