document.addEventListener('DOMContentLoaded', () => {
    const radios = document.querySelectorAll('input[name="theme"]');

    // Load saved theme
    chrome.storage.sync.get(['lamnaTheme'], (result) => {
        const theme = result.lamnaTheme || 'neon';
        const radio = document.querySelector(`input[value="${theme}"]`);
        if (radio) {
            radio.checked = true;
        }
    });

    // Save on change
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.sync.set({ lamnaTheme: e.target.value });
            }
        });
    });
});
