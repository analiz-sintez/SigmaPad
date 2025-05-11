/**
 * Server-side hooks for the private notes plugin
 */

// Add detailed logging to track when hooks are registered
console.log("========================================");
console.log("Loading ep_private_notes plugin");
console.log("========================================");

// Commenting out the directDOMInjection script to prevent duplication
/*
const directDOMInjection = `
  (function() {
    console.log("🟢 Direct DOM injection for private notes panel");
    
    // Wait for the document to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPrivateNotes);
    } else {
      initPrivateNotes();
    }
    
    function initPrivateNotes() {
      // Create debug message
      const debugDiv = document.createElement('div');
      debugDiv.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 10px;
        background: rgba(0,100,0,0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        z-index: 9999;
        font-family: monospace;
      `;
      debugDiv.textContent = "🟢 Direct DOM injection: Private Notes initialized";
      document.body.appendChild(debugDiv);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(debugDiv)) {
          document.body.removeChild(debugDiv);
        }
      }, 5000);
      
      // Add test button
      setTimeout(() => {
        if (!document.getElementById('directTestButton')) {
          const testButton = document.createElement('button');
          testButton.id = 'directTestButton';
          testButton.textContent = 'DIRECT TOGGLE';
          testButton.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 10px;
            z-index: 9999;
            padding: 10px;
            background: green;
            color: white;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          `;
          testButton.addEventListener('click', () => {
            if (typeof window.togglePrivateNotes === 'function') {
              window.togglePrivateNotes();
            } else {
              alert('Private Notes Toggle function not available');
            }
          });
          document.body.appendChild(testButton);
        }
      }, 3000);
    }
  })();
`;
*/

// Properly export client hooks for Etherpad
exports.eejsBlock_scripts = function (hook_name, args, cb) {
  console.log("Adding script tag for ep_private_notes");
  
  // Use a more specific script tag with cache busting
  const timestamp = Date.now();
  args.content += `
    <script>
      console.log("EP_PRIVATE_NOTES: Script tag injected at ${timestamp}");
    </script>
    <script src="../static/plugins/ep_private_notes/static/js/main.js?t=${timestamp}"></script>
    <!-- Removed directDOMInjection to prevent duplication -->
  `;
  
  return cb();
};

exports.eejsBlock_styles = function (hook_name, args, cb) {
  console.log("Adding style tag for ep_private_notes");
  
  // Use a more specific style tag with cache busting
  const timestamp = Date.now();
  args.content += `
    <style>
      /* Ensure the private notes panel has high z-index */
      #privateNotesArea {
        z-index: 999 !important;
        background: #f5f5f5 !important;
        border-left: 1px solid #ccc !important;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        width: 300px !important;
        overflow: hidden !important;
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
      }
      .resizer {
        width: 6px !important;
        background-color: #aaa !important;
        cursor: col-resize !important;
        position: fixed !important; 
        top: 0 !important;
        bottom: 0 !important;
        z-index: 1000 !important;
      }
      .personal-notes-content {
        padding: 10px !important;
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        box-sizing: border-box !important;
      }
      .personal-notes-content h2 {
        margin-top: 0 !important;
        padding-bottom: 10px !important;
        border-bottom: 1px solid #ddd !important;
      }
      .personal-notes-content textarea {
        flex: 1 !important;
        resize: none !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        padding: 8px !important;
      }
    </style>
    <link href="../static/plugins/ep_private_notes/static/css/private_notes.css?t=${timestamp}" rel="stylesheet">
  `;
  
  return cb();
};

exports.clientVars = (hook, context, callback) => {
  console.log("Setting clientVars for ep_private_notes");
  
  // Add some client vars that might be helpful for debugging
  context.clientVars.ep_private_notes = {
    loaded: true,
    version: "1.0.0",
    timestamp: Date.now()
  };
  
  return callback();
}; 