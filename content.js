(function () {
    if (window.__lamna_injected) return;
    window.__lamna_injected = true;

    // The external font loading was removed to prevent CSP side-effects on strict websites (like GitHub).
    // The CSS already falls back gracefully to 'Courier New' or standard system monospace.

    const container = document.createElement('div');
    container.id = 'lamna-container';

    let currentTheme = 'neon'; // Default to start

    function getBrightness(r, g, b) {
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    function parseColor(colorStr) {
        const div = document.createElement('div');
        div.style.color = colorStr;
        document.body.appendChild(div);
        const style = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        const match = style.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
        }
        return { r: 0, g: 0, b: 0 };
    }

    function applyTheme(theme) {
        currentTheme = theme;

        // Cleanup inline styles from dynamic theme
        const rootVars = ['--lamna-bg', '--lamna-text-color', '--lamna-tag-color', '--lamna-class-color', '--lamna-dims-color', '--lamna-ruler-color', '--lamna-crosshair-color', '--lamna-hover-outline', '--lamna-hover-bg', '--lamna-coords-bg', '--lamna-coords-color', '--lamna-separator', '--lamna-extra-text'];
        rootVars.forEach(v => document.documentElement.style.removeProperty(v));

        if (theme === 'ambar' || theme === 'matrix') {
            document.documentElement.setAttribute('data-lamna-theme', theme);
        } else if (theme === 'dynamic') {
            document.documentElement.removeAttribute('data-lamna-theme');

            // Try to find a theme color
            let baseColorStr = null;
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme && metaTheme.content) {
                baseColorStr = metaTheme.content;
            } else {
                const nav = document.querySelector('nav, header');
                baseColorStr = window.getComputedStyle(nav || document.body).backgroundColor;
                if (baseColorStr === 'rgba(0, 0, 0, 0)' || baseColorStr === 'transparent') {
                    baseColorStr = '#3b82f6'; // fallback blue
                }
            }

            const baseColor = parseColor(baseColorStr);
            const brightness = getBrightness(baseColor.r, baseColor.g, baseColor.b);
            const isDarkBg = brightness < 128;

            // Generate palette
            const primary = `${baseColor.r}, ${baseColor.g}, ${baseColor.b}`;
            const secondary = isDarkBg ? '255, 255, 255' : '15, 25, 35';
            const highlight = isDarkBg ? '255, 255, 0' : '0, 0, 255';

            // Apply variables directly to root style
            const style = document.documentElement.style;
            style.setProperty('--lamna-bg', `rgba(${primary}, 0.9)`);
            style.setProperty('--lamna-text-color', `rgb(${secondary})`);
            style.setProperty('--lamna-tag-color', `rgb(${secondary})`);
            style.setProperty('--lamna-class-color', `rgba(${secondary}, 0.8)`);
            style.setProperty('--lamna-dims-color', `rgb(${highlight})`);
            style.setProperty('--lamna-ruler-color', `rgba(${primary}, 0.8)`);
            style.setProperty('--lamna-crosshair-color', `rgba(${primary}, 0.6)`);
            style.setProperty('--lamna-hover-outline', `rgb(${primary})`);
            style.setProperty('--lamna-hover-bg', `rgba(${primary}, 0.1)`);
            style.setProperty('--lamna-coords-bg', `rgba(${secondary}, 0.8)`);
            style.setProperty('--lamna-coords-color', `rgb(${primary})`);
            style.setProperty('--lamna-separator', `rgba(${secondary}, 0.2)`);
            style.setProperty('--lamna-extra-text', `rgba(${secondary}, 0.9)`);

        } else {
            document.documentElement.removeAttribute('data-lamna-theme');
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
    let isFrozen = false;
    let isActive = true;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Toggle freeze on click when Ctrl is pressed
    document.addEventListener('click', (e) => {
        if (isCtrlPressed) {
            e.preventDefault();
            e.stopPropagation();
            isFrozen = !isFrozen;
            if (isFrozen) {
                infoBox.classList.add('lamna-frozen');
            } else {
                infoBox.classList.remove('lamna-frozen');
                if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
            }
        } else if (isFrozen && !infoBox.contains(e.target)) {
            // Unfreeze if clicking away
            isFrozen = false;
            infoBox.classList.remove('lamna-frozen');
        }
    }, true);

    // Track Control key
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'l' && e.ctrlKey && e.shiftKey) {
            isActive = !isActive;
            container.style.display = isActive ? 'block' : 'none';
            if (!isActive && hoveredElement) {
                hoveredElement.classList.remove('lamna-hovered-element');
                hoveredElement = null;
                isFrozen = false;
                infoBox.classList.remove('lamna-frozen');
            }
            return;
        }

        if (e.key === 'Control' && !isCtrlPressed) {
            isCtrlPressed = true;
            if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control' && isCtrlPressed) {
            isCtrlPressed = false;
            if (hoveredElement && !isFrozen) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
        }
    }, true);

    // Ruler Drawing Logic
    function drawRulers() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        rulerTop.width = w * dpr;
        rulerTop.height = 16 * dpr;
        rulerLeft.width = 16 * dpr;
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
        ctxTop.clearRect(0, 0, w, 16);
        ctxTop.fillStyle = textColor;
        ctxTop.strokeStyle = color;
        ctxTop.font = '10px "Share Tech Mono", monospace';
        ctxTop.textAlign = 'center';
        ctxTop.textBaseline = 'top';
        ctxTop.beginPath();

        for (let x = 0; x <= w; x += 10) {
            if (x % 100 === 0) {
                ctxTop.moveTo(x, 0);
                ctxTop.lineTo(x, 16);
                if (x > 0) ctxTop.fillText(x.toString(), x, 1);
            } else if (x % 50 === 0) {
                ctxTop.moveTo(x, 0);
                ctxTop.lineTo(x, 8);
            } else {
                ctxTop.moveTo(x, 0);
                ctxTop.lineTo(x, 4);
            }
        }
        ctxTop.stroke();

        // Draw Left Ruler
        ctxLeft.clearRect(0, 0, 16, h);
        ctxLeft.fillStyle = textColor;
        ctxLeft.strokeStyle = color;
        ctxLeft.font = '10px "Share Tech Mono", monospace';
        ctxLeft.textAlign = 'right';
        ctxLeft.textBaseline = 'middle';
        ctxLeft.beginPath();

        for (let y = 0; y <= h; y += 10) {
            if (y % 100 === 0) {
                ctxLeft.moveTo(0, y);
                ctxLeft.lineTo(16, y);
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

            // Positioning details if not static
            if (computed.position !== 'static') {
                const positions = [];
                if (computed.top !== 'auto') positions.push(`T:${computed.top}`);
                if (computed.right !== 'auto') positions.push(`R:${computed.right}`);
                if (computed.bottom !== 'auto') positions.push(`B:${computed.bottom}`);
                if (computed.left !== 'auto') positions.push(`L:${computed.left}`);
                if (positions.length > 0) boxHTML += `<b>Offset:</b> ${positions.join(' ')}<br>`;
                boxHTML += `<b>Z-Index:</b> ${computed.zIndex}<br>`;
            }

            // Box Model
            if (computed.margin !== '0px') boxHTML += `<b>Margin:</b> ${computed.margin}<br>`;
            if (computed.padding !== '0px') boxHTML += `<b>Padding:</b> ${computed.padding}<br>`;
            boxHTML += `<b>Box-Sizing:</b> ${computed.boxSizing}<br>`;

            // Typography
            boxHTML += `<b>Font:</b> ${computed.fontSize} ${computed.fontFamily.split(',')[0]}<br>`;
            if (computed.color !== 'rgba(0, 0, 0, 0)') {
                boxHTML += `<b>Color:</b> <span style="display:inline-block;width:8px;height:8px;background:${computed.color};border:1px solid #000;border-radius:2px;"></span> ${computed.color}<br>`;
            }
            if (computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                boxHTML += `<b>Bg-Color:</b> <span style="display:inline-block;width:8px;height:8px;background:${computed.backgroundColor};border:1px solid #000;border-radius:2px;"></span> ${computed.backgroundColor}<br>`;
            }
            if (computed.opacity !== '1') boxHTML += `<b>Opacity:</b> ${computed.opacity}<br>`;

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
        if (!isActive || isFrozen) return;

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
        if (!isActive) return;
        if (!e.relatedTarget && !isFrozen) {
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
        if (!isActive || isFrozen) return;
        crosshairX.style.display = 'block';
        crosshairY.style.display = 'block';
    }, true);

})();
