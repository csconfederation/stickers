# CSC Signature Overlay Tool

A professional web application for creating custom signature overlays on CSC (Counter-Strike Confederation) team assets. Transform team backgrounds with personalized signatures through drawing or image uploads.

## 🌟 Features

### Core Functionality
- **Multi-Asset Support**: Profile pictures, banners (Discord, Twitter, YouTube, Twitch), desktop backgrounds, and stickers
- **Signature Tools**: Draw signatures with adjustable brush size/color/stroke or upload custom images
- **Transform Controls**: Scale, rotate, move, and adjust opacity with precision controls
- **Background Customization**: Custom backgrounds for sticker assets (solid colors, gradients, transparent)
- **Automatic State Persistence**: Your work is automatically saved in browser storage

### Advanced Features
- **22 Team Support**: All CSC franchise teams with official assets
- **Real-time Preview**: Instant updates as you modify settings
- **Keyboard Shortcuts**: Delete (remove signature), Ctrl+E (export)
- **Toast Notifications**: User feedback for all actions
- **Responsive Design**: Works on desktop and tablet devices

## 🚀 Quick Start

### Local Development
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stickers
   ```

2. **Start a local server**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### Usage
1. **Select Team & Asset**: Choose a CSC team and asset type from the dropdown menus
2. **Add Signature**: Either draw a signature (with optional stroke outline) or upload an image file
3. **Customize**: Use transform controls to position, scale, rotate, and adjust opacity
4. **Background**: For sticker assets, customize the background color or gradient
5. **Export**: Download your custom overlay as a PNG file

## 📁 Project Structure

```
stickers/
├── index.html              # Main application entry point
├── css/
│   └── styles.css          # Modern CSS with variables and responsive design
├── js/
│   ├── app.js              # Main application class and initialization
│   ├── config.js           # Team configurations and constants
│   └── modules/
│       ├── canvas.js       # Canvas rendering and drawing management
│       ├── signature.js    # Signature creation and handling
│       ├── transform.js    # Transform controls and interactions
│       └── utils.js        # Utility functions and helpers
├── teams/                  # Team asset directories (22 teams)
│   ├── ACA/               # The Academics
│   ├── ATL/               # Atlantis
│   ├── [...]              # Additional teams
│   └── WIZ/               # Counter-Spell
└── docs/                  # Documentation files
```

## 🎮 Supported Teams

The application supports all 22 CSC franchise teams:

| Team | Prefix | Full Name |
|------|--------|-----------|
| ACA | ACA | The Academics |
| ATL | ATL | Atlantis |
| ATO | ATO | Automata |
| AVI | AVI | The Aviary |
| BS | BS | Big Slime |
| COW | COW | What Do You Beef |
| CSC | CSC | CSC |
| dB | dB | Dead Beats |
| DRG | DRG | Pact of Embers |
| FRG | FRG | The Toad-em Pole |
| GF | GF | Gone Fishin' |
| GRN | GRN | The Greenhouse |
| H4K | H4K | H4ck3r H4v3n |
| HG | HG | Headhunter's Guild |
| HR | HR | The High Rollers |
| NAN | NAN | NAdes |
| OS | OS | Order of the Samurai |
| SAV | SAV | The Savanna |
| TEE | TEE | The 19th Hole |
| TSC | TSC | The Starling Corporation |
| UPS | UPS | Upsetti Spaghetti |
| WIZ | WIZ | Counter-Spell |

## 🖼️ Asset Types

Each team includes the following asset types:

| Asset Type | Dimensions | Description |
|------------|------------|-------------|
| Profile Picture | 512×512 | Square profile image |
| Discord Banner | 1200×480 | Discord server banner |
| Twitter Banner | 1500×500 | Twitter/X header image |
| YouTube Banner | 2560×1440 | YouTube channel art |
| Twitch Banner | 1920×480 | Twitch channel banner |
| Desktop Background | 1920×1080 | Full HD wallpaper |
| Sticker | 512×512 | Square sticker design |
| Sticker Shadow | 512×512 | Sticker with shadow effect |

## 🔧 Technical Details

### Architecture
- **Vanilla JavaScript**: ES6 modules with no external dependencies
- **Client-side Only**: No backend required
- **Modern Web Standards**: Uses Canvas API, FileReader API, localStorage
- **Modular Design**: Separate modules for different functionality

### Browser Compatibility
- **Chrome/Edge**: 88+ (Full support)
- **Firefox**: 85+ (Full support)
- **Safari**: 14+ (Full support)
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+

### Security Features
- Input validation and sanitization
- XSS protection
- File type and size validation
- Memory usage monitoring
- Error boundaries and graceful degradation

## 🎨 Customization

### Adding New Teams
1. Create team directory in `teams/[PREFIX]/`
2. Add team assets with standard filenames
3. Update `TEAMS` array in `js/config.js`

### Modifying Asset Types
1. Update `ASSET_TYPES` object in `js/config.js`
2. Ensure corresponding files exist in team directories
3. Test with multiple teams to verify compatibility

## 🛠️ Development

### Code Style
- ES6+ JavaScript with modules
- CSS custom properties for theming
- Semantic HTML structure
- Mobile-first responsive design

### Performance
- Debounced rendering for smooth interactions
- Memory usage monitoring
- Efficient canvas operations
- Lazy loading for large assets

### Testing
- Cross-browser testing recommended
- Test file uploads with various formats
- Verify localStorage functionality
- Check performance with large images

## 📝 License

This project is part of the Counter-Strike Confederation (CSC) ecosystem. Please respect team trademarks and logos.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the documentation in `/docs/`
- Review the code comments
- Test in a fresh browser session
- Clear localStorage if experiencing issues

## 🏆 Credits

- **Development**: chobits (2025)
- **Sticker Designs**: spideY and chobits
- **Team Assets**: CSC Franchise Teams
- **Architecture**: Modular ES6 JavaScript

---

Made with ❤️ for the Counter-Strike Confederation community.