(function () {
    if (window.__lamna_injected) return;
    window.__lamna_injected = true;

    // Inject font dynamically, bypassing the __MSG_@@extension_id__ CSS parsing bug
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
        @font-face {
            font-family: 'Share Tech Mono';
            src: url('${chrome.runtime.getURL("fonts/ShareTechMono.woff2")}') format('woff2');
            font-weight: normal;
            font-style: normal;
        }
    `;
    document.head.appendChild(fontStyle);

    const container = document.createElement('div');
    container.id = 'lamna-container';

    let currentTheme = 'dynamic'; // Default to start
    let currentWcag = 'AA'; // Default WCAG level
    let isActive = true; // Is the extension HUD toggled on?

    function getBrightness(r, g, b) {
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    function getEffectiveBackgroundColor(el) {
        let current = el;
        while (current && current !== document) {
            let bg = window.getComputedStyle(current).backgroundColor;
            if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                return bg;
            }
            current = current.parentElement;
        }
        return 'rgb(255, 255, 255)'; // fallback to white if nothing found
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

    function getLuminance(r, g, b) {
        const a = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // Try to extract :hover styles from document stylesheets
    function getHoverStyles(el) {
        let hoverBg = null;
        let hoverColor = null;
        try {
            for (let i = 0; i < document.styleSheets.length; i++) {
                let sheet = document.styleSheets[i];
                try {
                    let rules = sheet.cssRules || sheet.rules;
                    if (!rules) continue;
                    for (let j = 0; j < rules.length; j++) {
                        let rule = rules[j];
                        if (rule.type === 1 && rule.selectorText && rule.selectorText.includes(':hover')) {
                            let selectors = rule.selectorText.split(',');
                            for (let sel of selectors) {
                                if (sel.includes(':hover')) {
                                    // Remove pseudo-classes to check if the base element matches
                                    let cleanSel = sel.replace(/:hover/g, '').replace(/:focus/g, '').replace(/:active/g, '').trim();
                                    // We also don't want empty selectors matching everything
                                    if (cleanSel && cleanSel !== '*' && el.matches(cleanSel)) {
                                        if (rule.style.backgroundColor && rule.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && rule.style.backgroundColor !== 'transparent' && rule.style.backgroundColor !== 'initial') {
                                            hoverBg = rule.style.backgroundColor;
                                        }
                                        if (rule.style.color && rule.style.color !== 'initial') {
                                            hoverColor = rule.style.color;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Ignore CORS issues on external stylesheets
                }
            }
        } catch (e) { }
        return { hoverBg, hoverColor };
    }

    function getBaseStyleColors(el) {
        let bgColor = 'rgba(0, 0, 0, 0)';
        let colorStr = 'rgb(0, 0, 0)';
        if (!el.parentNode) return { bgColor, colorStr };

        const clone = el.cloneNode(false);
        clone.classList.remove('lamna-hovered-element');
        clone.style.setProperty('transition', 'none', 'important');
        clone.style.setProperty('animation', 'none', 'important');
        clone.style.setProperty('position', 'absolute', 'important');
        clone.style.setProperty('visibility', 'hidden', 'important');
        clone.style.setProperty('pointer-events', 'none', 'important');
        clone.style.setProperty('z-index', '-999999', 'important');

        try {
            el.parentNode.insertBefore(clone, el);
            const comp = window.getComputedStyle(clone);
            bgColor = comp.backgroundColor;
            colorStr = comp.color;
            el.parentNode.removeChild(clone);
        } catch (e) { }

        return { bgColor, colorStr };
    }

    function getContrastRatio(color1, color2) {
        const lum1 = getLuminance(color1.r, color1.g, color1.b);
        const lum2 = getLuminance(color2.r, color2.g, color2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    function applyTheme(theme) {
        currentTheme = theme;

        // Cleanup inline styles from dynamic theme
        const rootVars = ['--lamna-bg', '--lamna-text-color', '--lamna-tag-color', '--lamna-class-color', '--lamna-dims-color', '--lamna-ruler-color', '--lamna-crosshair-color', '--lamna-hover-outline', '--lamna-hover-bg', '--lamna-coords-bg', '--lamna-coords-color', '--lamna-separator', '--lamna-extra-text'];
        rootVars.forEach(v => document.documentElement.style.removeProperty(v));

        if (theme === 'ambar' || theme === 'matrix' || theme === 'dracula' || theme === 'ambar-crt') {
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
        chrome.storage.sync.get(['lamnaTheme', 'lamnaWcag', 'lamnaZoom', 'lamnaActive'], function (result) {
            applyTheme(result.lamnaTheme || 'dynamic');
            currentWcag = result.lamnaWcag || 'AA';
            document.documentElement.style.setProperty('--lamna-zoom', result.lamnaZoom || 1.0);
            if (result.lamnaActive !== undefined) {
                isActive = result.lamnaActive;
                container.style.display = isActive ? 'block' : 'none';
            }
        });

        chrome.storage.onChanged.addListener(function (changes, namespace) {
            if (changes.lamnaTheme) {
                applyTheme(changes.lamnaTheme.newValue);
            }
            if (changes.lamnaWcag) {
                currentWcag = changes.lamnaWcag.newValue;
            }
            if (changes.lamnaZoom) {
                document.documentElement.style.setProperty('--lamna-zoom', changes.lamnaZoom.newValue);
            }
            if (changes.lamnaActive) {
                isActive = changes.lamnaActive.newValue;
                container.style.display = isActive ? 'block' : 'none';
                if (!isActive) {
                    isFrozen = false;
                    infoBox.classList.remove('lamna-frozen');
                }
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
    let lastMouseX = 0;
    let lastMouseY = 0;
    let frozenOffsetX = 0;
    let frozenOffsetY = 0;
    let updateInterval = null;

    // Unfreeze if clicking away
    document.addEventListener('click', (e) => {
        if (isFrozen && !infoBox.contains(e.target)) {
            isFrozen = false;
            infoBox.classList.remove('lamna-frozen');
            if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
        }
    }, true);

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;

        // Toggle Active
        if (e.key.toLowerCase() === 'l' && e.altKey && !e.ctrlKey && !e.shiftKey) {
            isActive = !isActive;
            container.style.display = isActive ? 'block' : 'none';
            chrome.storage.sync.set({ lamnaActive: isActive });
            if (!isActive && hoveredElement) {
                hoveredElement.classList.remove('lamna-hovered-element');
                hoveredElement = null;
                isFrozen = false;
                infoBox.classList.remove('lamna-frozen');
            }
            return;
        }

        // Toggle Freeze with 'L' key
        if (e.key.toLowerCase() === 'l' && isActive && !isInput && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            isFrozen = !isFrozen;
            if (isFrozen) {
                infoBox.classList.add('lamna-frozen');
                if (hoveredElement) {
                    const rect = hoveredElement.getBoundingClientRect();
                    frozenOffsetX = lastMouseX - rect.left;
                    frozenOffsetY = lastMouseY - rect.top;
                }
            } else {
                infoBox.classList.remove('lamna-frozen');
                if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
            }
            return;
        }

        if (e.key === 'Control' && !isCtrlPressed) {
            isCtrlPressed = true;
            if (hoveredElement) updateInfoBox(hoveredElement, lastMouseX, lastMouseY);

            // Poll for dynamic changes (like :hover, :active, transitions) while Ctrl is held
            if (!updateInterval) {
                updateInterval = setInterval(() => {
                    if (hoveredElement && !isFrozen) {
                        updateInfoBox(hoveredElement, lastMouseX, lastMouseY);
                    }
                }, 100);
            }
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control' && isCtrlPressed) {
            isCtrlPressed = false;
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
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
            // Remove hover class to read original style computed values accurately
            const hadHoverClass = target.classList.contains('lamna-hovered-element');
            if (hadHoverClass) target.classList.remove('lamna-hovered-element');

            const computed = window.getComputedStyle(target);

            // Capture these completely while the hover class is off!
            const bgColor = computed.backgroundColor;
            const txtColorStr = computed.color;
            const effectiveBgColor = getEffectiveBackgroundColor(target);
            const baseStyles = getBaseStyleColors(target);

            const hierarchy = getElementHierarchy(target);

            // Positioning details if not static
            const displayStr = computed.display;
            const positionStr = computed.position;
            const topStr = computed.top;
            const rightStr = computed.right;
            const bottomStr = computed.bottom;
            const leftStr = computed.left;
            const zIndexStr = computed.zIndex;
            const marginStr = computed.margin;
            const paddingStr = computed.padding;
            const boxSizingStr = computed.boxSizing;
            const fontSizeStr = computed.fontSize;
            const fontFamilyStr = computed.fontFamily;
            const opacityStr = computed.opacity;

            // Reapply hover class after taking our snapshot
            if (hadHoverClass) target.classList.add('lamna-hovered-element');

            boxHTML += `<div class="lamna-advanced">`;
            boxHTML += `<span class="lamna-advanced-title">Hierarchy:</span>`;
            boxHTML += `<span class="lamna-hierachy">${hierarchy}</span><br>`;

            boxHTML += `<b>Display:</b> ${displayStr}<br>`;
            boxHTML += `<b>Position:</b> ${positionStr}<br>`;

            if (positionStr !== 'static') {
                const positions = [];
                if (topStr !== 'auto') positions.push(`T:${topStr}`);
                if (rightStr !== 'auto') positions.push(`R:${rightStr}`);
                if (bottomStr !== 'auto') positions.push(`B:${bottomStr}`);
                if (leftStr !== 'auto') positions.push(`L:${leftStr}`);
                if (positions.length > 0) boxHTML += `<b>Offset:</b> ${positions.join(' ')}<br>`;
                boxHTML += `<b>Z-Index:</b> ${zIndexStr}<br>`;
            }

            // Box Model
            if (marginStr !== '0px') boxHTML += `<b>Margin:</b> ${marginStr}<br>`;
            if (paddingStr !== '0px') boxHTML += `<b>Padding:</b> ${paddingStr}<br>`;
            boxHTML += `<b>Box-Sizing:</b> ${boxSizingStr}<br>`;

            // Typography
            boxHTML += `<b>Font:</b> ${fontSizeStr} ${fontFamilyStr.split(',')[0]}<br>`;

            // Contrast Details
            if (txtColorStr !== 'rgba(0, 0, 0, 0)' && effectiveBgColor !== 'rgba(0, 0, 0, 0)') {
                const tc = parseColor(txtColorStr);
                const bc = parseColor(effectiveBgColor);
                const ratio = getContrastRatio(tc, bc);

                let requiredRatio = 4.5; // AA normal text
                if (currentWcag === 'A') requiredRatio = 3.0;
                else if (currentWcag === 'AAA') requiredRatio = 7.0;

                const isPass = ratio >= requiredRatio;
                const statusColor = isPass ? '#00ff00' : '#ff3333';
                boxHTML += `<b>Contrast (${currentWcag}):</b> <span style="font-weight:bold;color:${statusColor}">${ratio.toFixed(2)}:1 (${isPass ? 'PASS' : 'FAIL'})</span><br>`;
            }

            if (txtColorStr !== 'rgba(0, 0, 0, 0)') {
                boxHTML += `<b>Color (Current):</b> <span style="display:inline-block;width:8px;height:8px;background:${txtColorStr};border:1px solid #000;border-radius:2px;"></span> ${txtColorStr}<br>`;
            }
            if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                boxHTML += `<b>Bg-Color (Current):</b> <span style="display:inline-block;width:8px;height:8px;background:${bgColor};border:1px solid #000;border-radius:2px;"></span> ${bgColor}<br>`;
            }

            // Show base styles if they differ from current (e.g., if currently hovered)
            if (baseStyles.colorStr !== 'rgba(0, 0, 0, 0)' && baseStyles.colorStr !== txtColorStr) {
                boxHTML += `<b>Color (Base):</b> <span style="display:inline-block;width:8px;height:8px;background:${baseStyles.colorStr};border:1px solid #000;border-radius:2px;"></span> ${baseStyles.colorStr}<br>`;
            }
            if (baseStyles.bgColor !== 'rgba(0, 0, 0, 0)' && baseStyles.bgColor !== 'transparent' && baseStyles.bgColor !== bgColor) {
                boxHTML += `<b>Bg-Color (Base):</b> <span style="display:inline-block;width:8px;height:8px;background:${baseStyles.bgColor};border:1px solid #000;border-radius:2px;"></span> ${baseStyles.bgColor}<br>`;
            }



            // Append Hover specific CSS if found
            const hoverStyles = getHoverStyles(target);
            if (hoverStyles.hoverColor) {
                boxHTML += `<b>Hover Color:</b> <span style="display:inline-block;width:8px;height:8px;background:${hoverStyles.hoverColor};border:1px solid #000;border-radius:2px;"></span> ${hoverStyles.hoverColor}<br>`;
            }
            if (hoverStyles.hoverBg) {
                boxHTML += `<b>Hover Bg:</b> <span style="display:inline-block;width:8px;height:8px;background:${hoverStyles.hoverBg};border:1px solid #000;border-radius:2px;"></span> ${hoverStyles.hoverBg}<br>`;
            }

            if (opacityStr !== '1') boxHTML += `<b>Opacity:</b> ${opacityStr}<br>`;

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

    document.addEventListener('scroll', (e) => {
        if (!isActive || !isFrozen || !hoveredElement) return;
        // Reposition frozen box based on element's new screen bounds
        const rect = hoveredElement.getBoundingClientRect();

        // If element scrolled completely out of view, we could hide it or let it follow. Let's let it follow.
        const targetX = rect.left + frozenOffsetX;
        const targetY = rect.top + frozenOffsetY;

        // Re-call positioning logic but without fully rebuilding HTML 
        const infoBoxRect = infoBox.getBoundingClientRect();
        let left = targetX + 20;
        let top = targetY + 20;

        if (left + infoBoxRect.width > window.innerWidth) {
            left = targetX - infoBoxRect.width - 20;
        }
        if (top + infoBoxRect.height > window.innerHeight) {
            top = targetY - infoBoxRect.height - 20;
        }

        if (left < 10) left = 10;
        if (top < 10) top = 10;

        infoBox.style.left = `${left}px`;
        infoBox.style.top = `${top}px`;
    }, true);

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
