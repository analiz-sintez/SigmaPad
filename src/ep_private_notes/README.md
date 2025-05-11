# Etherpad Private Notes Plugin

This plugin adds a resizable private notes panel to the right side of Etherpad. Users can take notes that are private to their local browser session, completely separate from the collaborative pad content.

## Features

- Resizable notes panel that appears on the right side
- Notes are automatically saved to browser localStorage
- Toggle visibility with a toolbar button
- Notes are private and never sent to the server
- Responsive design that works on various screen sizes

## Installation

Install this plugin using npm:

```bash
cd /path/to/etherpad-lite
npm install ep_private_notes
```

Or clone it directly:

```bash
cd /path/to/etherpad-lite/node_modules
git clone https://github.com/yourusername/ep_private_notes.git
cd ep_private_notes
npm install
```

Then restart your Etherpad instance.

## Usage

1. Click the private notes button in the toolbar (note icon)
2. A panel will appear on the right side of the pad
3. Take notes that remain private to your browser
4. Drag the left edge of the panel to resize
5. Click the button again to hide the panel

## Development

### Structure

- `static/js/main.js` - Main client-side code
- `static/css/private_notes.css` - Styles for the plugin
- `package.json` - Plugin metadata and Etherpad hook registration

### Local Development

To modify this plugin:

1. Clone the repository
2. Make your changes
3. Test with a local Etherpad instance
4. Submit pull requests for improvements

## License

Apache License 2.0 