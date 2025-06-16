# Security Documentation

This document outlines the security features, best practices, and considerations for the CSC Signature Overlay Tool.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Input Validation](#input-validation)
3. [File Upload Security](#file-upload-security)
4. [Data Storage Security](#data-storage-security)
5. [XSS Protection](#xss-protection)
6. [Memory Management](#memory-management)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Security Checklist](#security-checklist)
10. [Incident Response](#incident-response)

## Security Overview

### Security Model
The CSC Signature Overlay Tool implements a **client-side security model** with the following principles:

- **Defense in Depth**: Multiple layers of validation and sanitization
- **Principle of Least Privilege**: Minimal permissions and access rights
- **Fail Secure**: Graceful degradation when security checks fail
- **Input Validation**: All user inputs are validated and sanitized
- **No External Dependencies**: Self-contained application reduces attack surface

### Threat Model
Primary threats addressed:
- **Malicious File Uploads**: Harmful files disguised as images
- **Cross-Site Scripting (XSS)**: Injection of malicious scripts
- **Memory Exhaustion**: Resource consumption attacks
- **Data Injection**: Malicious data in localStorage
- **Path Traversal**: Unauthorized file system access attempts

## Input Validation

### Numeric Input Validation
All numeric inputs are validated using the `validateNumericInput()` method:

```javascript
validateNumericInput(value, min, max, defaultValue)
```

**Security Features:**
- Type checking (`parseFloat()` with `isNaN()` validation)
- Range clamping (`Math.max(min, Math.min(max, num))`)
- Default fallback for invalid inputs
- Protection against NaN, Infinity, and negative zero

**Protected Inputs:**
- Scale values: 10-200%
- Rotation values: -180° to 180°
- Opacity values: 0-100%
- Brush size: 1-20 pixels

### String Input Validation
String inputs are sanitized using `validateStringInput()`:

```javascript
validateStringInput(value, maxLength = 100)
```

**Security Features:**
- Type verification
- Length limiting (default 100 characters)
- HTML entity encoding
- Removal of dangerous characters: `<>"'&`

### Color Input Validation
Color values are validated with `validateColorInput()`:

```javascript
validateColorInput(color)
```

**Security Features:**
- Hex color pattern validation: `/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/`
- Default fallback to `#ffffff`
- Protection against CSS injection

### Team and Asset Validation
Team prefixes and asset types are validated against whitelists:

```javascript
validateTeamPrefix(prefix)  // Checks against TEAMS array
validateAssetType(asset)    // Checks against ASSET_TYPES keys
```

## File Upload Security

### File Type Validation
Strict MIME type validation with whitelist approach:

```javascript
const allowedTypes = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif', 'image/webp', 'image/bmp'
];
```

**Security Features:**
- MIME type checking (`file.type`)
- File extension validation (`/\.(jpg|jpeg|png|gif|webp|bmp)$/i`)
- Double validation (MIME + extension)
- Case-insensitive extension matching

### File Size Limits
Multiple size restrictions prevent resource exhaustion:

```javascript
// File upload limits
maxSize: 5 * 1024 * 1024,     // 5MB maximum
minSize: 100,                  // 100 bytes minimum

// Data URL limits
dataUrlLimit: 10 * 1024 * 1024, // 10MB for data URLs
```

### Path Traversal Protection
File names are validated to prevent path traversal attacks:

```javascript
// Blocked patterns
fileName.includes('..')  // Parent directory
fileName.includes('/')   // Unix path separator
fileName.includes('\\')  // Windows path separator
```

### File Processing Security
- **Timeout Protection**: 30-second timeout for file operations
- **Memory Limits**: Image dimension validation (4096×4096 max)
- **Secure Loading**: CORS handling for external resources
- **Error Handling**: Graceful failure for malformed files

## Data Storage Security

### localStorage Validation
All localStorage operations include security validation:

```javascript
// Safe JSON parsing
safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}
```

### Data Sanitization
Stored data is sanitized before persistence:

```javascript
// Project data sanitization
sanitizeState(state)          // Application state
sanitizeSignature(signature)  // Signature data URLs
sanitizeProjectName(name)     // Project names
```

**Sanitization Features:**
- Whitelist allowed object keys
- String length limits
- Data URL format validation
- Size limits for stored data

### Storage Quotas
Prevent storage exhaustion attacks:

```javascript
maxProjects: 10,                    // Maximum stored projects
maxDataSize: 10 * 1024 * 1024,     // 10MB total limit
maxProjectSize: 5 * 1024 * 1024,   // 5MB per project
```

### Data Structure Validation
Loaded data structure is validated:

```javascript
validateLoadedProject(project) {
  return project &&
         typeof project.id === 'string' &&
         typeof project.name === 'string' &&
         typeof project.timestamp === 'number' &&
         // ... additional checks
}
```

## XSS Protection

### Content Security
- **textContent Usage**: DOM text insertion uses `textContent` instead of `innerHTML`
- **Attribute Validation**: All dynamic attributes are validated
- **HTML Encoding**: User input is HTML-encoded before display

### Toast Notifications
Toast messages are XSS-protected:

```javascript
showToast(message, type, duration) {
  const sanitizedMessage = this.sanitizeText(message);
  toast.textContent = sanitizedMessage;  // Safe insertion
}
```

### Dynamic Content
All dynamically generated content is sanitized:

```javascript
sanitizeText(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

## Memory Management

### Performance Monitoring
Automatic memory usage monitoring:

```javascript
performanceMonitor() {
  if (performance.memory && memory.usedJSHeapSize > 50 * 1024 * 1024) {
    console.warn('High memory usage detected');
  }
}
```

**Monitoring Features:**
- 30-second monitoring intervals
- 50MB usage threshold
- Automatic cleanup recommendations
- Memory leak detection

### Resource Cleanup
Systematic resource management:

```javascript
cleanup() {
  // Clear timeouts/intervals
  clearInterval(this.performanceInterval);
  
  // Clear canvas contexts
  this.canvas.clear();
  this.canvas.clearDrawing();
  
  // Reset application state
  this.state = { ...DEFAULT_STATE };
}
```

### Garbage Collection
- **Object Nullification**: Explicit null assignment for large objects
- **Event Listener Cleanup**: Proper removal of event listeners
- **Canvas Cleanup**: Regular canvas context clearing

## Error Handling

### Global Error Boundaries
Comprehensive error catching:

```javascript
// Synchronous errors
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  Utils.showToast('An error occurred. Please refresh.', 'error');
});

// Asynchronous errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  Utils.showToast('An error occurred. Please try again.', 'error');
});
```

### Secure Error Messages
Error messages are sanitized to prevent information leakage:

- **Generic Messages**: Avoid exposing internal details
- **User-Friendly**: Provide actionable guidance
- **Logging**: Detailed errors logged to console for debugging
- **No Stack Traces**: Stack traces not exposed to users

### Timeout Protection
All async operations have timeout protection:

```javascript
// Image loading timeout
const timeout = setTimeout(() => {
  reject(new Error('Image load timeout'));
}, 10000);
```

## Best Practices

### Development Security
1. **Input Validation**: Validate all inputs at entry points
2. **Output Encoding**: Encode all dynamic content
3. **Error Handling**: Implement comprehensive error boundaries
4. **Resource Limits**: Set appropriate limits for all resources
5. **Regular Audits**: Conduct periodic security reviews

### Deployment Security
1. **HTTPS Required**: Serve over HTTPS in production
2. **CSP Headers**: Implement Content Security Policy
3. **HSTS**: Use HTTP Strict Transport Security
4. **Security Headers**: Add appropriate security headers

### User Security
1. **Browser Updates**: Encourage users to update browsers
2. **Local Storage**: Warn about private browsing limitations
3. **File Sources**: Advise caution with uploaded files
4. **Data Backup**: Recommend backing up important projects

## Security Checklist

### Pre-Deployment Checklist
- [ ] All inputs validated and sanitized
- [ ] File upload restrictions implemented
- [ ] XSS protection verified
- [ ] Error handling comprehensive
- [ ] Memory limits enforced
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] CSP implemented

### Runtime Security Monitoring
- [ ] Performance monitoring active
- [ ] Error logging functional
- [ ] Storage quotas enforced
- [ ] Input validation working
- [ ] File validation operational
- [ ] Memory cleanup active

### Regular Security Tasks
- [ ] Security audit (quarterly)
- [ ] Dependency review (if any added)
- [ ] Browser compatibility testing
- [ ] Performance monitoring review
- [ ] Error log analysis
- [ ] User feedback review

## Incident Response

### Security Incident Types
1. **XSS Attempt**: Malicious script injection detected
2. **File Upload Attack**: Suspicious file upload behavior
3. **Resource Exhaustion**: Memory or storage abuse
4. **Data Corruption**: localStorage tampering detected

### Response Procedures
1. **Immediate**: Log incident details
2. **Assessment**: Determine impact and scope
3. **Containment**: Implement temporary mitigations
4. **Recovery**: Restore normal operations
5. **Review**: Analyze and improve security measures

### Logging and Monitoring
- **Console Logging**: Detailed error information
- **User Notifications**: Appropriate user feedback
- **Performance Metrics**: Resource usage tracking
- **Security Events**: Validation failures and attacks

### Recovery Procedures
1. **Clear Storage**: Reset localStorage if corrupted
2. **Refresh Application**: Reload for clean state
3. **Browser Reset**: Clear cache and cookies
4. **Fallback Mode**: Graceful degradation if needed

## Compliance and Standards

### Security Standards
- **OWASP Top 10**: Protection against common vulnerabilities
- **Client-Side Security**: Best practices for browser applications
- **Data Protection**: Secure handling of user data
- **Privacy**: No external data transmission

### Code Security
- **Static Analysis**: Regular code review for security issues
- **Secure Coding**: Following secure development practices
- **Vulnerability Management**: Prompt addressing of security issues
- **Documentation**: Comprehensive security documentation

---

This security documentation should be reviewed regularly and updated as new features are added or security threats evolve.