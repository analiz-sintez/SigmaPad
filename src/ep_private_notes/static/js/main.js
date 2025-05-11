// Ensure our namespace exists
if (typeof window.plugins === 'undefined') window.plugins = {};
if (typeof window.plugins.ep_private_notes === 'undefined') window.plugins.ep_private_notes = {};

// CRITICAL: Add global flag to prevent duplicate initialization
if (typeof window.ep_private_notes_initialized === 'undefined') {
  window.ep_private_notes_initialized = false;
}

(function() {
  'use strict';
  
  console.log("🔴 Private Notes: Script initializing at " + new Date().toISOString());
  
  // Check if we're already initialized to prevent duplicates
  if (window.ep_private_notes_initialized) {
    console.log("🔴 Private Notes: Already initialized, skipping duplicate initialization");
    return;
  }
  
  // Store private notes in memory (will be lost on page refresh)
  // In a production version, this should be stored in localStorage or on the server
  let privateNotes = '';
  let sidebarVisible = false;
  let mainEditorContainer = null;
  
  // Define our hooks object that Etherpad will look for
  var hooks = {
    postAceInit: function(hook, context) {
      console.log("🔴 Private Notes: postAceInit hook called");
      console.log("🔴 Private Notes: Current document URL:", window.location.href);
      console.log("🔴 Private Notes: Current document title:", document.title);
      
      // First, remove any existing panels to prevent duplicates
      cleanupExistingPanels();
      
      loadStylesheet();
      
      // Add a small delay to ensure Etherpad is fully initialized
      setTimeout(() => {
        setupPrivateNotesPanel();
        addToolbarButton();
        
        // Log all available iframes
        const iframes = document.querySelectorAll('iframe');
        console.log(`🔴 Private Notes: Found ${iframes.length} iframes on page`);
        iframes.forEach((iframe, i) => {
          console.log(`🔴 Private Notes: Iframe ${i}: name=${iframe.name}, id=${iframe.id}`);
        });
        
        // Log all potential editor containers
        ['#outerdocbody', '#innerdocbody', '#editorcontainer', '#padouter', '#padinner'].forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            console.log(`🔴 Private Notes: Found ${selector}:`, 
              {id: element.id, className: element.className, position: window.getComputedStyle(element).position});
          }
        });
        
        // Set global flag to indicate we're initialized
        window.ep_private_notes_initialized = true;
      }, 500);
    }
  };
  
  // Clean up any existing panels before adding new ones
  function cleanupExistingPanels() {
    console.log("🔴 Private Notes: Cleaning up any existing panels");
    
    // Remove any existing panels
    const existingPanels = document.querySelectorAll('.personal-notes-area, #privateNotesArea');
    existingPanels.forEach(panel => {
      console.log("🔴 Private Notes: Removing existing panel:", panel.id || panel.className);
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    });
    
    // Remove any existing wrappers
    const existingWrappers = document.querySelectorAll('#ep_private_notes_wrapper, #ep_private_notes_wrapper_absolute');
    existingWrappers.forEach(wrapper => {
      console.log("🔴 Private Notes: Removing existing wrapper:", wrapper.id || wrapper.className);
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    });
    
    // Remove any existing resizers
    const existingResizers = document.querySelectorAll('.resizer, #privateNotesResizer');
    existingResizers.forEach(resizer => {
      console.log("🔴 Private Notes: Removing existing resizer:", resizer.id || resizer.className);
      if (resizer.parentNode) {
        resizer.parentNode.removeChild(resizer);
      }
    });
  }
  
  // Find the main editor container - helper function
  function findEditorContainer() {
    console.log("🔴 Private Notes: Starting to find editor container");
    
    // Try to locate the proper container in order of preference
    const containers = [
      '#outerdocbody',      // Main content area
      '#innerdocbody',      // Inner content area
      '#editorcontainer',   // Editor container
      '#padeditor',         // Pad editor
      '#padinner',          // Inner pad area
      '.pad-editor',        // Pad editor class
      '#editor',            // Generic editor
      'iframe[name="ace_outer"]' // Outer iframe
    ];
    
    let container = null;
    
    // First try the ace_outer iframe contents if possible
    const outerIframe = document.querySelector('iframe[name="ace_outer"]');
    if (outerIframe && outerIframe.contentDocument) {
      try {
        console.log("🔴 Private Notes: Found ace_outer iframe, checking its document");
        container = outerIframe.contentDocument.querySelector('#outerdocbody');
        if (container) {
          console.log("🔴 Private Notes: Found #outerdocbody in ace_outer iframe");
          console.log("🔴 Private Notes: Container dimensions:", container.offsetWidth, "x", container.offsetHeight);
          console.log("🔴 Private Notes: Container computed style:", {
            position: window.getComputedStyle(container).position,
            display: window.getComputedStyle(container).display,
            overflow: window.getComputedStyle(container).overflow
          });
          return container;
        }
      } catch (err) {
        console.error("🔴 Private Notes ERROR: Error accessing iframe content:", err);
      }
    }
    
    // Otherwise try the main document
    for (const selector of containers) {
      container = document.querySelector(selector);
      if (container) {
        console.log(`🔴 Private Notes: Found editor container: ${selector}`);
        console.log("🔴 Private Notes: Container dimensions:", container.offsetWidth, "x", container.offsetHeight);
        console.log("🔴 Private Notes: Container computed style:", {
          position: window.getComputedStyle(container).position,
          display: window.getComputedStyle(container).display,
          overflow: window.getComputedStyle(container).overflow
        });
        
        // Additional check if this is a valid container for us to modify
        if (container.offsetWidth < 50 || container.offsetHeight < 50) {
          console.log(`🔴 Private Notes: Container ${selector} is too small, likely not suitable`);
          continue;
        }
        
        return container;
      }
    }
    
    // Last resort is the editor div
    container = document.querySelector('#editor');
    if (!container) {
      console.error("🔴 Private Notes: No suitable container found, using body");
      container = document.body;
      console.log("🔴 Private Notes: Using document.body as fallback container");
    }
    
    if (container) {
      console.log("🔴 Private Notes: Container dimensions:", container.offsetWidth, "x", container.offsetHeight);
    }
    
    return container;
  }
  
  // Load the external CSS file
  function loadStylesheet() {
    console.log("🔴 Private Notes: Loading stylesheet");
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '../static/plugins/ep_private_notes/static/css/private_notes.css?t=' + Date.now();
    document.head.appendChild(link);
    
    // Use clean CSS without !important flags
    const style = document.createElement('style');
    style.textContent = `
      .personal-notes-area {
        background: #f5f5f5;
        border-left: 1px solid #ccc;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 300px;
        min-width: 200px;
        overflow: hidden;
        flex-shrink: 0;
        z-index: 10; /* Ensure it's above content but below toolbar */
      }
      
      .personal-notes-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 10px;
        box-sizing: border-box;
        pointer-events: auto; /* Ensure events are not blocked */
      }

      .personal-notes-content h2 {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid #ddd;
      }

      .personal-notes-content textarea {
        flex: 1;
        resize: none;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        pointer-events: auto; /* Ensure events are not blocked */
      }
      
      .resizer {
        width: 6px;
        background-color: #aaa;
        cursor: col-resize;
        flex-shrink: 0;
        z-index: 11; /* Slightly above the panel */
        pointer-events: auto; /* Ensure the resizer can be clicked */
      }

      /* Helper class for the editor container */
      .ep-private-notes-enabled {
        display: flex !important;
        width: 100% !important;
        height: 100% !important;
        position: relative !important;
        pointer-events: auto; /* Ensure events are not blocked */
      }

      /* Ensure the editor takes available space and captures events */
      .ep-private-notes-enabled > div:first-child:not(.personal-notes-area):not(.resizer) {
        flex: 1;
        min-width: 0;
        pointer-events: auto !important; /* Ensure the editor captures events */
      }
      
      /* Fix absolute positioned content */
      .ep-private-notes-wrapper-absolute {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        pointer-events: none; /* Don't block events to editor */
        z-index: 10;
      }
      
      /* Fix for clickable editor in absolute mode */
      #editorcontainer, #outerdocbody, #innerdocbody, .ace-inner {
        pointer-events: auto !important;
      }
      
      /* Fix for clickable editor content */
      .ace_content {
        pointer-events: auto !important;
      }
      
      /* Make sure all ace editor elements can receive clicks */
      .ace_editor *, .ace_text-input, .ace_content * {
        pointer-events: auto !important;
      }
      
      /* Make sure iframes can be clicked through */
      iframe {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
    console.log("🔴 Private Notes: Stylesheet loaded");
  }
  
  // Function to set up the private notes panel to be side-by-side with the editor
  function setupPrivateNotesPanel() {
    console.log("🔴 Private Notes: Setting up private notes panel");
    
    // Create the private notes panel
    const privateNotesPanel = document.createElement('div');
    privateNotesPanel.className = 'personal-notes-area';
    privateNotesPanel.id = 'privateNotesArea';
    privateNotesPanel.style.display = 'flex';
    console.log("🔴 Private Notes: Created panel element with ID:", privateNotesPanel.id);
    
    // Create the resizer element
    const resizer = document.createElement('div');
    resizer.className = 'resizer';
    resizer.id = 'privateNotesResizer';
    console.log("🔴 Private Notes: Created resizer with ID:", resizer.id);
    
    // Create the content for private notes
    const notesContent = document.createElement('div');
    notesContent.className = 'personal-notes-content';
    
    // Add a title
    const title = document.createElement('h2');
    title.textContent = 'Private Notes';
    notesContent.appendChild(title);
    
    // Add a textarea for notes
    const textarea = document.createElement('textarea');
    textarea.id = 'privateNotesText';
    textarea.placeholder = 'Your private notes here...';
    textarea.value = privateNotes;
    console.log("🔴 Private Notes: Created textarea with ID:", textarea.id);
    
    // Save notes as user types
    textarea.addEventListener('input', function(e) {
      privateNotes = e.target.value;
      console.log("🔴 Private Notes: Updated notes content, length:", privateNotes.length);
      // Save to localStorage for persistence
      localStorage.setItem('privateNotes', privateNotes);
    });
    
    notesContent.appendChild(textarea);
    privateNotesPanel.appendChild(notesContent);
    
    // Find main editor container
    mainEditorContainer = findEditorContainer();
    
    console.log("🔴 Private Notes: Main editor container found:", {
      id: mainEditorContainer.id,
      tagName: mainEditorContainer.tagName,
      className: mainEditorContainer.className
    });
    
    // APPROACH: Use absolute positioning for best compatibility and to avoid interfering with editor
    console.log("🔴 Private Notes: Using absolute positioning for optimal compatibility");
    
    // Create a wrapper for absolute positioning
    const absoluteWrapper = document.createElement('div');
    absoluteWrapper.id = 'ep_private_notes_wrapper_absolute';
    absoluteWrapper.className = 'ep-private-notes-wrapper-absolute';
    absoluteWrapper.style.display = 'flex';
    absoluteWrapper.style.pointerEvents = 'none';
    
    // Add the resizer and panel to the absolute wrapper
    absoluteWrapper.appendChild(resizer);
    absoluteWrapper.appendChild(privateNotesPanel);
    
    // Add pointer-events: auto to the panel and resizer
    resizer.style.pointerEvents = 'auto';
    privateNotesPanel.style.pointerEvents = 'auto';
    
    // Add to the body
    document.body.appendChild(absoluteWrapper);
    
    console.log("🔴 Private Notes: Added absolute positioned wrapper to body");
    
    // Make sure the mainEditorContainer is still clickable
    if (mainEditorContainer) {
      mainEditorContainer.style.pointerEvents = 'auto';
      console.log("🔴 Private Notes: Set pointer-events: auto on main editor container");
    }
    
    // Make all editor iframes clickable
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.style.pointerEvents = 'auto';
    });
    
    // Set up the resizer functionality
    setupResizer(resizer, privateNotesPanel, mainEditorContainer);
    
    // Load previously saved notes if any
    const savedNotes = localStorage.getItem('privateNotes');
    if (savedNotes) {
      privateNotes = savedNotes;
      textarea.value = privateNotes;
      console.log("🔴 Private Notes: Loaded saved notes from localStorage");
    }
    
    console.log("🔴 Private Notes: Private notes panel created and ready");
    
    // Additional step to ensure clickability
    setTimeout(fixEditorClickability, 1000);
  }
  
  // Function to ensure editor is clickable
  function fixEditorClickability() {
    console.log("🔴 Private Notes: Fixing editor clickability");
    
    // Find all ACE editor elements and ensure they're clickable
    const editorElements = document.querySelectorAll('.ace_editor, .ace_content, .ace_text-input, .ace_text-layer');
    editorElements.forEach(element => {
      element.style.pointerEvents = 'auto';
    });
    
    // Find all iframes and ensure they're clickable
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.style.pointerEvents = 'auto';
      
      // Try to access iframe contents to fix clickability inside them too
      try {
        if (iframe.contentDocument) {
          const innerElements = iframe.contentDocument.querySelectorAll('body, div, .ace_editor, .ace_content');
          innerElements.forEach(element => {
            element.style.pointerEvents = 'auto';
          });
        }
      } catch (err) {
        console.log("🔴 Private Notes: Could not access iframe contents:", err);
      }
    });
    
    console.log("🔴 Private Notes: Clickability fixes applied");
  }
  
  // Updated resizer function to work with flexbox layout
  function setupResizer(resizer, privateNotesPanel, editorContainer) {
    console.log("🔴 Private Notes: Setting up resizer");
    let isResizing = false;
    let lastDownX = 0;
    
    // Get initial sizes
    const initialPanelWidth = privateNotesPanel.offsetWidth;
    const initialWrapperWidth = window.innerWidth;
    
    console.log(`🔴 Private Notes: Initial sizes - Panel: ${initialPanelWidth}px, Window: ${initialWrapperWidth}px`);
    
    resizer.addEventListener('mousedown', function(e) {
      isResizing = true;
      lastDownX = e.clientX;
      
      console.log("🔴 Private Notes: Resizer mousedown at", e.clientX, e.clientY);
      
      // Add event listeners for resize
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      // Add resize styling
      document.body.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.MozUserSelect = 'none';
      
      // Stop event propagation to prevent editor from getting it
      e.stopPropagation();
      e.preventDefault();
      
      console.log("🔴 Private Notes: Resizing started");
    });
    
    function onMouseMove(e) {
      if (!isResizing) return;
      
      // Calculate movement
      const deltaX = lastDownX - e.clientX;
      lastDownX = e.clientX;
      
      // Get current width
      let currentWidth = privateNotesPanel.offsetWidth;
      
      // Calculate new width with constraints
      const newWidth = Math.max(200, Math.min(initialWrapperWidth * 0.5, currentWidth + deltaX));
      
      // Apply new width
      privateNotesPanel.style.width = `${newWidth}px`;
      
      console.log(`🔴 Private Notes: Resized to ${newWidth}px`);
      
      // Stop event propagation
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onMouseUp(e) {
      isResizing = false;
      
      console.log("🔴 Private Notes: Resizer mouseup at", e.clientX, e.clientY);
      
      // Remove event listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Remove resize styling
      document.body.classList.remove('resizing');
      document.body.style.cursor = '';
      
      // Re-enable text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.MozUserSelect = '';
      
      // Ensure editor is clickable
      fixEditorClickability();
      
      // Stop event propagation
      e.stopPropagation();
      e.preventDefault();
      
      console.log("🔴 Private Notes: Resizing stopped");
    }
    
    console.log("🔴 Private Notes: Resizer setup complete");
  }
  
  // Function to toggle the private notes area visibility
  function togglePrivateNotes() {
    console.log("🔴 Private Notes: Toggle function called");
    
    const privateNotesPanel = document.getElementById('privateNotesArea');
    const resizer = document.getElementById('privateNotesResizer');
    const absoluteWrapper = document.getElementById('ep_private_notes_wrapper_absolute');
    
    if (!privateNotesPanel) {
      console.error("🔴 Private Notes ERROR: Panel element not found");
      return;
    }
    
    if (!resizer) {
      console.error("🔴 Private Notes ERROR: Resizer element not found");
      return;
    }
    
    sidebarVisible = !sidebarVisible;
    console.log("🔴 Private Notes: Toggled visibility to:", sidebarVisible);
    
    if (sidebarVisible) {
      // Show private notes
      privateNotesPanel.style.display = 'flex';
      resizer.style.display = 'block';
      if (absoluteWrapper) absoluteWrapper.style.display = 'flex';
      document.body.classList.add('showing-private-notes');
      console.log("🔴 Private Notes: Displayed panel and resizer");
      
      // Get or set initial width
      let notesWidth = privateNotesPanel.style.width ? parseInt(privateNotesPanel.style.width) : 300;
      notesWidth = Math.max(200, Math.min(window.innerWidth * 0.5, notesWidth)); // Apply constraints
      
      // Apply width and position
      privateNotesPanel.style.width = `${notesWidth}px`;
      
      // Adjust main editor width if found
      if (mainEditorContainer && absoluteWrapper) {
        console.log("🔴 Private Notes: Not adjusting main editor width in absolute mode");
      } else if (mainEditorContainer) {
        try {
          console.log("🔴 Private Notes: Main editor before width adjustment:", 
                      {width: mainEditorContainer.style.width, paddingRight: mainEditorContainer.style.paddingRight});
                      
          // Removed width adjustment - let flexbox handle it
          console.log("🔴 Private Notes: No width adjustment needed - flexbox layout");
          
          console.log("🔴 Private Notes: Main editor after width adjustment:", 
                      {width: mainEditorContainer.style.width, paddingRight: mainEditorContainer.style.paddingRight});
        } catch (err) {
          console.error("🔴 Private Notes ERROR: Could not adjust editor width:", err);
        }
      }
      
      // Focus the textarea
      setTimeout(() => {
        const textarea = document.getElementById('privateNotesText');
        if (textarea) textarea.focus();
      }, 100);
      
      // Update toolbar button state
      const noteBtn = document.querySelector('li[data-key="privateNotes"]');
      if (noteBtn) noteBtn.classList.add('active');
      
    } else {
      // Hide private notes
      privateNotesPanel.style.display = 'none';
      resizer.style.display = 'none';
      if (absoluteWrapper) absoluteWrapper.style.display = 'none';
      document.body.classList.remove('showing-private-notes');
      console.log("🔴 Private Notes: Hidden panel and resizer");
      
      // Restore main editor width if found
      if (mainEditorContainer && absoluteWrapper) {
        console.log("🔴 Private Notes: Not restoring main editor width in absolute mode");
      } else if (mainEditorContainer) {
        try {
          // No need to adjust width in flexbox model
          console.log("🔴 Private Notes: No width adjustment needed when hiding panel");
        } catch (err) {
          console.error("🔴 Private Notes ERROR: Could not restore editor width:", err);
        }
      }
      
      // Update toolbar button state
      const noteBtn = document.querySelector('li[data-key="privateNotes"]');
      if (noteBtn) noteBtn.classList.remove('active');
    }
    
    // Load saved notes if available
    if (sidebarVisible) {
      const savedNotes = localStorage.getItem('privateNotes');
      if (savedNotes) {
        privateNotes = savedNotes;
        document.getElementById('privateNotesText').value = privateNotes;
        console.log("🔴 Private Notes: Loaded notes from localStorage");
      }
    }
    
    console.log(`🔴 Private Notes: Panel ${sidebarVisible ? 'opened' : 'closed'}`);
  }
  
  // Function to add the toolbar button
  function addToolbarButton() {
    console.log("🔴 Private Notes: Adding toolbar button");
    
    // Add the button to the toolbar following Etherpad's structure
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) {
      console.error("🔴 Private Notes ERROR: Toolbar not found");
      return;
    }
      
    console.log("🔴 Private Notes: Found toolbar");
      
    // Find the right-side menu
    const menuRight = toolbar.querySelector('ul.menu_right');
    if (!menuRight) {
      console.error("🔴 Private Notes ERROR: Menu right not found");
      return;
    }
      
    console.log("🔴 Private Notes: Found right menu");
      
    // Create a list item to match Etherpad's structure
    const li = document.createElement('li');
    li.setAttribute('data-type', 'button');
    li.setAttribute('data-key', 'privateNotes');
    
    // Create anchor element like other buttons
    const a = document.createElement('a');
    a.setAttribute('data-l10n-id', 'pad.toolbar.privateNotes.title');
    
    // Create button element with SVG icon
    const btn = document.createElement('button');
    btn.className = 'buttonicon buttonicon-privateNotes';
    // Use SVG icon instead of emoji, styled like Etherpad's icons
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display: inline-block; vertical-align: middle;">
      <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"/>
      <path d="M14,10H7v2h7V10z M14,7H7v2h7V7z M14,13H7v2h7V13z M16,7h1v1h-1V7z M16,10h1v1h-1V10z M16,13h1v1h-1V13z"/>
    </svg>`;
    btn.setAttribute('data-l10n-id', 'pad.toolbar.privateNotes.title');
    btn.title = 'Private Notes';
    
    // Assemble the button
    a.appendChild(btn);
    li.appendChild(a);
    
    // Add it right after the embed button or before the showusers button
    const embedButton = menuRight.querySelector('li[data-key="embed"]');
    const showUsersButton = menuRight.querySelector('li[data-key="showusers"]');
    
    if (embedButton) {
      // Insert after the embed button's separator
      const separator = embedButton.nextElementSibling;
      if (separator && separator.className === 'separator') {
        menuRight.insertBefore(li, separator.nextElementSibling);
        console.log("🔴 Private Notes: Added button after embed separator");
      } else {
        menuRight.insertBefore(li, showUsersButton);
        console.log("🔴 Private Notes: Added button before showusers");
      }
    } else {
      // Fallback: insert before showusers button
      menuRight.insertBefore(li, showUsersButton);
      console.log("🔴 Private Notes: Added button before showusers (fallback)");
    }
    
    // Add click handler to the button
    a.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("🔴 Private Notes: Button clicked");
      togglePrivateNotes();
    });
    
    console.log("🔴 Private Notes: Button added successfully");
  }

  // Function to check if plugin is already initialized
  function isPluginInitialized() {
    return document.getElementById('privateNotesArea') !== null;
  }

  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log("🔴 Private Notes: DOM loaded event, initializing...");
      if (typeof exports === 'undefined' && !isPluginInitialized()) {
        // Client-side initialization
        hooks.postAceInit(null, null);
      }
    });
  } else {
    console.log("🔴 Private Notes: DOM already loaded, initializing immediately...");
    if (typeof exports === 'undefined' && !isPluginInitialized()) {
      // Client-side initialization
      hooks.postAceInit(null, null);
    }
  }

  // Clean up initialization logic to ensure it only happens once
  if (typeof exports !== 'undefined') {
    console.log("🔴 Private Notes: Registering hooks through exports");
    exports.postAceInit = hooks.postAceInit;
  } else {
    console.log("🔴 Private Notes: Adding hooks to global ep_private_notes");
    if (typeof window.ep_private_notes === 'undefined') {
      window.ep_private_notes = {};
    }
    window.ep_private_notes.postAceInit = hooks.postAceInit;
    
    // Also register with Etherpad's hook system if available
    if (typeof window.ep_hooks !== 'undefined') {
      window.ep_hooks.register('postAceInit', hooks.postAceInit);
    }
  }
  
  // Expose toggle function globally but not visibly
  window.togglePrivateNotes = togglePrivateNotes;
  
  console.log("🔴 Private Notes: Script initialized");
})(); 