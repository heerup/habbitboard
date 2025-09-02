# Habitboard - GitHub Copilot Coding Instructions

Habitboard is a minimal, static habit tracking Progressive Web App (PWA) built with pure HTML, CSS, and JavaScript. It creates weekly habit grids where users can toggle daily completion status. Data is stored locally in the browser using localStorage.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### No Build System Required
- **CRITICAL**: This application has NO build tools, NO package.json, NO dependencies, and NO build process.
- **DO NOT** run `npm install`, `npm run build`, or any build commands - they do not exist and will fail.
- **DO NOT** look for package.json, webpack configs, or any build tooling - none exist.
- Open `index.html` directly in a browser or serve with any simple HTTP server.

### Running the Application
- **Local Development**: 
  - `cd /home/runner/work/habbitboard/habbitboard`
  - `python3 -m http.server 8080` - serves on http://localhost:8080
  - Open http://localhost:8080 in browser - loads instantly (< 1 second)
- **Alternative**: Open `index.html` directly in any browser (file:// protocol works)
- **NO build step required** - files are ready to serve as-is

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, vanilla JavaScript (ES6+)
- **Storage**: localStorage with key `habitboard:v2` 
- **PWA**: Service worker (`sw.js`) + manifest (`manifest.webmanifest`)
- **Icon**: Single SVG file (`icons/icon.svg`)
- **Total size**: ~15KB for entire application

## Validation

### ALWAYS run through these validation scenarios after making any changes:

1. **Basic Habit Tracking**:
   - Start local server: `python3 -m http.server 8080`
   - Open http://localhost:8080
   - Click several day buttons in current week - verify they turn gold when selected
   - Refresh page - verify selected days remain marked
   - **This is the core functionality - if this fails, the app is broken**

2. **Multi-Tab Functionality**:
   - Click the "+" button to add a new tab
   - Enter a habit name (e.g., "Exercise") when prompted
   - Click some days in the new tab
   - Switch back to "Default" tab - verify different completion pattern
   - Switch tabs again - verify data is independent per tab
   - **Tab data isolation is critical for multi-habit tracking**

3. **Navigation Features**:
   - Scroll down to load older weeks (infinite scroll)
   - Click "Today" button - verify it scrolls back to current week
   - Check that weeks are labeled with ISO format "YYYY · WNN"
   - **Navigation must work for users to access historical data**

4. **PWA Installation**:
   - Open browser developer tools → Application → Service Workers
   - Verify service worker is registered and active
   - Check Application → Manifest - verify no errors
   - **PWA functionality enables mobile installation**

### Data Persistence Testing
- **Storage key**: All data stored under `habitboard:v2` in localStorage
- **Migration**: Automatically migrates from legacy `habitboard:v1` key
- Test in browser console: `localStorage.getItem('habitboard:v2')` should return JSON data
- Clear storage: `localStorage.removeItem('habitboard:v2')` to reset app

## Deployment

### GitHub Pages (Primary Method)
- **Ready for immediate deployment** - no build required
- Repository root contains all necessary files
- Setup: Repository Settings → Pages → Deploy from branch → main → / (root)
- **NO GitHub Actions needed** - static files deploy directly
- Deployment time: ~1-2 minutes after push

### Alternative Deployment
- Any static hosting service (Netlify, Vercel, etc.)
- Upload all files in repository root
- No build configuration needed

## File Structure & Key Components

### Core Files (DO NOT DELETE)
```
/home/runner/work/habbitboard/habbitboard/
├── index.html           # Main application entry point
├── main.js             # Core logic (7KB) - habit tracking, tabs, storage
├── styles.css          # All styles (4KB) - responsive design, variables
├── manifest.webmanifest # PWA manifest for installation
├── sw.js               # Service worker for offline functionality
├── icons/icon.svg      # Application icon (used in manifest)
└── README.md           # User documentation
```

### Key JavaScript Functions (in main.js)
- `renderWeekRow()` - Creates weekly habit grid
- `activeData()` - Gets current tab's habit data
- `saveRoot()` - Persists data to localStorage
- `renderTabs()` - Updates tab UI
- `addTab()` - Creates new habit tab

### CSS Architecture (in styles.css)
- CSS custom properties for theming (`--panel`, `--on`, `--off`, etc.)
- Mobile-first responsive design with media queries
- Grid layouts for weekly habit display
- Sticky headers for navigation

## Common Development Tasks

### Making Changes to Habit Logic
- **Always** test with multiple tabs after changes
- **Always** test data persistence across browser refreshes
- **Always** verify localStorage data structure remains compatible
- Focus areas: `main.js` lines 14-54 (storage), lines 99-135 (rendering)

### Styling Changes
- Use existing CSS custom properties when possible
- Test on mobile viewport (primary target)
- Verify sticky headers still work properly
- Key classes: `.day-btn`, `.tab`, `.week-label`, `.row`

### PWA Updates
- After changing `sw.js`: Hard refresh (Ctrl+Shift+R) to update service worker
- After changing `manifest.webmanifest`: Clear browser cache
- Test offline functionality after service worker changes

## Troubleshooting

### Common Issues
- **Days not toggling**: Check browser console for JavaScript errors
- **Data not persisting**: Verify localStorage is enabled and not full
- **Tabs not working**: Check tab creation logic in `addTab()` function
- **Styling broken**: Verify CSS custom properties are defined in `:root`

### Debug Commands
- Check storage: `localStorage.getItem('habitboard:v2')`
- Clear data: `localStorage.clear()`
- Service worker status: Browser DevTools → Application → Service Workers
- Console errors: Browser DevTools → Console

### Performance Notes
- App loads in <1 second (all files ~15KB total)
- Infinite scroll loads 12 weeks at a time (performance optimized)
- localStorage has ~5-10MB limit (sufficient for years of habit data)

## Testing New Features

### Required Test Scenarios
1. **Create new habit tab** → Add completion marks → Switch tabs → Verify independence
2. **Mark several days in current week** → Refresh browser → Verify persistence  
3. **Scroll to load old weeks** → Click "Today" → Verify navigation to current week
4. **Open in mobile browser** → Test touch interactions → Verify responsive layout

### Browser Compatibility
- **Primary targets**: Mobile Safari, Chrome Mobile, Firefox Mobile
- **Desktop**: Chrome, Firefox, Safari, Edge (all recent versions)
- **PWA support**: Chrome, Edge (full), Safari (limited), Firefox (limited)

## Repository Information

### No CI/CD Required
- **NO GitHub Actions workflows** - none exist or needed
- **NO automated testing** - manual validation only
- **NO dependency management** - no package.json exists
- **NO security scanning needed** - no dependencies to scan

### Contributing Guidelines
- Test all changes with the validation scenarios above
- Keep file sizes minimal (currently ~15KB total)
- Maintain mobile-first responsive design
- Preserve localStorage data format compatibility
- Document any new features in README.md

---

**Remember**: This is a deliberately minimal application. The lack of build tools, frameworks, and complex tooling is intentional design. Focus on the core habit tracking functionality and user experience.