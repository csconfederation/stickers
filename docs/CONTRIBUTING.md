# Contributing to CSC Signature Overlay Tool

Thank you for your interest in contributing to the CSC Signature Overlay Tool! This guide will help you get started with development and contribution processes.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Development Workflow](#development-workflow)
5. [Testing Guidelines](#testing-guidelines)
6. [Security Considerations](#security-considerations)
7. [Performance Guidelines](#performance-guidelines)
8. [Contribution Process](#contribution-process)
9. [Code Review](#code-review)
10. [Release Process](#release-process)

## Development Setup

### Prerequisites
- **Node.js** (optional, for development tools)
- **Modern Browser** (Chrome 100+, Firefox 100+, Safari 16+)
- **Git** for version control
- **Text Editor** with JavaScript support (VS Code recommended)

### Local Development Environment

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd stickers
```

#### 2. Development Server
Choose one of these methods to serve the application locally:

**Python (Recommended)**
```bash
python3 -m http.server 8000
```

**Node.js**
```bash
npx serve -p 8000
```

**PHP**
```bash
php -S localhost:8000
```

#### 3. Browser Development Tools
- **Chrome DevTools**: F12 → Sources, Console, Network
- **Firefox Developer Tools**: F12 → Debugger, Console, Network
- **Safari Web Inspector**: Cmd+Option+I

### Recommended Extensions (VS Code)
- **ES6 Modules**: Better import/export support
- **Live Server**: Auto-reload on file changes
- **Bracket Pair Colorizer**: Visual bracket matching
- **ESLint**: Code quality checking
- **Prettier**: Code formatting

## Project Structure

### Directory Layout
```
stickers/
├── index.html              # Application entry point
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── app.js              # Main application controller
│   ├── config.js           # Configuration and constants
│   └── modules/            # Feature modules
│       ├── canvas.js       # Canvas rendering
│       ├── signature.js    # Signature handling
│       ├── transform.js    # Transform controls
│       └── utils.js        # Utility functions
├── teams/                  # Team asset directories
├── docs/                   # Documentation
└── README.md              # Project overview
```

### Module Architecture
- **Modular Design**: Each feature in separate module
- **ES6 Modules**: Import/export for clean dependencies
- **Single Responsibility**: Each module has one primary purpose
- **Loose Coupling**: Modules communicate through well-defined interfaces

### File Naming Conventions
- **JavaScript**: camelCase for files and variables
- **CSS**: kebab-case for classes and IDs
- **HTML**: semantic element names
- **Assets**: PascalCase for team asset files

## Coding Standards

### JavaScript Style Guide

#### General Principles
- **ES6+**: Use modern JavaScript features
- **Functional**: Prefer functional programming patterns
- **Immutable**: Avoid mutating objects when possible
- **Explicit**: Clear, descriptive variable and function names

#### Code Formatting
```javascript
// Functions: camelCase
function handleUserInput() { }

// Classes: PascalCase
class SignatureManager { }

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Variables: camelCase
const userName = 'example';
```

#### Best Practices
```javascript
// Use const/let instead of var
const immutableValue = 'constant';
let mutableValue = 'variable';

// Arrow functions for callbacks
array.map(item => item.value);

// Destructuring for object properties
const { width, height } = dimensions;

// Template literals for strings
const message = `User ${name} uploaded ${count} files`;

// Async/await for promises
async function loadImage(src) {
  try {
    const image = await Utils.loadImage(src);
    return image;
  } catch (error) {
    console.error('Load failed:', error);
    throw error;
  }
}
```

### CSS Guidelines

#### Architecture
- **CSS Custom Properties**: Use variables for theming
- **Mobile First**: Responsive design from mobile up
- **Component-Based**: Styles organized by component
- **BEM Methodology**: Block, Element, Modifier naming

#### Example Structure
```css
/* CSS Variables */
:root {
  --primary-color: #3b82f6;
  --spacing-md: 1rem;
}

/* Component */
.signature-box {
  /* Block styles */
}

.signature-box__handle {
  /* Element styles */
}

.signature-box--active {
  /* Modifier styles */
}
```

### HTML Standards
- **Semantic HTML**: Use appropriate semantic elements
- **Accessibility**: Include ARIA labels and roles
- **Progressive Enhancement**: Base functionality without JavaScript
- **Valid Markup**: Well-formed, valid HTML5

## Development Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/new-signature-tool

# Make changes and commit
git add .
git commit -m "feat: add new signature drawing tool"

# Keep branch updated
git fetch origin
git rebase origin/main

# Push branch
git push origin feature/new-signature-tool
```

### Commit Message Format
```
type(scope): brief description

Detailed explanation of changes...

- Bullet point 1
- Bullet point 2

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### Development Process
1. **Issue Creation**: Document feature/bug with clear requirements
2. **Branch Creation**: Create feature branch from main
3. **Development**: Implement changes following coding standards
4. **Testing**: Thoroughly test changes across browsers
5. **Documentation**: Update relevant documentation
6. **Code Review**: Submit pull request for review
7. **Integration**: Merge after approval and testing

## Testing Guidelines

### Manual Testing Checklist

#### Core Functionality
- [ ] Team selection works for all 22 teams
- [ ] Asset type selection loads correct dimensions
- [ ] Drawing tool creates smooth signatures
- [ ] File upload accepts valid image formats
- [ ] Transform controls work smoothly
- [ ] Background customization applies correctly
- [ ] Export generates correct PNG files
- [ ] Project save/load preserves state

#### Browser Compatibility
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

#### Device Testing
- [ ] Desktop (1920×1080, 1366×768)
- [ ] Tablet (1024×768, 768×1024)
- [ ] Mobile (375×667, 414×896)

#### Error Handling
- [ ] Invalid file uploads show appropriate errors
- [ ] Network errors handled gracefully
- [ ] localStorage quota exceeded handled
- [ ] Memory exhaustion handled appropriately

### Performance Testing
- [ ] Application loads under 3 seconds
- [ ] Drawing response time under 16ms (60fps)
- [ ] File upload processes under 5 seconds
- [ ] Memory usage stays under 100MB
- [ ] No memory leaks after extended use

### Security Testing
- [ ] File upload validation works
- [ ] XSS attempts blocked
- [ ] Input sanitization effective
- [ ] localStorage data validated
- [ ] Error messages don't leak information

## Security Considerations

### Code Security
- **Input Validation**: Validate all user inputs
- **Output Encoding**: Encode all dynamic content
- **Error Handling**: Don't expose sensitive information
- **Resource Limits**: Implement appropriate limits

### Review Checklist
- [ ] All inputs validated and sanitized
- [ ] No direct DOM manipulation with user data
- [ ] File uploads properly restricted
- [ ] Error messages don't leak information
- [ ] Memory limits enforced
- [ ] No console.log in production code

## Performance Guidelines

### Code Performance
- **Debouncing**: Use for frequent events (resize, scroll)
- **Lazy Loading**: Load resources only when needed
- **Memory Management**: Clean up resources properly
- **Efficient Algorithms**: Use appropriate data structures

### Optimization Techniques
```javascript
// Debounced rendering for smooth performance
this.debouncedRender = Utils.debounce(() => this.render(), 16);

// Efficient canvas operations
ctx.save();
// ... drawing operations
ctx.restore();

// Memory cleanup
cleanup() {
  // Clear references
  this.largeObject = null;
  // Remove event listeners
  element.removeEventListener('click', handler);
}
```

## Contribution Process

### 1. Getting Started
1. **Fork Repository**: Create personal fork on GitHub
2. **Clone Fork**: Clone to local development environment
3. **Set Upstream**: Add original repository as upstream remote
4. **Create Branch**: Create feature branch for changes

### 2. Development
1. **Follow Standards**: Adhere to coding standards and guidelines
2. **Test Thoroughly**: Test changes across supported browsers
3. **Document Changes**: Update relevant documentation
4. **Security Review**: Ensure changes don't introduce vulnerabilities

### 3. Submission
1. **Update Branch**: Rebase with latest main branch
2. **Create PR**: Submit pull request with clear description
3. **Address Feedback**: Respond to code review comments
4. **Final Testing**: Ensure all tests pass

### Pull Request Template
```markdown
## Description
Brief description of changes...

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Performance verified
- [ ] Security reviewed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
```

## Code Review

### Review Criteria
1. **Functionality**: Code works as intended
2. **Standards**: Follows project coding standards
3. **Security**: No security vulnerabilities introduced
4. **Performance**: No performance regressions
5. **Maintainability**: Code is readable and maintainable
6. **Testing**: Adequate testing coverage
7. **Documentation**: Relevant documentation updated

### Review Process
1. **Automated Checks**: Linting and basic validation
2. **Peer Review**: Code reviewed by team member
3. **Testing**: Manual testing of changes
4. **Security Review**: Security implications assessed
5. **Approval**: Final approval and merge

## Release Process

### Version Numbering
Follow Semantic Versioning (SemVer):
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Cross-browser compatibility verified
- [ ] Mobile compatibility verified
- [ ] Release notes prepared

### Deployment
1. **Create Release Branch**: `release/v1.2.0`
2. **Final Testing**: Comprehensive testing on release branch
3. **Tag Release**: Create git tag with version number
4. **Deploy**: Deploy to production environment
5. **Monitor**: Monitor for issues post-deployment

## Getting Help

### Resources
- **Documentation**: See `/docs/` directory
- **Code Examples**: Review existing module implementations
- **Browser DevTools**: Use for debugging and performance analysis

### Communication
- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Code Review**: Use pull request comments for code-specific questions

### Common Issues
- **Module Loading**: Ensure proper ES6 module syntax
- **CORS Errors**: Use proper local server setup
- **Performance**: Use browser profiling tools
- **Browser Compatibility**: Test across supported browsers

---

Thank you for contributing to the CSC Signature Overlay Tool! Your contributions help make this tool better for the entire CSC community.