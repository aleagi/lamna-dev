document.addEventListener('DOMContentLoaded', () => {
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const wcagRadios = document.querySelectorAll('input[name="wcag"]');
    const zoomRange = document.getElementById('zoom-range');
    const zoomVal = document.getElementById('zoom-val');

    // Load saved settings
    chrome.storage.sync.get(['lamnaTheme', 'lamnaWcag', 'lamnaZoom'], (result) => {
        const theme = result.lamnaTheme || 'dynamic';
        const wcag = result.lamnaWcag || 'AA';
        const zoom = result.lamnaZoom || 1.0;

        const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (themeRadio) themeRadio.checked = true;

        const wcagRadio = document.querySelector(`input[name="wcag"][value="${wcag}"]`);
        if (wcagRadio) wcagRadio.checked = true;

        if (zoomRange) {
            zoomRange.value = zoom;
            zoomVal.textContent = parseFloat(zoom).toFixed(1) + 'x';
        }
    });

    // Save on change - Theme
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.sync.set({ lamnaTheme: e.target.value });
            }
        });
    });

    // Save on change - WCAG
    wcagRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.sync.set({ lamnaWcag: e.target.value });
            }
        });
    });

    // Save on change - Zoom
    if (zoomRange) {
        zoomRange.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value).toFixed(1);
            zoomVal.textContent = val + 'x';
            chrome.storage.sync.set({ lamnaZoom: val });
        });
    }
});
