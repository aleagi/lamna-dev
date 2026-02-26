(function() {
  // Prevent multiple injections
  if (window.__lamna_injected) return;
  window.__lamna_injected = true;

  // Import tech font from Google Fonts
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  // Container to hold all our UI
  const container = document.createElement('div');
  container.id = 'lamna-container';
  
  // Crosshairs
  const crosshairX = document.createElement('div');
  crosshairX.id = 'lamna-crosshair-x';
  const crosshairY = document.createElement('div');
  crosshairY.id = 'lamna-crosshair-y';

  // Coordinate tooltip (follows mouse)
  const coordsTooltip = document.createElement('div');
  coordsTooltip.id = 'lamna-coords-tooltip';

  // Glassmorphism Info Box
  const infoBox = document.createElement('div');
  infoBox.id = 'lamna-info-box';
  infoBox.style.display = 'none'; // Hidden until hovered

  // Rulers
  const rulerTop = document.createElement('div');
  rulerTop.id = 'lamna-ruler-top';
  const rulerLeft = document.createElement('div');
  rulerLeft.id = 'lamna-ruler-left';

  container.appendChild(crosshairX);
  container.appendChild(crosshairY);
  container.appendChild(coordsTooltip);
  container.appendChild(infoBox);
  container.appendChild(rulerTop);
  container.appendChild(rulerLeft);

  document.documentElement.appendChild(container);

  let hoveredElement = null;

  document.addEventListener('mousemove', (e) => {
    // 1. Update Crosshairs position
    crosshairX.style.left = `${e.clientX}px`;
    crosshairY.style.top = `${e.clientY}px`;
    
    // 2. Update Coordinate Tooltip position and text
    coordsTooltip.textContent = `X:${e.clientX} Y:${e.clientY}`;
    coordsTooltip.style.left = `${e.clientX}px`;
    coordsTooltip.style.top = `${e.clientY}px`;

    // 3. Handle Element Highlighting & Info
    const target = e.target;
    
    // Ignore our own extension elements or root elements
    if (container.contains(target) || target === container || target === document.documentElement || target === document.body) {
      infoBox.style.display = 'none';
      if (hoveredElement) {
        hoveredElement.classList.remove('lamna-hovered-element');
        hoveredElement = null;
      }
      return;
    }

    // Different element hovered
    if (target !== hoveredElement) {
      if (hoveredElement) {
        hoveredElement.classList.remove('lamna-hovered-element');
      }
      hoveredElement = target;
      hoveredElement.classList.add('lamna-hovered-element');
    }

    // Element Info parsing
    const rect = target.getBoundingClientRect();
    const tagName = target.tagName.toLowerCase();
    
    // Safe class extraction (SVG elements might have SVGAnimatedString classes)
    let classes = '';
    if (typeof target.className === 'string') {
      classes = target.className.replace('lamna-hovered-element', '').trim();
    }

    // Build box HTML
    let boxHTML = `<span class="lamna-tag">&lt;${tagName}&gt;</span>`;
    if (classes) {
      // Split by spaces, add a dot to each class
      const formattedClasses = classes.split(/\s+/).filter(Boolean).map(c => `.${c}`).join(' ');
      boxHTML += `<br><span class="lamna-class">${formattedClasses}</span>`;
    }
    boxHTML += `<br><span class="lamna-dims">W: ${Math.round(rect.width)}px | H: ${Math.round(rect.height)}px</span>`;
    
    infoBox.innerHTML = boxHTML;
    infoBox.style.display = 'block';

    // Position Info Box intelligently to stay on screen
    const infoBoxRect = infoBox.getBoundingClientRect();
    let left = e.clientX + 20; // Default offset
    let top = e.clientY + 20;
    
    // Check right edge collision
    if (left + infoBoxRect.width > window.innerWidth) {
      left = e.clientX - infoBoxRect.width - 20;
    }
    
    // Check bottom edge collision
    if (top + infoBoxRect.height > window.innerHeight) {
      top = e.clientY - infoBoxRect.height - 20;
    }
    
    // Prevent going off left/top screens
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    infoBox.style.left = `${left}px`;
    infoBox.style.top = `${top}px`;
    
  }, true);

  // Hide UI if mouse leaves window
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget) { // User's mouse left the browser viewport
      crosshairX.style.display = 'none';
      crosshairY.style.display = 'none';
      coordsTooltip.style.display = 'none';
      infoBox.style.display = 'none';
      if (hoveredElement) {
        hoveredElement.classList.remove('lamna-hovered-element');
        hoveredElement = null;
      }
    }
  }, true);

  // Show UI when mouse re-enters
  document.addEventListener('mouseover', (e) => {
    crosshairX.style.display = 'block';
    crosshairY.style.display = 'block';
    coordsTooltip.style.display = 'block';
  }, true);

})();
