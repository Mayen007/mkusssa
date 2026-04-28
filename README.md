# MKUSSSA Nairobi Campus Website

Static website for the Mount Kenya University South Sudanese Students' Association (MKUSSSA) - Nairobi Campus.

**Mission:** Unite, support, and empower South Sudanese students through academic excellence, cultural celebration, and community solidarity.

## Quick Start

1. Open the project folder in VS Code
2. Right-click `index.html` and select **Open with Live Server**
3. The site opens at `http://localhost:5500` with auto-reload

Or simply double-click `index.html` in your file explorer to open it directly.

## File Structure

```
mkusssa/
├── index.html          # All content and structure
├── css/style.css       # All styling
├── js/script.js        # Mobile menu & carousel
└── assets/             # Images, docs, fonts
```

## Editing

- **Content:** Edit `index.html` directly (text, links, images)
- **Colors & Spacing:** Modify CSS variables at the top of `css/style.css`
- **Menu/Carousel:** Adjust `js/script.js` if needed

Example: to change the primary color, find `--primary-color` in `style.css` and update the hex value.

## Ownership

**This site is proprietary.** "All rights reserved" applies. Collaborators may edit but **cannot** distribute or sublicense without permission.

**Third-party licenses:** Fonts (Poppins, Inter) use OFL; Font Awesome uses CC BY 4.0.

## Contributing

1. **Create a branch:** `git checkout -b feature/your-change`
2. **Make changes** and test locally with Live Server
3. **Verify:**
   - No console errors
   - Mobile menu works
   - All links work
   - Responsive at 320px, 768px, and desktop
   - Images load
4. **Commit with a clear message:** `Update leadership section`, `Fix mobile nav alignment`
5. **Submit a pull request** with a description of changes
