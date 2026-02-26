(function () {
    if (window.__lamna_injected) return;
    window.__lamna_injected = true;

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const container = document.createElement('div');
    container.id = 'lamna-container';

    let currentTheme = 'neon'; // Default to start

    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'ambar') {
            container.setAttribute('data-lamna-theme', 'ambar');
        } else {
            container.removeAttribute('data-lamna-theme');
        }
        drawRulers(); // Redraw canvas rulers with new colors if needed
    }

    if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['lamnaTheme'], function (result) {
            applyTheme(result.lamnaTheme || 'neon');
        });

        chrome.storage.onChanged.addListener(function (changes, namespace) {
            if (changes.lamnaTheme) {
                applyTheme(changes.lamnaTheme.newValue);
            }
        });
    }

    const crosshairX = document.createElement('div');
    crosshairX.id = 'lamna-crosshair-x';
    const crosshairY = document.createElement('div');
    crosshairY.id = 'lamna-crosshair-y';

    const infoBox = document.createElement('div');
    infoBox.id = 'lamna-info-box';
    infoBox.style.display = 'none';

    // Rulers using Canvas
    const rulerTop = document.createElement('canvas');
    rulerTop.id = 'lamna-ruler-top';
    const rulerLeft = document.createElement('canvas');
    rulerLeft.id = 'lamna-ruler-left';

    container.appendChild(crosshairX);
    container.appendChild(crosshairY);
    container.appendChild(infoBox);
    container.appendChild(rulerTop);
    container.appendChild(rulerLeft);

    document.documentElement.appendChild(container);

    let hoveredElement = null;
    let isCtrlPressed = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Track Control key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Control' && !isCtrlPressed) {
            isCtrlPressed = true;
            if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control' && isCtrlPressed) {
            isCtrlPressed = false;
            if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
        }
    }, true);

    // Ruler Drawing Logic
    function drawRulers() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        rulerTop.width = w * dpr;
        rulerTop.height = 20 * dpr;
        rulerLeft.width = 20 * dpr;
        rulerLeft.height = h * dpr;

        const ctxTop = rulerTop.getContext('2d');
        const ctxLeft = rulerLeft.getContext('2d');

        ctxTop.scale(dpr, dpr);
        ctxLeft.scale(dpr, dpr);

        // Get color dynamically from CSS var based on theme
        const tempEl = document.createElement('div');
        container.appendChild(tempEl);
        let color = getComputedStyle(tempEl).getPropertyValue('--lamna-ruler-color').trim() || 'rgba(0, 255, 255, 0.8)';
        let textColor = getComputedStyle(tempEl).getPropertyValue('--lamna-text-color').trim() || '#fff';
        container.removeChild(tempEl);

        // Draw Top Ruler
        ctxTop.clearRect(0, 0, w, 20);
        ctxTop.fillStyle = textColor;
        ctxTop.strokeStyle = color;
        ctxTop.font = '9px "Share Tech Mono", monospace';
        ctxTop.textAlign = 'center';
        ctxTop.textBaseline = 'top';
        ctxTop.beginPath();

        for (let x = 0; x <= w; x += 10) {
            if (x % 100 === 0) {
                ctxTop.moveTo(x, 0);
                ctxTop.lineTo(x, 20);
                if (x > 0) ctxTop.fillText(x.toString(), x, 1);
            } else if (x % 50 === 0) {
                ctxTop.moveTo(x, 0);
                ctxTop.lineTo(x, 10);
            } else {
                ctxTop.moveTo(x, 0);
                ctxTop.lineTo(x, 5);
            }
        }
        ctxTop.stroke();

        // Draw Left Ruler
        ctxLeft.clearRect(0, 0, 20, h);
        ctxLeft.fillStyle = textColor;
        ctxLeft.strokeStyle = color;
        ctxLeft.font = '9px "Share Tech Mono", monospace';
        ctxLeft.textAlign = 'right';
        ctxLeft.textBaseline = 'middle';
        ctxLeft.beginPath();

        for (let y = 0; y <= h; y += 10) {
            if (y % 100 === 0) {
                ctxLeft.moveTo(0, y);
                ctxLeft.lineTo(20, y);
                if (y > 0) {
                    ctxLeft.save();
                    ctxLeft.translate(10, y);
                    ctxLeft.rotate(-Math.PI / 2);
                    ctxLeft.fillText(y.toString(), 0, -2);
                    ctxLeft.restore();
                }
            } else if (y % 50 === 0) {
                ctxLeft.moveTo(0, y);
                ctxLeft.lineTo(10, y);
            } else {
                ctxLeft.moveTo(0, y);
                ctxLeft.lineTo(5, y);
            }
        }
        ctxLeft.stroke();
    }

    // Draw once on load and on resize
    setTimeout(drawRulers, 50);
    window.addEventListener('resize', drawRulers);

    function getElementHierarchy(el) {
        let path = [];
        let current = el;
        while (current && current !== document.body && current !== document.documentElement && path.length < 4) {
            let nodeStr = current.tagName.toLowerCase();
            if (current.id) nodeStr += '#' + current.id;
            else if (current.className && typeof current.className === 'string') {
                let cls = current.className.replace('lamna-hovered-element', '').trim().split(/\s+/)[0];
                if (cls) nodeStr += '.' + cls;
            }
            path.unshift(nodeStr);
            current = current.parentElement;
        }
        return path.join(' > ');
    }

    function updateInfoBox(target, mouseX, mouseY) {
        const rect = target.getBoundingClientRect();
        const tagName = target.tagName.toLowerCase();

        let classes = '';
        if (typeof target.className === 'string') {
            classes = target.className.replace('lamna-hovered-element', '').trim();
        }

        let boxHTML = `<div class="lamna-coords">X:${mouseX} | Y:${mouseY}</div><br>`;
        boxHTML += `<span class="lamna-tag">&lt;${tagName}&gt;</span>`;

        if (classes) {
            const formattedClasses = classes.split(/\s+/).filter(Boolean).map(c => `.${c}`).join(' ');
            boxHTML += `<br><span class="lamna-class">${formattedClasses}</span>`;
        }
        boxHTML += `<br><span class="lamna-dims">W: ${Math.round(rect.width)}px | H: ${Math.round(rect.height)}px</span>`;

        // Add advanced info if Ctrl is pressed
        if (isCtrlPressed) {
            const computed = window.getComputedStyle(target);
            const hierarchy = getElementHierarchy(target);

            boxHTML += `<div class="lamna-advanced">`;
            boxHTML += `<span class="lamna-advanced-title">Hierarquia:</span>`;
            boxHTML += `<span class="lamna-hierachy">${hierarchy}</span><br>`;

            boxHTML += `<b>Display:</b> ${computed.display}<br>`;
            boxHTML += `<b>Position:</b> ${computed.position}<br>`;
            if (computed.margin !== '0px') boxHTML += `<b>Margin:</b> ${computed.margin}<br>`;
            if (computed.padding !== '0px') boxHTML += `<b>Padding:</b> ${computed.padding}<br>`;
            boxHTML += `<b>Font:</b> ${computed.fontSize} ${computed.fontFamily.split(',')[0]}<br>`;
            if (computed.color !== 'rgba(0, 0, 0, 0)') {
                // rough rgb to hex
                boxHTML += `<b>Color:</b> <span style="display:inline-block;width:8px;height:8px;background:${computed.color};border:1px solid #000;border-radius:2px;"></span> ${computed.color}<br>`;
            }
            boxHTML += `</div>`;
        }

        infoBox.innerHTML = boxHTML;
        infoBox.style.display = 'block';

        const infoBoxRect = infoBox.getBoundingClientRect();
        let left = mouseX + 20;
        let top = mouseY + 20;

        if (left + infoBoxRect.width > window.innerWidth) {
            left = mouseX - infoBoxRect.width - 20;
        }
        if (top + infoBoxRect.height > window.innerHeight) {
            top = mouseY - infoBoxRect.height - 20;
        }

        if (left < 10) left = 10;
        if (top < 10) top = 10;

        infoBox.style.left = `${left}px`;
        infoBox.style.top = `${top}px`;
    }

    document.addEventListener('mousemove', (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        crosshairX.style.left = `${lastMouseX}px`;
        crosshairY.style.top = `${lastMouseY}px`;

        const target = e.target;

        if (container.contains(target) || target === container || target === document.documentElement || target === document.body || target.id === 'lamna-ruler-top' || target.id === 'lamna-ruler-left') {
            infoBox.style.display = 'none';
            if (hoveredElement) {
                hoveredElement.classList.remove('lamna-hovered-element');
                hoveredElement = null;
            }
            return;
        }

        if (target !== hoveredElement) {
            if (hoveredElement) {
                hoveredElement.classList.remove('lamna-hovered-element');
            }
            hoveredElement = target;
            hoveredElement.classList.add('lamna-hovered-element');
        }

        updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
    }, true);

    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget) {
            crosshairX.style.display = 'none';
            crosshairY.style.display = 'none';
            infoBox.style.display = 'none';
            if (hoveredElement) {
                hoveredElement.classList.remove('lamna-hovered-element');
                hoveredElement = null;
            }
        }
    }, true);

    document.addEventListener('mouseover', (e) => {
        crosshairX.style.display = 'block';
        crosshairY.style.display = 'block';
    }, true);

})();
