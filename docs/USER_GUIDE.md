# User Guide - CSC Signature Overlay Tool

A comprehensive guide to using the CSC Signature Overlay Tool for creating custom team signature overlays.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Workflow](#basic-workflow)
3. [Interface Overview](#interface-overview)
4. [Creating Signatures](#creating-signatures)
5. [Transform Controls](#transform-controls)
6. [Background Customization](#background-customization)
7. [Auto-Save Feature](#auto-save-feature)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Tips & Best Practices](#tips--best-practices)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements
- Modern web browser (Chrome 100+, Firefox 100+, Safari 16+)
- JavaScript enabled
- Minimum 1024×768 screen resolution
- 50MB available storage for automatic state saving

### First Launch
1. Open the application in your web browser
2. The tool automatically loads with the team selection interface
3. No account creation or login required
4. Your work is automatically saved in your browser

## Basic Workflow

### Step-by-Step Process

1. **Select Team**: Choose your CSC franchise team from the dropdown
2. **Choose Asset**: Select the type of asset you want to customize
3. **Add Signature**: Either draw a signature or upload an image
4. **Position & Style**: Use transform controls to adjust placement and appearance
5. **Customize Background**: (For sticker assets) Set custom background colors or gradients
6. **Export**: Download your finished overlay as a PNG file

### Quick Start Example
```
1. Team: "The Academics (ACA)"
2. Asset: "Discord Banner (1200×480)"
3. Signature: Draw your name with black brush
4. Transform: Scale to 150%, position in bottom-right
5. Export: Save as "ACA_discord_banner_signature.png"
```

## Interface Overview

### Sidebar Sections

#### 1. Background Selection
- **Team Dropdown**: Lists all 22 CSC franchise teams alphabetically
- **Asset Type Dropdown**: Shows available asset types with dimensions
- Automatically loads the selected team's background image

#### 2. Signature Tools
- **Draw Button**: Activate drawing mode with brush tools
- **Upload Button**: Upload image files for signature overlay
- **Drawing Tools** (when active):
  - Clear instruction text: "Draw your signature on the canvas below, then click 'Apply Signature' when finished"
  - Brush size slider (1-20 pixels)
  - Color picker for brush color
  - Stroke width slider (0-10 pixels) - adds outline to drawn strokes
  - Stroke color picker - color for the outline
  - Clear Drawing button
  - Apply Signature button (with checkmark icon)

#### 3. Background Controls (Sticker Assets Only)
- **Background Type**: Choose from Original, Solid, Gradient, or Transparent
- **Solid Color**: Color picker for solid backgrounds
- **Gradient Colors**: Two color pickers for gradient start/end
- **Gradient Direction**: Four direction options for gradients

#### 4. Transform Controls (When Signature Present)
- **Scale Slider**: 10% to 200% size adjustment
- **Rotation Slider**: -180° to 180° rotation
- **Opacity Slider**: 0% to 100% transparency
- **Reset Transform**: Return to default settings
- **Delete Signature**: Remove current signature

#### 5. Export
- **Download Image**: Export final result as PNG

### Main Canvas Area
- **Visual Preview**: Real-time preview of your overlay
- **Transform Handles**: Visual handles for direct manipulation when signature is present
- **Drag Support**: Click and drag signatures to reposition

## Creating Signatures

### Drawing Signatures

#### Starting to Draw
1. Click the **"Draw"** button
2. Adjust brush size (1-20 pixels) using the slider
3. Select brush color with the color picker
4. (Optional) Set stroke width (0-10 pixels) for outline effect
5. (Optional) Choose stroke color for the outline
6. The canvas cursor changes to crosshair mode
7. The canvas border highlights to indicate drawing mode is active
8. A floating tooltip appears to guide you through the drawing process

#### Drawing Techniques
- **Smooth Lines**: Draw slowly for smoother curves
- **Pressure Simulation**: Overlap strokes for varying thickness
- **Corrections**: Use "Clear Drawing" to start over
- **Preview**: Drawing appears in real-time on the background

#### Finishing Drawing
1. Click **"Apply Signature"** when satisfied (button with checkmark icon)
2. The signature is automatically cropped to content
3. Transform controls become available
4. Drawing mode exits automatically

#### Drawing Tips
- Use larger brush sizes (10-15) for bold signatures
- Smaller brushes (3-5) work well for detailed text
- Dark colors (black/dark blue) work well on most backgrounds
- Add stroke outlines for better visibility on complex backgrounds
- Use contrasting stroke colors (white stroke with black brush, or vice versa)
- Set stroke width to 0 for no outline effect
- Keep signatures simple for better visibility

### Uploading Signatures

#### Supported Formats
- **PNG**: Best for signatures with transparency
- **JPG/JPEG**: Good for photo-based signatures
- **GIF**: Supports simple animations (static display)
- **WebP**: Modern format with good compression
- **BMP**: Uncompressed format

#### File Requirements
- **Maximum Size**: 5MB per file
- **Minimum Size**: 100 bytes
- **Maximum Dimensions**: 4096×4096 pixels
- **Recommended**: PNG format for best quality

#### Upload Process
1. Click **"Upload"** button
2. Select **"Choose Image File"**
3. Browse and select your signature file
4. File is validated and processed automatically
5. Transform controls become available

#### Upload Tips
- Use PNG format for transparent backgrounds
- Pre-crop images to reduce file size
- Ensure good contrast with team backgrounds
- Test different formats if upload fails

## Transform Controls

### Positioning
- **Click & Drag**: Click signature and drag to move
- **Precise Control**: Use keyboard arrow keys for fine adjustment
- **Visual Handles**: Blue outline shows signature boundaries

### Scaling
- **Slider Control**: 10% to 200% size adjustment
- **Handle Dragging**: Drag corner handles to resize
- **Proportional**: Scaling maintains aspect ratio
- **Live Preview**: Changes apply in real-time

### Rotation
- **Slider Control**: -180° to 180° rotation range
- **Rotation Handle**: Drag the circular handle above signature
- **Snap Points**: Subtle snapping at 0°, 90°, 180° angles
- **Smooth Rotation**: Continuous rotation with mouse

### Opacity
- **Transparency Control**: 0% (invisible) to 100% (opaque)
- **Blend Effects**: Create subtle watermark effects
- **Layer Control**: Signature always appears above background

### Transform Handles
- **Corner Handles**: Scale by dragging corners
- **Rotation Handle**: Circular handle above signature for rotation
- **Move Area**: Click inside signature bounds to drag
- **Visual Feedback**: Handles highlight on hover

## Background Customization

*Available for Sticker and Sticker Shadow assets only*

### Background Types

#### Original
- Preserves the original team sticker background
- No modifications applied
- Default setting for all assets

#### Solid Color
- **Single Color**: Choose any color using color picker
- **Full Coverage**: Color fills entire background
- **Common Uses**: Clean, professional look

#### Gradient
- **Two Colors**: Start and end colors
- **Four Directions**:
  - Top to Bottom: Vertical gradient
  - Left to Right: Horizontal gradient
  - Diagonal ↘: Top-left to bottom-right
  - Diagonal ↙: Top-right to bottom-left
- **Smooth Transitions**: Professional gradient effects

#### Transparent
- **No Background**: Complete transparency
- **Sticker Only**: Shows only the sticker design
- **Overlay Ready**: Perfect for layering on other images

### Background Tips
- **High Contrast**: Choose colors that contrast with your signature
- **Brand Colors**: Use team colors for consistency
- **Subtle Gradients**: Light gradients work well for text overlays
- **Test Visibility**: Ensure signature remains readable

## Auto-Save Feature

### How It Works
- **Automatic Saving**: Your current work is saved automatically as you make changes
- **Browser Storage**: State is saved in your browser's local storage
- **Seamless Recovery**: When you return to the app, your last work is restored

### What's Saved
- Team and asset selection
- Transform settings (position, scale, rotation, opacity)
- Background customization settings
- Canvas dimensions and state

### Important Notes
- **Per-Browser**: State is saved per browser - work done in Chrome won't appear in Firefox
- **Privacy Mode**: Auto-save doesn't work in private/incognito browsing
- **Clear Data**: Clearing browser data will reset the application

## Keyboard Shortcuts

### Universal Shortcuts
- **Ctrl+E** (Cmd+E on Mac): Export/download image
- **Delete**: Remove current signature
- **Escape**: Cancel current drawing operation

### Drawing Mode
- **Enter**: Finish drawing (same as "Apply Signature")
- **Escape**: Cancel drawing (same as "Clear Drawing")

### Navigation
- **Tab**: Navigate between interface elements
- **Arrow Keys**: Fine-tune signature position (when selected)

## Tips & Best Practices

### Signature Design
- **Keep it Simple**: Simple signatures are more readable
- **Good Contrast**: Ensure visibility against team backgrounds
- **Appropriate Size**: Scale signatures to fit the asset proportionally
- **Consistent Style**: Maintain consistent signature style across assets

### File Management
- **Descriptive Names**: Use clear, descriptive export filenames
- **Organized Storage**: Keep exported files organized by team/purpose
- **Regular Exports**: Export important work to save permanently

### Performance
- **File Size**: Keep uploaded images under 2MB for best performance
- **Browser Cache**: Clear browser cache if experiencing issues
- **Recent Browsers**: Use updated browsers for best compatibility

### Quality
- **High Resolution**: Start with high-quality source images
- **PNG Format**: Use PNG for signatures requiring transparency
- **Preview Before Export**: Always preview before final export

### Professional Results
- **Consistent Placement**: Use similar positioning across asset types
- **Brand Compliance**: Respect team branding and guidelines
- **Quality Control**: Check final exports for quality and readability

## Troubleshooting

### Common Issues

#### "File too large" Error
- **Solution**: Reduce image file size or dimensions
- **Tools**: Use image editing software to compress
- **Format**: Try different image formats (PNG vs JPG)

#### Signature Not Appearing
- **Check Opacity**: Ensure opacity is above 0%
- **Check Position**: Signature might be positioned off-canvas
- **Reset Transform**: Try resetting transform settings

#### Poor Performance
- **Browser**: Try a different browser or update current one
- **Memory**: Close other browser tabs to free memory
- **Cache**: Clear browser cache and cookies

#### Drawing Not Working
- **Canvas Focus**: Click on canvas area first
- **Browser Support**: Ensure browser supports Canvas API
- **JavaScript**: Verify JavaScript is enabled

#### Auto-Save Issues
- **Private Mode**: Disable private/incognito browsing
- **Local Storage**: Check if browser allows local storage
- **Different Browser**: Your work is saved per browser

### Getting Help

#### Self-Help
1. **Refresh Page**: Often resolves temporary issues
2. **Clear Browser Data**: Reset application state
3. **Try Different Browser**: Test browser compatibility
4. **Check File Format**: Verify supported image formats

#### Error Messages
- **Red Notifications**: Indicate errors requiring attention
- **Yellow Notifications**: Indicate warnings or limitations
- **Green Notifications**: Confirm successful operations

#### Browser Console
- Press F12 to open developer tools
- Check Console tab for error messages
- Report persistent errors with console output

---

This user guide covers all major features and common usage scenarios. For technical details and development information, see the API documentation.