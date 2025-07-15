// State management
const state = {
  searchTerm: '',
  activeFocusAreas: new Set(['FA1', 'FA2', 'FA3', 'FA4', 'FA5']), // All areas shown by default
  expandedAreas: new Set(),
  breadcrumb: [],
  quickJumpIndex: 0
};

// DOM elements
let elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  // Copyright notice
  console.log('%cOSINT Defense & Security Framework', 'font-size: 24px; color: #40d0d5; font-weight: bold;');
  console.log('%c© 2024 PsySecure. Licensed under CC BY-NC-SA 4.0 for non-commercial use.', 'font-size: 14px; color: #ea3232;');
  console.log('%cFor commercial use, please contact us at https://psysecure.com/contact/', 'font-size: 12px; color: #a0a0a0;');
  console.log('%cLearn more about the license: https://creativecommons.org/licenses/by-nc-sa/4.0/', 'font-size: 12px; color: #40d0d5;');
  
  initializeTheme();
  initializeElements();
  attachEventListeners();
  initializeKeyboardShortcuts();
  renderQuickJump();
  
  // Set initial breadcrumb without applying filters
  updateBreadcrumb('', 0);
});

// Initialize theme
function initializeTheme() {
  // Check for saved theme preference or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update theme toggle icon
  updateThemeIcon();
}

// Update theme toggle icon
function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  if (theme === 'light') {
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
  } else {
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
  }
}

// Initialize DOM element references
function initializeElements() {
  elements = {
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    clearSearch: document.getElementById('clear-search'),
    allOn: document.getElementById('all-on'),
    allOff: document.getElementById('all-off'),
    expandAll: document.getElementById('expand-all'),
    collapseAll: document.getElementById('collapse-all'),
    navPills: document.querySelectorAll('.nav-pill'),
    focusAreas: document.querySelectorAll('.focus-area'),
    breadcrumb: document.getElementById('breadcrumb'),
    quickJump: document.getElementById('quick-jump'),
    quickJumpItems: document.querySelector('.quick-jump-items'),
    licenseModal: document.getElementById('license-modal'),
    licenseBadge: document.getElementById('license-badge'),
    headerLicenseBadge: document.getElementById('header-license-badge'),
    authorModal: document.getElementById('author-modal'),
    authorButton: document.getElementById('author-button')
  };
  
  // Debug: Check if critical elements are found
  if (!elements.quickJump) {
    console.error('Quick jump modal not found');
  }
  if (!elements.licenseModal) {
    console.error('License modal not found');
  }
  if (!elements.licenseBadge) {
    console.error('License badge not found');
  }
}

// Attach event listeners
function attachEventListeners() {
  // Search functionality
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
  
  // Clear search button
  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.clearSearch.classList.add('hidden');
    resetFilters();
  });
  
  // Control buttons
  elements.allOn.addEventListener('click', allAreasOn);
  elements.allOff.addEventListener('click', allAreasOff);
  elements.expandAll.addEventListener('click', expandAll);
  elements.collapseAll.addEventListener('click', collapseAll);
  
  // Navigation pills
  elements.navPills.forEach(pill => {
    pill.addEventListener('click', handleNavFilter);
  });
  
  // Focus area expansion
  document.querySelectorAll('.focus-area-header').forEach(header => {
    header.addEventListener('click', handleAreaToggle);
  });
  
  // Implementation details toggle
  document.querySelectorAll('.implementation-header').forEach(header => {
    header.addEventListener('click', handleImplementationToggle);
  });
  
  // Quick jump links are handled via event delegation on quickJumpItems
  
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // License badge
  if (elements.licenseBadge) {
    elements.licenseBadge.addEventListener('click', () => {
      elements.licenseModal.classList.add('active');
    });
  }
  
  // Header license badge
  if (elements.headerLicenseBadge) {
    elements.headerLicenseBadge.addEventListener('click', () => {
      elements.licenseModal.classList.add('active');
    });
  }
  
  // Author button
  if (elements.authorButton) {
    elements.authorButton.addEventListener('click', () => {
      elements.authorModal.classList.add('active');
    });
  }
  
  // License modal click outside to close
  if (elements.licenseModal) {
    elements.licenseModal.addEventListener('click', (event) => {
      if (event.target === elements.licenseModal) {
        elements.licenseModal.classList.remove('active');
      }
    });
  }
  
  // Author modal click outside to close
  if (elements.authorModal) {
    elements.authorModal.addEventListener('click', (event) => {
      if (event.target === elements.authorModal) {
        elements.authorModal.classList.remove('active');
      }
    });
  }
  
  // Quick jump modal click outside to close
  if (elements.quickJump) {
    elements.quickJump.addEventListener('click', (event) => {
      if (event.target === elements.quickJump) {
        elements.quickJump.classList.remove('active');
        state.quickJumpIndex = 0;
      }
    });
  }
  
  // Quick jump item clicks (event delegation)
  if (elements.quickJumpItems) {
    elements.quickJumpItems.addEventListener('click', (event) => {
      const item = event.target.closest('.quick-jump-item');
      if (item) {
        event.preventDefault();
        handleQuickJump(item.dataset.areaId);
      }
    });
  }
}

// Toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  updateThemeIcon();
}

// Search functionality with filtering
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase().trim();
  state.searchTerm = searchTerm;
  
  // Show/hide clear button
  if (searchTerm) {
    elements.clearSearch.classList.remove('hidden');
  } else {
    elements.clearSearch.classList.add('hidden');
  }
  
  // Clear previous highlights
  clearHighlights();
  
  if (!searchTerm) {
    // Reset view when search is cleared
    elements.focusAreas.forEach(area => {
      area.style.display = '';
      area.classList.remove('expanded', 'highlighted');
      // Show all subcategories and controls
      area.querySelectorAll('.subcategory, .control').forEach(item => {
        item.style.display = '';
      });
    });
    updateSearchResults(0);
    return;
  }
  
  let matchCount = 0;
  let matchedControlsCount = 0;
  
  elements.focusAreas.forEach(area => {
    let areaHasMatch = false;
    
    // Check focus area header
    const header = area.querySelector('.focus-area-header');
    const headerMatches = header.textContent.toLowerCase().includes(searchTerm);
    
    // Check focus area content (description and business rationale)
    const content = area.querySelector('.focus-area-content');
    const contentMatches = content.textContent.toLowerCase().includes(searchTerm);
    
    // Check subcategories and controls
    const subcategories = area.querySelectorAll('.subcategory');
    
    subcategories.forEach(subcategory => {
      let subcategoryHasMatch = false;
      const controls = subcategory.querySelectorAll('.control');
      
      controls.forEach(control => {
        let controlHasMatch = false;
        const controlContent = control.textContent.toLowerCase();
        
        // Check control content
        if (controlContent.includes(searchTerm)) {
          controlHasMatch = true;
          subcategoryHasMatch = true;
          matchedControlsCount++;
          
          // Check if match is in implementation guidance and expand it
          const implDetails = control.querySelector('.implementation-details');
          if (implDetails && implDetails.textContent.toLowerCase().includes(searchTerm)) {
            const implList = implDetails.querySelector('.implementation-list');
            const implHeader = implDetails.querySelector('.implementation-header');
            if (implList) {
              implList.style.display = 'block';
              implHeader?.classList.add('expanded');
            }
          }
        }
        
        if (controlHasMatch) {
          control.style.display = '';
          highlightMatches(control, searchTerm);
        } else {
          control.style.display = 'none';
        }
      });
      
      // Check subcategory header
      const subcatHeader = subcategory.querySelector('.subcategory-header');
      if (subcatHeader && subcatHeader.textContent.toLowerCase().includes(searchTerm)) {
        subcategoryHasMatch = true;
        highlightMatches(subcatHeader, searchTerm);
        // Show all controls if subcategory matches
        controls.forEach(control => {
          control.style.display = '';
        });
      }
      
      if (subcategoryHasMatch) {
        subcategory.style.display = '';
        areaHasMatch = true;
        highlightMatches(subcategory, searchTerm);
      } else {
        subcategory.style.display = 'none';
      }
    });
    
    // Show area if it has any matches
    if (areaHasMatch || headerMatches || contentMatches) {
      area.style.display = '';
      area.classList.add('expanded');
      matchCount++;
      
      // Highlight matches in different sections
      if (headerMatches) {
        highlightMatches(header, searchTerm);
      }
      
      if (contentMatches) {
        // Highlight in description and business rationale sections
        const sections = area.querySelectorAll('.focus-area-section');
        sections.forEach(section => {
          if (section.textContent.toLowerCase().includes(searchTerm)) {
            highlightMatches(section, searchTerm);
          }
        });
      }
    } else {
      area.style.display = 'none';
    }
  });
  
  updateSearchResults(matchCount, matchedControlsCount);
  updateBreadcrumb(searchTerm, matchCount);
}

// Highlight search matches
function highlightMatches(element, searchTerm) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (node.nodeValue.toLowerCase().includes(searchTerm)) {
      textNodes.push(node);
    }
  }
  
  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const text = textNode.nodeValue;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    const parts = text.split(regex);
    
    const fragment = document.createDocumentFragment();
    parts.forEach(part => {
      if (part.toLowerCase() === searchTerm) {
        const highlight = document.createElement('span');
        highlight.className = 'highlight';
        highlight.textContent = part;
        fragment.appendChild(highlight);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });
    
    parent.replaceChild(fragment, textNode);
  });
}

// Clear all highlights
function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
}

// Handle navigation filter
function handleNavFilter(event) {
  const filter = event.target.dataset.filter;
  const pill = event.target;
  
  // Toggle the focus area
  if (state.activeFocusAreas.has(filter)) {
    state.activeFocusAreas.delete(filter);
    pill.classList.remove('active');
  } else {
    state.activeFocusAreas.add(filter);
    pill.classList.add('active');
  }
  
  applyFilters();
}

// Apply area filter
function applyFilters() {
  elements.focusAreas.forEach(area => {
    const areaId = area.dataset.areaId;
    if (state.activeFocusAreas.has(areaId)) {
      area.style.display = '';
    } else {
      area.style.display = 'none';
    }
  });
  
  // Update pill styles
  elements.navPills.forEach(pill => {
    const filter = pill.dataset.filter;
    if (state.activeFocusAreas.has(filter)) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

// Handle area expansion toggle
function handleAreaToggle(event) {
  console.log('Focus area clicked');
  event.preventDefault();
  event.stopPropagation();
  
  const focusArea = event.currentTarget.closest('.focus-area');
  if (!focusArea) {
    console.error('Could not find focus area element');
    return;
  }
  
  const areaId = focusArea.dataset.areaId;
  console.log('Toggling area:', areaId);
  
  if (state.expandedAreas.has(areaId)) {
    state.expandedAreas.delete(areaId);
    focusArea.classList.remove('expanded');
    console.log('Collapsed area:', areaId);
  } else {
    state.expandedAreas.add(areaId);
    focusArea.classList.add('expanded');
    console.log('Expanded area:', areaId);
  }
}

// Handle implementation details toggle
function handleImplementationToggle(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const header = event.currentTarget;
  const details = header.parentElement;
  const list = details.querySelector('.implementation-list');
  
  if (!list) return;
  
  // Toggle visibility
  if (list.style.display === 'block') {
    list.style.display = 'none';
    header.classList.remove('expanded');
  } else {
    list.style.display = 'block';
    header.classList.add('expanded');
  }
}

// Update search results display
function updateSearchResults(areaCount, controlCount) {
  if (elements.searchResults) {
    if (state.searchTerm) {
      let resultText = `Found ${areaCount} matching area${areaCount !== 1 ? 's' : ''}`;
      if (controlCount !== undefined && controlCount > 0) {
        resultText += ` with ${controlCount} matching control${controlCount !== 1 ? 's' : ''}`;
      }
      elements.searchResults.textContent = resultText;
    } else {
      elements.searchResults.textContent = '';
    }
  }
}

// Update breadcrumb navigation
function updateBreadcrumb(searchTerm, matchCount) {
  if (!elements.breadcrumb) return;
  
  elements.breadcrumb.innerHTML = `
    <span class="breadcrumb-item" onclick="resetFilters()">Focus Areas</span>
    ${searchTerm ? `
      <span class="breadcrumb-separator">›</span>
      <span class="breadcrumb-item">Search: "${searchTerm}" (${matchCount} results)</span>
    ` : ''}
  `;
}

// Reset all filters
function resetFilters() {
  state.searchTerm = '';
  
  elements.searchInput.value = '';
  elements.clearSearch.classList.add('hidden');
  
  clearHighlights();
  
  elements.focusAreas.forEach(area => {
    area.style.display = '';
    area.classList.remove('expanded', 'highlighted');
    // Show all subcategories and controls
    area.querySelectorAll('.subcategory, .control').forEach(item => {
      item.style.display = '';
    });
  });
  
  updateSearchResults(0);
  updateBreadcrumb('', 0);
}

// Render quick jump menu
function renderQuickJump() {
  if (!elements.quickJumpItems) return;
  
  const jumpLinks = Array.from(elements.focusAreas).map((area, index) => {
    const id = area.dataset.areaId;
    const name = area.querySelector('.focus-area-header h2').textContent;
    return `<a href="#${id}" class="quick-jump-item" data-area-id="${id}" data-index="${index}">${name}</a>`;
  }).join('');
  
  elements.quickJumpItems.innerHTML = jumpLinks;
}

// Handle quick jump navigation
function handleQuickJump(areaId) {
  const targetArea = document.querySelector(`[data-area-id="${areaId}"]`);
  
  if (targetArea) {
    // Close modal
    elements.quickJump.classList.remove('active');
    state.quickJumpIndex = 0;
    
    // Jump to area
    targetArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetArea.classList.add('expanded');
    state.expandedAreas.add(areaId);
    
    // Highlight briefly
    targetArea.classList.add('highlighted');
    setTimeout(() => targetArea.classList.remove('highlighted'), 2000);
  }
}

// Update quick jump selection
function updateQuickJumpSelection() {
  const items = elements.quickJumpItems.querySelectorAll('.quick-jump-item');
  items.forEach((item, index) => {
    if (index === state.quickJumpIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + F - Focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      elements.searchInput.focus();
    }
    
    // Ctrl/Cmd + K - Toggle quick jump modal
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      event.stopPropagation();
      if (elements.quickJump) {
        elements.quickJump.classList.toggle('active');
        if (elements.quickJump.classList.contains('active')) {
          state.quickJumpIndex = 0;
          updateQuickJumpSelection();
        }
      }
      return false; // Extra prevention for browser default
    }
    
    // Escape - Close modals or clear search
    if (event.key === 'Escape') {
      if (elements.authorModal && elements.authorModal.classList.contains('active')) {
        elements.authorModal.classList.remove('active');
      } else if (elements.licenseModal && elements.licenseModal.classList.contains('active')) {
        elements.licenseModal.classList.remove('active');
      } else if (elements.quickJump && elements.quickJump.classList.contains('active')) {
        elements.quickJump.classList.remove('active');
        state.quickJumpIndex = 0;
      } else if (state.searchTerm) {
        resetFilters();
      }
    }
    
    // Arrow navigation in quick jump
    if (elements.quickJump && elements.quickJump.classList.contains('active')) {
      const items = elements.quickJumpItems.querySelectorAll('.quick-jump-item');
      const maxIndex = items.length - 1;
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        state.quickJumpIndex = Math.min(state.quickJumpIndex + 1, maxIndex);
        updateQuickJumpSelection();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        state.quickJumpIndex = Math.max(state.quickJumpIndex - 1, 0);
        updateQuickJumpSelection();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const selectedItem = items[state.quickJumpIndex];
        if (selectedItem) {
          handleQuickJump(selectedItem.dataset.areaId);
        }
      }
    }
    
    // Ctrl/Cmd + E - Toggle expand/collapse all
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      const allExpanded = Array.from(elements.focusAreas).every(area => 
        area.classList.contains('expanded')
      );
      
      if (allExpanded) {
        collapseAll();
      } else {
        expandAll();
      }
    }
  });
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Print preparation
window.addEventListener('beforeprint', () => {
  elements.focusAreas.forEach(area => {
    area.classList.add('expanded');
  });
  document.querySelectorAll('.implementation-list').forEach(list => {
    list.classList.remove('hidden');
  });
});

// Expand all focus areas
function expandAll() {
  elements.focusAreas.forEach(area => {
    area.classList.add('expanded');
    state.expandedAreas.add(area.dataset.areaId);
  });
}

// Collapse all focus areas
function collapseAll() {
  elements.focusAreas.forEach(area => {
    area.classList.remove('expanded');
  });
  state.expandedAreas.clear();
}

// Turn all areas on
function allAreasOn() {
  state.activeFocusAreas = new Set(['FA1', 'FA2', 'FA3', 'FA4', 'FA5']);
  applyFilters();
}

// Turn all areas off
function allAreasOff() {
  state.activeFocusAreas.clear();
  applyFilters();
}

// Export for potential external use
window.odsfFramework = {
  resetFilters,
  expandAll,
  collapseAll,
  allAreasOn,
  allAreasOff
};