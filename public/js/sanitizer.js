// Client-side sanitization utilities
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function createSafeHTML(html) {
    // For now, we'll use basic text content sanitization
    // In production, you should use DOMPurify from CDN
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

// Safe DOM manipulation functions
function setTextContent(element, text) {
    if (element) {
        element.textContent = text;
    }
}

function setSafeHTML(element, html) {
    if (element) {
        // This converts HTML strings to safe text content
        element.textContent = html;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        createSafeHTML,
        setTextContent,
        setSafeHTML
    };
}