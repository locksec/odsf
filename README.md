# ODSF Build Tool

A build tool for generating a static HTML page for the OSINT Defense & Security Framework (ODSF). The project uses a Node.js build script that transforms JSON framework data into a modern, interactive HTML documentation page with custom CSS and JavaScript.

## Commands

### Build the ODSF HTML page
```bash
npm run build
```
or
```bash
node build-odsf.js
```

This command:
- Automatically finds and reads the latest framework JSON file (e.g., `odsf-framework-v0.1.2.json`)
- Creates an `output/` directory with all generated files
- Generates a static HTML file at `output/index.html`
- Generates CSS file at `output/css/odsf-styles.css`
- Copies JavaScript file to `output/js/odsf-script.js`
- Copies all favicon files (favicon.ico, PNG icons, SVG, web manifest)
- Validates JSON structure and shows warnings/errors
- Outputs build statistics to the console
- Uses configuration from `.odsf-config.json` if present (see Configuration section)
- Minification is enabled by default (configurable via .odsf-config.json)

### Build with minification
```bash
npm run build:minify
```
or
```bash
node build-odsf.js --minify
```

Forces minification of HTML, CSS and JavaScript files regardless of configuration.

### Watch mode for development
```bash
npm run watch
```
or
```bash
node build-odsf.js --watch
```

Watches for changes in source files and automatically rebuilds. Press Ctrl+C to exit.

### Clean the output directory
```bash
npm run clean
```

Removes the entire output directory and its contents.

## Architecture

### Data Flow
1. **Input**: Latest `odsf-framework-v*.json` file - Automatically detected based on version number
2. **Process**: `build-odsf.js` - Transforms JSON data into HTML using templates and external CSS/JavaScript
3. **Output** (all in `output/` directory): 
   - `output/index.html` - Main HTML page with custom CSS
   - `output/css/odsf-styles.css` - Copied CSS styles with dark/light theme support
   - `output/js/odsf-script.js` - Copied JavaScript functionality

### Key Components

**build-odsf.js** - Main build script that:
- Uses ES modules syntax (`import`/`export`)
- Automatically finds the latest framework JSON file by version
- Creates output directory structure (`output/`, `output/css/`, `output/js/`)
- Uses external templates from `src/templates/` directory
- Validates JSON structure before processing
- Comprehensive error handling with detailed error messages
- Copies all files from `src/favicon/` to output root
- Supports command-line flags: `--watch`, `--minify`, `--no-minify`
- Implements utility functions:
  - `validateFramework()` - Validates JSON structure and shows warnings/errors
  - `findLatestFrameworkFile()` - Locates the highest version JSON file
  - `readTemplate()` - Reads template files from the templates directory
  - `replaceVariables()` - Replaces template variables with actual data
  - `escapeHtml()` - Sanitizes text content

**build-utils.js** - Utility module that provides:
- `minifyCSS()` - Simple CSS minification without external dependencies
- `minifyJS()` - Basic JavaScript minification preserving functionality
- `minifyHTML()` - HTML minification removing comments and unnecessary whitespace
- `loadConfig()` - Loads and merges configuration from `.odsf-config.json`

**Template System** - Uses separate template files for better maintainability:
- `src/templates/index.html` - Main HTML structure
- `src/templates/partials/header.html` - Header section with hero content
- `src/templates/partials/stats.html` - Statistics display
- `src/templates/partials/main-content.html` - Main content wrapper
- `src/templates/partials/focus-area.html` - Focus area template
- `src/templates/partials/subcategory.html` - Subcategory template
- `src/templates/partials/control.html` - Control template
- `src/templates/partials/footer.html` - Footer with copyright and license

**src/scripts/main.js** - Enhanced interactivity including:
- Advanced search with real-time filtering and highlighting
- Search covers all text including descriptions, business rationale, and implementation guidance
- Auto-expands implementation guidance when search matches
- Clear search button (X) inside the search bar
- Focus area filter buttons (tile layout) with toggle functionality
- All On/All Off buttons for focus area filters
- Expand All/Collapse All buttons for content
- Breadcrumb navigation showing "Focus Areas" > current view
- Quick jump modal (Ctrl+K) with keyboard navigation
- Light/Dark theme toggle with localStorage persistence
- Keyboard shortcuts:
  - Ctrl/Cmd+F: Focus search
  - Ctrl/Cmd+K: Open quick jump modal
  - Ctrl/Cmd+E: Toggle expand/collapse all
  - ESC: Close modals or clear search
  - Arrow keys: Navigate in quick jump modal
- All focus areas enabled by default
- Focus areas start collapsed by default

**src/styles/main.css** - Custom styles including:
- Dark theme (default) with light theme support
- CSS variables for easy theming
- Fluid typography system using CSS clamp()
- Custom color scheme with cyan (#40d0d5) and red (#ea3232) accents
- Focus area tile buttons with grid layout
- Focus area expansion animations with rotating chevrons
- Search highlighting without padding
- Quick jump modal with glassmorphism effect
- Keyboard shortcuts bar with glassmorphism effect (bottom right)
- Header buttons: Author (opens modal), About (external link), License (opens modal)
- Version badge on separate line with semi-transparent cyan styling
- Light mode uses dark gray text instead of black
- Theme toggle button (top right)
- Print-ready styles that expand all sections
- Footer with copyright notice and license button
- License modal with detailed commercial/non-commercial terms
- Author modal showing primary author and contributors (dynamically loaded from JSON)

### Expected JSON Structure

The `odsf-framework-v*.json` file should contain:
```json
{
  "framework_name": "string",
  "framework_version": "string",
  "author": "string",
  "contributors": "string", // Optional: comma-separated list or array
  "description": "string",
  "focus_areas": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "business_rationale": "string",
      "scope": "string",
      "alignment": {
        "nist_csf": ["string"],
        "iso_27001": ["string"]
      },
      "subcategories": [
        {
          "id": "string",
          "name": "string",
          "objective": "string",
          "controls": [
            {
              "id": "string",
              "name": "string",
              "description": "string",
              "implementation_guidance": ["string"]
            }
          ]
        }
      ]
    }
  ]
}
```

## Configuration

The build tool supports configuration via `.odsf-config.json` file in the project root. See `.odsf-config.example.json` for reference.

**Default behavior**: The `npm run build` command automatically uses `.odsf-config.json` if it exists. With the current configuration file, minification is enabled by default for all file types.

### Configuration Options

```json
{
  "minify": {
    "enabled": true,     // Enable minification by default
    "css": true,         // Minify CSS files
    "js": false,         // JavaScript minification disabled (to preserve functionality)
    "html": true         // Minify HTML output
  },
  "watch": {
    "debounce": 300      // Milliseconds to wait before rebuilding in watch mode
  }
}
```

### Command-line Flag Precedence

- `--minify` forces minification regardless of config
- `--no-minify` disables minification regardless of config
- Without flags, uses configuration file settings

## Important Notes

- **JSON File Detection**: The build script automatically finds and uses the latest version of `odsf-framework-v*.json` files in the directory
- **ES Modules**: The project uses modern ES modules syntax with `"type": "module"` in package.json
- **No Dependencies**: This is a standalone script with no external npm dependencies - uses only Node.js built-in modules (fs, path, url)
- **Source Files**: Project structure follows web development best practices:
  - `build-odsf.js` - Main build script
  - `build-utils.js` - Utility functions for minification and config
  - `src/templates/` - HTML template files
  - `src/styles/main.css` - Source CSS styles
  - `src/scripts/main.js` - Source JavaScript functionality
  - `.odsf-config.json` - Build configuration (minification enabled by default)
  - `.odsf-config.example.json` - Example configuration file
- **Output Files**: The build generates all files in the `output/` directory:
  - `output/index.html` - Main HTML page (optionally minified)
  - `output/css/odsf-styles.css` - CSS styles (optionally minified)
  - `output/js/odsf-script.js` - JavaScript functionality (optionally minified)
  - All files in the output directory form a self-contained website

## UI Features

- **Modern Design**: Professional dark theme design with cyan/red accent colors
- **Theme Support**: Light/dark mode toggle with localStorage persistence
- **Typography**: Jost font family with fluid typography using CSS clamp()
- **Hero Section**: Large "MINIMIZE WHAT CAN BE KNOWN" tagline with badges
- **Badges**: Version, Author, and About (links to psysecure.com/odsf)
- **Content Width**: Maximum 1200px width for comfortable reading
- **Search**: 
  - Real-time filtering with highlighting (no padding on highlights)
  - Searches all content including descriptions and business rationale
  - Clear button (X) inside search bar
  - Auto-expands implementation guidance when matched
- **Filtering**: 
  - Focus area buttons in tile layout (full width, grid)
  - All On/All Off buttons on the left
  - Independent toggle functionality for each area
  - All areas enabled by default
- **Navigation**: 
  - Breadcrumb trail
  - Quick jump modal (Ctrl+K) with arrow key navigation
  - Keyboard shortcuts bar with glassmorphism effect
- **Content Display**:
  - Each focus area shows Description and Business Rationale sections
  - Expandable sections (collapsed by default)
  - Expand All/Collapse All buttons on the right
- **Responsive**: 
  - Fluid typography and layouts
  - Quick jump sidebar hidden on mobile
  - Keyboard shortcuts hidden on mobile
- **Print-ready**: Automatically expands all sections when printing
- **Favicon Support**: Multiple favicon formats including SVG and web manifest

## Current Implementation Status

The ODSF build tool is fully functional with all core features implemented:
- ✅ Static site generation from JSON data
- ✅ Modern, responsive UI with dark/light themes
- ✅ Advanced search with highlighting
- ✅ Focus area filtering with tile buttons
- ✅ Quick jump navigation
- ✅ Keyboard shortcuts
- ✅ Favicon support
- ✅ Print-ready output
- ✅ Self-contained output (no external dependencies)
- ✅ JSON schema validation with empty array warnings
- ✅ Comprehensive error handling for all file operations
- ✅ Clean command to remove output directory
- ✅ Watch mode for automatic rebuilds during development
- ✅ HTML, CSS and JavaScript minification with configurable options
- ✅ Configuration file support (.odsf-config.json)
- ✅ Dynamic author/contributors display from JSON data
- ✅ Footer with copyright notice (CC BY-NC-SA 4.0)
- ✅ License modal with commercial/non-commercial terms
- ✅ Author modal with primary author and contributors

## GitHub Pages Deployment (Secure Method)

Deploy your ODSF site to GitHub Pages while keeping your framework JSON file private.

### Important Security Note

Since the framework JSON file contains proprietary data and is excluded from the repository (in `.gitignore`), we cannot use GitHub Actions to build the site. Instead, we build locally and deploy only the output files.

### Deployment Workflow

1. **Build locally** with your private JSON file:
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

The deployment script (`deploy-output-only.sh`):
- Builds the site locally using your private JSON file
- Creates a temporary directory for deployment (doesn't affect your working directory)
- Initializes a fresh git repository in that temp directory
- Copies only the output files (HTML, CSS, JS, favicons)
- Creates/updates the `gh-pages` branch with ONLY the output files
- Your JSON file is never committed or exposed
- Automatically includes CNAME file for custom domain
- Cleans up the temp directory when done

### Initial Setup

1. **Configure GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created by first deployment)
   - Folder: `/ (root)`
   - Custom domain: `odsf.psysecure.com`
   - Enforce HTTPS: ✓ (checked)

2. **Set up DNS** (at your domain provider):
   ```
   CNAME odsf.psysecure.com -> [username].github.io
   ```

### Security Benefits

- ✅ Framework JSON file remains completely private
- ✅ Only compiled output is public
- ✅ Source code and build process stay in your private main branch
- ✅ Public can access the framework documentation but not the raw data

### Update Process

To update your site:
1. Make changes to your JSON file or templates
2. Test locally: `npm run build`
3. Deploy updates: `npm run deploy`

### Alternative: Private Repository

If you have GitHub Pro/Team/Enterprise, you can:
1. Keep the entire repository private
2. Use GitHub Actions with the JSON file
3. Still host public GitHub Pages from the private repo

But with a free account, the manual deployment approach keeps your data secure.

### Troubleshooting

**If files go missing after deployment:**
- The deployment script now works in a separate directory and won't affect your project files
- Your JSON file should never be deleted (it's in .gitignore)

**If deployment fails:**
- Ensure your JSON file exists: `odsf-framework-v*.json`
- Check that you're in the project root (where package.json is)
- Verify git remote is set: `git remote -v`

**Important files to backup:**
- Your framework JSON file (`odsf-framework-v*.json`)
- Any custom modifications to templates

## License

This build tool is MIT licensed. The ODSF framework content is licensed separately under CC BY-NC-SA 4.0.

## Live Demo

Visit [odsf.psysecure.com](https://odsf.psysecure.com) to see the framework in action.