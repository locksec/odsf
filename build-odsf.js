// build-odsf.js - ODSF Static Site Generator
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, watch, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { minifyCSS, minifyJS, minifyHTML, loadConfig } from './build-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');
const forceMinify = args.includes('--minify');
const noMinify = args.includes('--no-minify');

// Load configuration
const configPath = join(__dirname, '.odsf-config.json');
const config = loadConfig(configPath);

// Determine if minification should be enabled
const shouldMinify = forceMinify || (!noMinify && config.minify.enabled);

// Validate framework JSON structure
const validateFramework = (framework) => {
  const errors = [];
  const warnings = [];
  
  // Required top-level fields
  const requiredFields = ['framework_name', 'framework_version', 'author', 'description', 'focus_areas'];
  requiredFields.forEach(field => {
    if (!framework[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate focus_areas
  if (framework.focus_areas) {
    if (!Array.isArray(framework.focus_areas)) {
      errors.push('focus_areas must be an array');
    } else if (framework.focus_areas.length === 0) {
      warnings.push('focus_areas array is empty');
    } else {
      // Validate each focus area
      framework.focus_areas.forEach((area, index) => {
        const areaPrefix = `focus_areas[${index}]`;
        
        // Required focus area fields
        ['id', 'name', 'description', 'business_rationale'].forEach(field => {
          if (!area[field]) {
            errors.push(`${areaPrefix}: Missing required field '${field}'`);
          }
        });
        
        // Validate subcategories
        if (!area.subcategories) {
          errors.push(`${areaPrefix}: Missing subcategories array`);
        } else if (!Array.isArray(area.subcategories)) {
          errors.push(`${areaPrefix}: subcategories must be an array`);
        } else if (area.subcategories.length === 0) {
          warnings.push(`${areaPrefix}: subcategories array is empty`);
        } else {
          // Validate each subcategory
          area.subcategories.forEach((sub, subIndex) => {
            const subPrefix = `${areaPrefix}.subcategories[${subIndex}]`;
            
            // Required subcategory fields
            ['id', 'name', 'objective'].forEach(field => {
              if (!sub[field]) {
                errors.push(`${subPrefix}: Missing required field '${field}'`);
              }
            });
            
            // Validate controls
            if (!sub.controls) {
              errors.push(`${subPrefix}: Missing controls array`);
            } else if (!Array.isArray(sub.controls)) {
              errors.push(`${subPrefix}: controls must be an array`);
            } else if (sub.controls.length === 0) {
              warnings.push(`${subPrefix}: controls array is empty`);
            }
          });
        }
      });
    }
  }
  
  return { errors, warnings };
};

// Find the latest version of the framework JSON file
const findLatestFrameworkFile = () => {
  const files = readdirSync(__dirname);
  const frameworkFiles = files.filter(file => 
    file.startsWith('odsf-framework-v') && file.endsWith('.json')
  );
  
  if (frameworkFiles.length === 0) {
    throw new Error('No framework JSON files found. Expected files matching pattern: odsf-framework-v*.json');
  }
  
  // Sort by version number (assumes format: odsf-framework-vX.Y.Z.json)
  frameworkFiles.sort((a, b) => {
    const versionA = a.match(/v(\d+)\.(\d+)\.(\d+)/);
    const versionB = b.match(/v(\d+)\.(\d+)\.(\d+)/);
    
    if (!versionA || !versionB) return 0;
    
    for (let i = 1; i <= 3; i++) {
      const numA = parseInt(versionA[i]);
      const numB = parseInt(versionB[i]);
      if (numA !== numB) return numB - numA;
    }
    
    return 0;
  });
  
  return frameworkFiles[0];
};

// Read template file
const readTemplate = (templatePath) => {
  return readFileSync(join(__dirname, 'src/templates', templatePath), 'utf8');
};

// Replace template variables
const replaceVariables = (template, variables) => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

// Utility function to escape HTML
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Generate control HTML
const generateControl = (control) => {
  const template = readTemplate('partials/control.html');
  const implementationGuidance = control.implementation_guidance
    .map(guide => `<li>${escapeHtml(guide)}</li>`)
    .join('');
  
  return replaceVariables(template, {
    controlId: control.id,
    controlName: control.name,
    controlDescription: control.description,
    implementationGuidance
  });
};

// Generate subcategory HTML
const generateSubcategory = (sub) => {
  const template = readTemplate('partials/subcategory.html');
  const controls = sub.controls.map(control => generateControl(control)).join('');
  
  return replaceVariables(template, {
    subcategoryId: sub.id,
    subcategoryName: sub.name,
    subcategoryObjective: sub.objective,
    controls
  });
};

// Generate focus area HTML
const generateFocusArea = (area) => {
  const template = readTemplate('partials/focus-area.html');
  const subcategories = area.subcategories.map(sub => generateSubcategory(sub)).join('');
  
  return replaceVariables(template, {
    areaId: area.id,
    areaName: area.name,
    areaDescription: area.description,
    businessRationale: area.business_rationale,
    subcategories
  });
};

// Generate navigation pills
const generateNavPills = (focusAreas) => {
  return focusAreas.map(area => 
    `<button class="nav-pill active" data-filter="${area.id}">${area.id}: ${area.name}</button>`
  ).join('\n      ');
};

// Generate complete HTML
const generateHTML = (data) => {
  // Read templates
  const indexTemplate = readTemplate('index.html');
  const headerTemplate = readTemplate('partials/header.html');
  const statsTemplate = readTemplate('partials/stats.html');
  const mainContentTemplate = readTemplate('partials/main-content.html');
  const footerTemplate = readTemplate('partials/footer.html');
  
  // Calculate stats
  const focusAreaCount = data.focus_areas.length;
  const subcategoryCount = data.focus_areas.reduce((acc, area) => acc + area.subcategories.length, 0);
  const controlCount = data.focus_areas.reduce((acc, area) => 
    acc + area.subcategories.reduce((subAcc, sub) => subAcc + sub.controls.length, 0), 0
  );
  
  // Generate header
  const header = replaceVariables(headerTemplate, {
    frameworkName: data.framework_name.toUpperCase(),
    description: data.description,
    frameworkVersion: data.framework_version,
    frameworkVersionDesc: data.framework_version_desc ? ` - ${data.framework_version_desc}` : '',
    author: data.author || 'Unknown Author'
  });
  
  // Generate stats
  const stats = replaceVariables(statsTemplate, {
    focusAreaCount,
    subcategoryCount,
    controlCount
  });
  
  // Generate main content
  const navPills = generateNavPills(data.focus_areas);
  const focusAreas = data.focus_areas.map(area => generateFocusArea(area)).join('\n    ');
  
  const mainContent = replaceVariables(mainContentTemplate, {
    navPills,
    focusAreas
  });
  
  // Process contributors - handle both string and array formats
  let contributorsHtml = '';
  if (data.contributors) {
    let contributorsList = [];
    if (typeof data.contributors === 'string' && data.contributors.trim()) {
      // If contributors is a comma-separated string
      contributorsList = data.contributors.split(',').map(c => c.trim()).filter(c => c);
    } else if (Array.isArray(data.contributors)) {
      // If contributors is already an array
      contributorsList = data.contributors;
    }
    
    if (contributorsList.length > 0) {
      contributorsHtml = `
      <div class="author-section">
        <h3>Contributors</h3>
        <ul>
          ${contributorsList.map(contributor => `<li>${escapeHtml(contributor)}</li>`).join('\n          ')}
        </ul>
        <p class="contributor-thanks">Thank you to all contributors who have helped improve this framework.</p>
      </div>`;
    }
  }
  
  // Combine everything
  return replaceVariables(indexTemplate, {
    header,
    stats,
    mainContent,
    footer: footerTemplate,
    author: data.author || 'Unknown Author',
    contributorsSection: contributorsHtml,
    about: data.about || 'The OSINT Defense & Security Framework (ODSF) is designed to help organizations protect against open-source intelligence gathering and minimize their digital footprint.'
  });
};

// Main build function
const build = () => {
  try {
    console.log('🔨 Building ODSF HTML...');
    if (shouldMinify) {
      console.log('🗜️  Minification enabled');
    }
    
    // Find and read framework data
    const frameworkFile = findLatestFrameworkFile();
    const frameworkPath = join(__dirname, frameworkFile);
    console.log(`📁 Using framework file: ${frameworkFile}`);
    
    let framework;
    try {
      const fileContent = readFileSync(frameworkPath, 'utf8');
      framework = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to read or parse framework file: ${error.message}`);
    }
    
    // Validate framework structure
    const { errors, warnings } = validateFramework(framework);
    
    if (warnings.length > 0) {
      console.log('⚠️  Validation warnings:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (errors.length > 0) {
      console.log('❌ Validation errors:');
      errors.forEach(error => console.log(`   - ${error}`));
      throw new Error('Framework validation failed');
    }
    
    // Create output directory structure
    const outputDir = join(__dirname, 'output');
    const cssDir = join(outputDir, 'css');
    const jsDir = join(outputDir, 'js');
    
    try {
      mkdirSync(outputDir, { recursive: true });
      mkdirSync(cssDir, { recursive: true });
      mkdirSync(jsDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create output directories: ${error.message}`);
    }
    
    // Generate and write HTML
    let html;
    try {
      html = generateHTML(framework);
    } catch (error) {
      throw new Error(`Failed to generate HTML: ${error.message}`);
    }
    
    // Optionally minify HTML
    if (shouldMinify && config.minify.html) {
      console.log('🗜️  Minifying HTML...');
      const originalSize = html.length;
      html = minifyHTML(html);
      const minifiedSize = html.length;
      const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
      console.log(`   Reduced HTML by ${reduction}% (${originalSize} → ${minifiedSize} bytes)`);
    }
    
    try {
      const htmlPath = join(outputDir, 'index.html');
      writeFileSync(htmlPath, html, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write HTML file: ${error.message}`);
    }
    
    // Copy and optionally minify CSS file
    try {
      const cssSource = join(__dirname, 'src/styles/main.css');
      const cssDestination = join(cssDir, 'odsf-styles.css');
      if (!existsSync(cssSource)) {
        throw new Error(`CSS source file not found: ${cssSource}`);
      }
      
      let cssContent = readFileSync(cssSource, 'utf8');
      
      if (shouldMinify && config.minify.css) {
        console.log('🗜️  Minifying CSS...');
        const originalSize = cssContent.length;
        cssContent = minifyCSS(cssContent);
        const minifiedSize = cssContent.length;
        const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        console.log(`   Reduced CSS by ${reduction}% (${originalSize} → ${minifiedSize} bytes)`);
      }
      
      writeFileSync(cssDestination, cssContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to process CSS file: ${error.message}`);
    }
    
    // Copy and optionally minify JS file
    try {
      const jsSource = join(__dirname, 'src/scripts/main.js');
      const jsDestination = join(jsDir, 'odsf-script.js');
      if (!existsSync(jsSource)) {
        throw new Error(`JS source file not found: ${jsSource}`);
      }
      
      let jsContent = readFileSync(jsSource, 'utf8');
      
      if (shouldMinify && config.minify.js) {
        console.log('🗜️  Minifying JavaScript...');
        const originalSize = jsContent.length;
        jsContent = minifyJS(jsContent);
        const minifiedSize = jsContent.length;
        const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        console.log(`   Reduced JS by ${reduction}% (${originalSize} → ${minifiedSize} bytes)`);
      }
      
      writeFileSync(jsDestination, jsContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to process JS file: ${error.message}`);
    }
    
    // Copy all favicon files
    const faviconDir = join(__dirname, 'src/favicon');
    if (existsSync(faviconDir)) {
      try {
        const faviconFiles = readdirSync(faviconDir);
        let copiedCount = 0;
        
        faviconFiles.forEach(file => {
          try {
            const source = join(faviconDir, file);
            const destination = join(outputDir, file);
            copyFileSync(source, destination);
            copiedCount++;
          } catch (error) {
            console.log(`⚠️  Failed to copy favicon file ${file}: ${error.message}`);
          }
        });
        
        if (copiedCount > 0) {
          console.log(`📁 Copied ${copiedCount} favicon files`);
        }
      } catch (error) {
        console.log(`⚠️  Failed to read favicon directory: ${error.message}`);
      }
    } else {
      console.log('ℹ️  No favicon directory found, skipping favicon copy');
    }
    
    console.log('✅ Build complete!');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📄 Generated files:`);
    console.log(`   - index.html`);
    console.log(`   - css/odsf-styles.css`);
    console.log(`   - js/odsf-script.js`);
    console.log(`📊 Stats:`);
    console.log(`   - Focus Areas: ${framework.focus_areas.length}`);
    console.log(`   - Total Controls: ${framework.focus_areas.reduce((acc, area) => 
      acc + area.subcategories.reduce((subAcc, sub) => subAcc + sub.controls.length, 0), 0
    )}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

// Run the build
build();

// Watch mode implementation
if (watchMode) {
  console.log('\n👁️  Watch mode enabled. Watching for changes...');
  console.log('Press Ctrl+C to exit\n');
  
  const watchPaths = [
    join(__dirname, 'src'),
    __dirname
  ];
  
  const watchedFiles = new Map();
  let buildTimeout = null;
  
  const triggerBuild = (path) => {
    if (buildTimeout) {
      clearTimeout(buildTimeout);
    }
    
    console.log(`\n📝 Change detected in: ${path}`);
    
    // Debounce builds to avoid multiple rapid rebuilds
    buildTimeout = setTimeout(() => {
      console.log('🔄 Rebuilding...\n');
      build();
      console.log('\n👁️  Watching for changes...\n');
    }, config.watch.debounce || 300);
  };
  
  const watchFile = (filePath) => {
    try {
      const watcher = watch(filePath, (eventType) => {
        if (eventType === 'change') {
          triggerBuild(filePath);
        }
      });
      
      watchedFiles.set(filePath, watcher);
    } catch (error) {
      console.log(`⚠️  Could not watch ${filePath}: ${error.message}`);
    }
  };
  
  const watchDirectory = (dirPath) => {
    try {
      const items = readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = join(dirPath, item);
        const stats = statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Recursively watch subdirectories, but skip output and node_modules
          if (!item.startsWith('.') && item !== 'output' && item !== 'node_modules') {
            watchDirectory(itemPath);
          }
        } else if (stats.isFile()) {
          // Watch relevant files
          const ext = item.split('.').pop();
          if (['js', 'json', 'html', 'css'].includes(ext)) {
            watchFile(itemPath);
          }
        }
      });
      
      // Also watch the directory itself for new files
      watch(dirPath, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          const newPath = join(dirPath, filename);
          
          // Check if it's a new file we should watch
          try {
            const stats = statSync(newPath);
            if (stats.isFile()) {
              const ext = filename.split('.').pop();
              if (['js', 'json', 'html', 'css'].includes(ext) && !watchedFiles.has(newPath)) {
                console.log(`👁️  Now watching new file: ${filename}`);
                watchFile(newPath);
                triggerBuild(newPath);
              }
            }
          } catch (error) {
            // File was deleted or doesn't exist
          }
        }
      });
    } catch (error) {
      console.log(`⚠️  Could not watch directory ${dirPath}: ${error.message}`);
    }
  };
  
  // Start watching
  watchPaths.forEach(path => {
    if (existsSync(path)) {
      const stats = statSync(path);
      if (stats.isDirectory()) {
        watchDirectory(path);
      } else {
        watchFile(path);
      }
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watch mode...');
    watchedFiles.forEach(watcher => watcher.close());
    process.exit(0);
  });
}