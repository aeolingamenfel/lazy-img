/**
 * The template that is used for the shadow root for every copy of your element,
 * which houses the styles and layout for the element.
 */
const template = document.createElement("template");
template.innerHTML = `
    <style>
        :host {
            display: inline-block;
            width: 100%;
        }

        :host(:not([loaded])) {
            background: var(--lazy-img-placeholder-color, #ddd);
        }

        img {
            width: 100%;
        }
    </style>
`;

let io = null;

if(window.IntersectionObserver) {
    io = new IntersectionObserver(function(events) {
        for(let x = 0; x < events.length; x++) {
            const event = events[x];
    
            if(event.isIntersecting) {
                event.target.setAttribute("visible", "");
            }
        }
    });
}

/**
 * This is the class that controls each instance of your custom element.
 */
class LazyImage extends HTMLElement {
    /**
     * Part of the custom element spec. Returns an array of strings that are 
     * the names of attributes that this element observes/listens to.
     * 
     * @returns {Array} an array of strings, each of which representing an 
     *  attribute.
     */
    static get observedAttributes() {
        return ["src", "visible", "alt", "crossorigin", "height", "ismap",
            "longdesc", "sizes", "srcset", "usemap", "ratio"];
    };

    static get syncedAttributes() {
        return ["src", "visible", "alt", "crossorigin", "height", "ismap",
            "longdesc", "sizes", "srcset", "usemap"];
    }

    constructor() {
        super();

        // create shadow root for any children context
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // add any initial variables here
        this.imageElement = null;
        this.loaded = false;
        this.loading = false;
    }

    /**
     * Part of the custom element spec. Called after your element is attached to
     * the DOM. Do anything related to the element or its children here in most
     * cases.
     */
    connectedCallback() {
        if(io) {
            io.observe(this);
        } else {
            this.loadImage();
        }
    }

    /**
     * Part of the custom element spec. Called after your element is remove from
     * the DOM. Disconnect any listeners or anything else here.
     */
    disconnectedCallback() {
        if(io) {
            io.unobserve(this);
        }
    }

    /**
     * Part of the custom element spec. Called when one of the observed
     * attributes changes, either via setAttribute() or with the attribute being
     * manually set in the HTML.
     * 
     * @param {String} name the name of the attribute that changed
     * @param {Mixed} oldValue the previous value of the attribute
     * @param {Mixed} newValue the new value of the attribute
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue === newValue) {
            return;
        }

        switch(name) {
            case "visible":
                if(this.visible) {
                    this.loadImage();
                }
                break;
            default:
                this[name] = newValue;
                break;
        }
    }

    loadImage() {
        if(this.loaded || this.loading) {
            return;
        }

        // create the image tag
        this.imageElement = document.createElement("img");

        // add all relevant attributes
        for(let x = 0; x < LazyImage.syncedAttributes.length; x++) {
            const observedAttribute = LazyImage.syncedAttributes[x];

            if(this.hasAttribute(observedAttribute)) {
                this.imageElement.setAttribute(observedAttribute,
                    this[observedAttribute]);
            }
        }

        // apply listener to element
        this.imageElement.addEventListener("load", () => {
            this._imageFinishedLoading();
        });

        // make sure we can't double-load the image
        this.loading = true;
    }

    /**
     * Called automatically when the image finishes loading.
     */
    _imageFinishedLoading() {
        requestAnimationFrame(() => {
            this._unsetAspectRatio();
            this.shadowRoot.appendChild(this.imageElement);
            this.setAttribute("loaded", "");
        });
    }

    /**
     * Sets the aspect ratio of the image, so that it takes up the right space
     * inside of the parent container before the image shows up. The image will
     * also be forced to the appropriate aspect ratio. Should not be called from
     * outside of the class.
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    _setAspectRatio(width, height) {
        this.setAttribute("style", 
            `padding-top: calc(1 / (${width} / ${height}) * 100%);`);
    }

    /**
     * Unsets the aspect ratio that was applied. Should not be called from
     * outside the class.
     */
    _unsetAspectRatio() {
        this.removeAttribute("style");
    }

    syncAttribute(name, value, doParent = true) {
        if(this.imageElement) {
            if(value || value === 0) {
                this.imageElement.setAttribute(name, value);
            } else {
                this.imageElement.removeAttribute(name);
            }
        }

        if(doParent) {
            this.setAttribute(name, value);
        }
    }

    /* --- Getters and Setters --- */

    get ratio() {
        return this.getAttribute("ratio");
    }

    set ratio(value) {
        this.setAttribute("ratio", value);

        const splitValue = value.split(":");
        const width = splitValue[0];
        const height = splitValue[1];

        this._setAspectRatio(width, height);
    }

    get src() {
        return this._src;
    }

    set src(newValue) {
        this._src = newValue;
    }

    get alt() {
        return this.getAttribute("alt");
    }

    set alt(newValue) {
        this.syncAttribute("alt", newValue);
    }

    get crossorigin() {
        return this.getAttribute("crossorigin");
    }

    set crossorigin(newValue) {
        if(newValue !== 'anonymous' && newValue !== 'use-credentials') {
            console.warn("Invalid crossorigin value set.");
            return;
        }

        this.syncAttribute("crossorigin", newValue);
    }

    get height() {
        return parseInt(this.getAttribute("height"));
    }

    set height(newValue) {
        this.syncAttribute("height", newValue);
    }

    get ismap() {
        return this.hasAttribute("ismap");
    }

    set ismap(newValue) {
        this.syncAttribute("ismap", newValue);
    }

    get visible() {
        return this.hasAttribute("visible");
    }

    get longdesc() {
        return this.getAttribute("longdesc");
    }

    set longdesc(newValue) {
        this.syncAttribute("longdesc", newValue);
    }

    get sizes() {
        if(this.hasAttribute("sizes")) {
            return this.getAttribute("sizes").split(",");
        } else {
            return [];
        }
    }

    set sizes(newValue) {
        this.syncAttribute("sizes", newValue);
    }

    get srcset() {
        if(this.hasAttribute("srcset")) {
            return this.getAttribute("srcset").split(",");
        } else {
            return [];
        }
    }

    set srcset(newValue) {
        this.syncAttribute("srcset", newValue);
    }

    get usemap() {
        return this.getAttribute("usemap");
    }

    set usemap(newValue) {
        this.syncAttribute("usemap", newValue);
    }

    set visible(newValue) {
        if(newValue) {
            this.setAttribute("visible", "");
        } else {
            this.removeAttribute("visible");
        }
    }
}

customElements.define("lazy-img", LazyImage);
