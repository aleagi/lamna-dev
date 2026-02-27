# Lamna Dev Analyzer

**Lamna Dev Analyzer** is an extension designed for Chromium browsers (Chrome, Edge, Brave) that allows structural analysis of the DOM in real-time and non-intrusively. The extension highlights elements on the screen based on instant mouse coordinates, displaying highly responsive floating text boxes and stunning aesthetic themes.

## 🚀 Features

- **Real-Time Tracking:** Follows the mouse flow identifying `<Tags>`, `.classes`, and dimensions (Width x Height).
- **Self-Managed Canvas Rulers:** Contains dynamic markings every 10/50/100 pixels perfectly rendered according to screen resizing.
- **Complete Theme System:** Adjusts to your preference.
  - **Neon Tech:** Semi-transparent boxes with Glassmorphism aesthetics, clean and focused borders.
  - **Amber LCD:** For old-school use. Faded borders, on-screen pixels simulating a true Matrix LCD board (Ambar Theme).
  - **Amber CRT Monitor:** An immersive orange/amber glow simulating an old, heavily contrasted CRT terminal.
  - **The Matrix:** A dark-green "hacker" theme directly extracted from terminal displays.
  - **Matrix CRT Monitor:** An immersive dark-green glow simulating an old, heavily contrasted CRT terminal.
  - **Dracula (Vampire):** The world-famous dark theme with its iconic purple borders, cyan texts, and pink accents.
  - **Dynamic (Auto):** (The Default) The extension intelligently detects the dominant color or theme-color of the website you are browsing and automatically calculates the colors, generating its own color scheme!
- **Detective Mode (Hold `Ctrl`):** Instantly reveals the complete hierarchy and hidden styling attributes.
  - Double tap `Ctrl` to lock the box in extended mode permanently. Double tap again to disable it.
  - Spacing (Paddings, Margins, and Box-Sizing)
  - Positioning (Top, Left, Right, Bottom, and Z-Index)
  - Real and Visual Colors (Text Color, Background Color, Opacity, and literal RGB rendering with a visualized palette)
  - Typography (Font family and computed sizes).
- **Inspection Freeze (Hit `L`):** Need to copy the class of an inspected element? Just by pressing the `L` key while pointing at the element, the box will be locked on the screen (Freeze mode), allowing you to use the mouse to select text inside the *Info box*. Press `L` again (or click outside) to unfreeze.
- **Automatic Contrast Analysis (WCAG):** When in Detective Mode (holding or locked with `Ctrl`), the extension calculates the contrast ratio (Luminance ratio) between the text color and the actual background color rendered on the element. It approves or fails accessibility based on the requirement level (A, AA, or AAA) set in the extension panel.
- **Adjustable Zoom:** Through the extension button in the browser (Popup), you can freely change the scale/zoom of the display box (between 0.5x and 2.0x).

## ⌨️ Essential Shortcuts

| Shortcut | Action | Description |
| --- | --- | --- |
| `Alt + L` | **Toggle Display** | Quickly hides all lines, rulers, and boxes of the extension without needing to uninstall or disable it in the store, returning to normal interaction with the page. |
| `Hold Ctrl` | **Advanced Information** | Expands the Info Box with extended data (Parent Nodes, Hierarchy, and Computed Styles) useful for designers and CSS. |
| `L Key` | **Freeze Screen** | Freezes the current state of the tooltip. This allows you to freely move the mouse and **select texts** that appear in the component tooltip. Press `L` again (or click outside) to unfreeze. |

## 📦 How to install

Since the extension is still in development:
1. Access your browser's extensions panel (`chrome://extensions/` in Chrome or `edge://extensions/` in Edge).
2. Check the box and enable **"Developer mode"**.
3. Click on **"Load unpacked"**.
4. Select the folder where you cloned this project. Done! The extension is now available on all sites you visit.

---

## 🔮 Roadmap / Future Ideas
We want to make Lamna Dev Analyzer even more indispensable in your daily routine. Here are some ideas being evaluated for implementation:
1. **Instant "Inline" Editor:** Ability to double-click in the frozen area of the info box to change a padding or color and see the change instantly applied to the website's rendering.
2. **Capture Mode (Images):** Button/shortcut on the frozen popup to perfectly extract/download only the frozen div as a PNG image (like a surgical cutout guided by the DOM engine).
3. **Wireframe Mode:** A button/shortcut that instantly draws transparent borders around absolutely all divs within a selected container to display the website's mesh.
4. **Built-in Color-Picker:** An eyedropper tool or quick key to copy the HEX code from where your mouse passed, based on the read CSS (not a bitmap).

> Developed with a lot of coffee and layout precision. In constant aesthetic experimentation! 🧡
