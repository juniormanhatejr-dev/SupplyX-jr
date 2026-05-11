/**
 * Sanitizes CSS color strings by replacing unsupported modern color functions
 * (oklch, oklab, lab, lch, color(display-p3 ...)) with safe hex/rgba fallbacks.
 * This is crucial for compatibility with libraries like html2canvas.
 */
export const sanitizeCSSColors = (cssText: string, isDarkMode: boolean = false): string => {
  if (!cssText || typeof cssText !== 'string') return cssText;
  
  const lower = cssText.toLowerCase();
  if (!lower.includes('okl') && !lower.includes('lab') && !lower.includes('lch') && !lower.includes('p3')) {
    return cssText;
  }

  // More aggressive regex to match any of these functions and their arguments
  const colorRegex = /(?:(?:okl|l)ab|oklch|lch|color-mix|color\s*\(\s*display-p3)\s*\([^;}]+\)/gi;

  return cssText.replace(colorRegex, (match) => {
    const m = match.toLowerCase();
    
    // Handle transparency/alpha
    if (m.includes('/ 0') || m.includes(' 0)') || m.includes(', 0)') || m.includes(' 0%')) {
      return 'transparent';
    }
    
    // Specific check for oklab
    if (m.includes('oklab')) {
       return isDarkMode ? '#1f1f1f' : '#f0f0f0';
    }
    
    // Specific check for oklch
    if (m.includes('oklch')) {
       // Try to extract lightness if possible
       const lightnessMatch = m.match(/oklch\s*\(\s*([0-9.%]+)/);
       if (lightnessMatch) {
         let L = parseFloat(lightnessMatch[1]);
         if (lightnessMatch[1].includes('%')) L = L / 100;
         if (L > 0.8) return isDarkMode ? '#27272a' : '#f4f4f5';
         if (L < 0.3) return isDarkMode ? '#fafafa' : '#18181b';
       }
    }

    // Default safe fallbacks for different color groups if we can detect them
    if (m.includes('brand')) return '#0052CC';
    if (m.includes('emerald') || m.includes('green')) return '#10b981';
    if (m.includes('amber') || m.includes('yellow')) return '#f59e0b';
    if (m.includes('red')) return '#ef4444';
    if (m.includes('blue')) return '#3b82f6';
    if (m.includes('zinc') || m.includes('gray') || m.includes('slate') || m.includes('stone') || m.includes('neutral')) {
       // Check for common lightness values in oklch(L C H)
       // This is a very rough heuristic
       const lightnessMatch = m.match(/oklch\s*\(\s*([0-9.]+)/);
       if (lightnessMatch) {
         const L = parseFloat(lightnessMatch[1]);
         if (L > 0.8) return isDarkMode ? '#27272a' : '#f4f4f5'; // Light gray
         if (L < 0.3) return isDarkMode ? '#fafafa' : '#18181b'; // Dark gray
       }
       return isDarkMode ? '#52525b' : '#71717a'; // Medium gray
    }

    // Generic safe fallback
    return isDarkMode ? '#ffffff' : '#18181b';
  });
};

/**
 * Applies color sanitization to a document clone, typically used with html2canvas onclone callback.
 */
export const sanitizeDocumentColors = (clonedDoc: Document, isDarkMode: boolean = false) => {
  // 0. Use a very blunt approach for the head to catch anything in style tags or hidden attributes
  try {
    const headElements = Array.from(clonedDoc.head.querySelectorAll('style, link'));
    headElements.forEach(el => {
      if (el.tagName.toLowerCase() === 'style' && el.textContent) {
        el.textContent = sanitizeCSSColors(el.textContent, isDarkMode);
      }
    });
  } catch (e) {}

  // 1. Sanitize style tags again just in case
  try {
    Array.from(clonedDoc.getElementsByTagName('style')).forEach(style => {
      if (style.textContent) {
        style.textContent = sanitizeCSSColors(style.textContent, isDarkMode);
      }
    });
  } catch (e) {}

  // 2. Sanitize stylesheets
  Array.from(clonedDoc.styleSheets).forEach(sheet => {
    try {
      const rules = sheet.cssRules;
      for (let i = rules.length - 1; i >= 0; i--) {
        try {
          const rule = rules[i];
          if (rule.cssText.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
            const sanitized = sanitizeCSSColors(rule.cssText, isDarkMode);
            sheet.deleteRule(i);
            sheet.insertRule(sanitized, i);
          }
        } catch (e) {
          // If we can't replace it, just delete it if it's problematic
          try {
            if (rules[i].cssText.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
              sheet.deleteRule(i);
            }
          } catch (err) {}
        }
      }
    } catch (e) {}
  });

  // 3. Sanitize all elements (attributes and inline styles)
  const clonedElements = Array.from(clonedDoc.getElementsByTagName('*')) as HTMLElement[];
  clonedElements.forEach(el => {
    try {
      // Attributes (like 'fill' or 'stroke' in SVGs)
      if (el.attributes) {
        Array.from(el.attributes).forEach(attr => {
          if (attr.value && (attr.value.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/))) {
            el.setAttribute(attr.name, sanitizeCSSColors(attr.value, isDarkMode));
          }
        });
      }

      // Inline styles
      if (el.style) {
        let changed = false;
        for (let i = 0; i < el.style.length; i++) {
          const prop = el.style[i];
          const val = el.style.getPropertyValue(prop);
          if (val && val.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
            el.style.setProperty(prop, sanitizeCSSColors(val, isDarkMode), 'important');
            changed = true;
          }
        }
        
        // Also check cssText just in case for some browsers
        if (!changed && el.style.cssText && el.style.cssText.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
          el.style.cssText = sanitizeCSSColors(el.style.cssText, isDarkMode);
        }
      }
    } catch (e) {}
  });

  // 4. Sanitize root variables specifically
  try {
    const root = clonedDoc.documentElement as HTMLElement;
    if (root && root.style) {
      for (let i = 0; i < root.style.length; i++) {
        const prop = root.style[i];
        if (prop.startsWith('--')) {
          const val = root.style.getPropertyValue(prop);
          if (val && val.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
            root.style.setProperty(prop, sanitizeCSSColors(val, isDarkMode), 'important');
          }
        }
      }
    }
  } catch (e) {}

  // 5. Final blunt check on the whole document
  try {
    const root = clonedDoc.documentElement;
    // We only do this if we still see problematic strings
    if (root.innerHTML.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
       // Sanitize head to catch any style tags or link attributes
       if (clonedDoc.head) {
         clonedDoc.head.innerHTML = sanitizeCSSColors(clonedDoc.head.innerHTML, isDarkMode);
       }
       // For the body, we prefer the individual element sanitization we did in step 3
       // but we'll do one more scan for any attributes we missed
    }
  } catch (e) {}
};
