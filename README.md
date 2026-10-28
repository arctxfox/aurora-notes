# AuroraNotes

**AuroraNotes** is a lightweight, retro-styled note-taking, drawing, and productivity web application inspired by classic desktop interfaces and arctic aurora aesthetics. Everything runs locally in your browser with zero external dependencies and full offline persistence via `localStorage`.

---

## Features

### Notes (`Notes.exe` & `Editor.exe`)
- **Dual Modes (Text & Draw):** Seamlessly switch between a distraction-free plain text editor and an infinite-pan/zoom drawing canvas per note.
- **Organization:** Pin important notes (`★`) to the top of your list and filter notes instantly using the real-time search bar.
- **Word & Stroke Counter:** Automatically tracks word count in Text mode and stroke count in Draw mode.
- **Fullscreen Mode:** Expand the editor or drawing canvas to fill the entire screen for focused work.
- **Backup & Restore:** Export all your notes, drawings, text boxes, and embedded images to a single `.json` backup file, and import them anytime.

### Drawing & Canvas Tools
- **Select / Cursor Tool:** Click or hover over canvas text boxes and images to move, resize, edit, or delete them.
- **Pencil & Eraser:** Smooth quadratic-curve stroke rendering with customizable brush sizes and quick size presets (`Ctrl+E` for Pencil, `Ctrl+Q` for Eraser).
- **Flood Fill Tool:** Fill enclosed areas on the canvas with your active color.
- **Floating Text Boxes & Images:** Insert movable, resizable text boxes and images onto the canvas, and draw or annotate directly over them.
- **Custom Color Picker:** Interactive HSV color wheel, brightness slider, HEX/RGB input parser, and a customizable palette (up to 16 saved swatches).
- **Canvas Navigation:** Pan with middle-click drag, zoom (`25%` – `400%`) with `Ctrl + Scroll`, and recenter with one click.
- **Unified Undo / Redo:** Full history stack (`Ctrl+Z` / `Ctrl+Y`) covering strokes, fills, text boxes, and images.

### Multitool (`Multitool.exe`)
- **Scientific Calculator:** Supports trigonometric functions (`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`) with `Deg`/`Rad` toggle, logarithms (`ln`, `log`), powers (`xʸ`, `x²`), roots (`√`, `cbrt`), factorials (`!`), constants (`π`, `e`), and `Ans` memory.
- **Task Manager:** Create, check off, and clear daily to-do items with automatic progress tracking.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` / `Cmd + S` | Save current note immediately |
| `Ctrl + Z` / `Cmd + Z` | Undo last canvas action (stroke, fill, text box, or image) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo canvas action |
| `Ctrl + E` | Switch to Pencil tool (in Draw mode) |
| `Ctrl + Q` | Switch to Eraser tool (in Draw mode) |
| `Ctrl + Scroll` | Zoom in / out on the canvas |
| `Middle-Click + Drag` | Pan around the canvas |
| `Escape` | Close color picker, exit fullscreen, or deselect canvas items |

---

## Getting Started

1. Clone or download this repository.
2. Ensure the following files are in the same directory:
   - `index.html`
   - `style.css`
   - `app.js`
   - `foxhead.png` *(brand icon)*
   - `fox.png` *(empty state illustration)*
3. Open `index.html` directly in any modern web browser—no build step or server required!

---

## Data Storage & Privacy

All notes, custom color palettes, and tasks are stored locally in your browser's `localStorage` under the keys:
- `aurora-notes:v1` (Notes & drawings)
- `aurora-notes:palette` (Custom color swatches)
- `aurora-notes:tasks` (To-do list items)

> **Tip:** Use the **Export** button in the top navigation bar regularly to save a `.json` backup of your notes if you clear your browser data or switch devices.
