// build-utils.js - Utility functions for the ODSF build system

// Simple CSS minification (without external dependencies)
export const minifyCSS = (css) => {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove space around specific characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolon before closing brace
    .replace(/;}/g, '}')
    // Remove quotes from font names when possible
    .replace(/"([^"]+)"/g, (match, p1) => {
      if (p1.includes(' ') || /[^a-zA-Z0-9-]/.test(p1)) {
        return match;
      }
      return p1;
    })
    // Remove empty rules
    .replace(/[^{}]+\{\s*\}/g, '')
    // Trim the result
    .trim();
};

// Simple JavaScript minification (without external dependencies)
export const minifyJS = (js) => {
  // Very conservative minification to avoid breaking code
  
  // Remove single-line comments (but preserve those in strings)
  let minified = js.replace(/([^"'`]|^)\/\/.*$/gm, '$1');
  
  // Remove multi-line comments
  minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove empty lines
  minified = minified.replace(/^\s*\n/gm, '');
  
  // Trim trailing whitespace from each line
  minified = minified.replace(/[ \t]+$/gm, '');
  
  // Reduce multiple blank lines to single blank line
  minified = minified.replace(/\n{3,}/g, '\n\n');
  
  return minified.trim();
};

// Simple HTML minification (without external dependencies)
export const minifyHTML = (html) => {
  return html
    // Remove HTML comments (but preserve IE conditional comments)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // Remove unnecessary whitespace between tags
    .replace(/>\s+</g, '><')
    // Remove whitespace around block-level elements
    .replace(/\s*(<\/?(?:div|p|h[1-6]|section|article|header|footer|main|nav|aside|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|form|fieldset|blockquote|pre|hr|br)[^>]*>)\s*/gi, '$1')
    // Collapse multiple spaces to single space
    .replace(/\s{2,}/g, ' ')
    // Remove empty lines
    .replace(/^\s*\n/gm, '')
    // Remove unnecessary whitespace in <head>
    .replace(/(<head[^>]*>)\s+/gi, '$1')
    .replace(/\s+(<\/head>)/gi, '$1')
    // Remove whitespace around meta, link, and script tags
    .replace(/\s*(<(?:meta|link|script|style)[^>]*>)\s*/gi, '$1')
    // Trim the result
    .trim();
};

// Load configuration from .odsf-config.json if it exists
import { readFileSync, existsSync } from 'fs';

export const loadConfig = (configPath) => {
  const defaultConfig = {
    minify: {
      enabled: false,
      css: true,
      js: true,
      html: true
    },
    watch: {
      debounce: 300
    }
  };
  
  try {
    if (existsSync(configPath)) {
      const configContent = readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(configContent);
      
      // Deep merge with defaults
      return {
        ...defaultConfig,
        ...userConfig,
        minify: {
          ...defaultConfig.minify,
          ...(userConfig.minify || {})
        },
        watch: {
          ...defaultConfig.watch,
          ...(userConfig.watch || {})
        }
      };
    }
  } catch (error) {
    console.log(`⚠️  Could not load config file: ${error.message}`);
  }
  
  return defaultConfig;
};