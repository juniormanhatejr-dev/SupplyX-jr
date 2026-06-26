/**
 * Sanitizes CSS color strings by replacing unsupported modern color functions
 * (oklch, oklab, lab, lch, color(display-p3 ...)) with safe hex/rgba fallbacks.
 * This is crucial for compatibility with libraries like html2canvas.
 */

/**
 * Mathematically converts an OKLCH color string to standard sRGB rgb/rgba.
 * Based on Björn Ottosson's Oklab color space equations.
 */
export const parseAndConvertOklch = (colorStr: string): string => {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  
  // Format 1: space-separated: oklch(L C H) or oklch(L C H / A)
  // Format 2: comma-separated: oklch(L, C, H) or oklch(L, C, H, A)
  const oklchRegex = /oklch\s*\(\s*([0-9.%\s]+)(?:\s+|\s*,\s*)([0-9.%\s]+)(?:\s+|\s*,\s*)([0-9.%\s]+)(?:\s*(?:\/|,)\s*([0-9.%\s]+))?\s*\)/i;
  const match = colorStr.match(oklchRegex);
  
  if (!match) return colorStr;
  
  const parseVal = (val: string, max: number = 1): number => {
    val = val.trim();
    if (val.endsWith('%')) {
      return (parseFloat(val) / 100) * max;
    }
    return parseFloat(val);
  };

  try {
    let l = parseVal(match[1]);
    if (match[1].endsWith('%')) {
      l = parseFloat(match[1]) / 100;
    }
    
    let c = parseVal(match[2]);
    if (match[2].endsWith('%')) {
      c = (parseFloat(match[2]) / 100) * 0.4;
    }
    
    let h = parseFloat(match[3]);
    if (match[3].endsWith('%')) {
      h = (parseFloat(match[3]) / 100) * 360;
    }
    
    let a = 1;
    if (match[4]) {
      a = parseVal(match[4]);
      if (match[4].endsWith('%')) {
        a = parseFloat(match[4]) / 100;
      }
    }

    if (isNaN(l) || isNaN(c) || isNaN(h)) return colorStr;

    // Convert OKLCH to RGB
    const hRad = (h * Math.PI) / 180;
    const a_ = c * Math.cos(hRad);
    const b_ = c * Math.sin(hRad);
    
    const l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
    const m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
    const s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;
    
    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;
    
    const rLinear = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
    
    const fn = (x: number) => {
      const abs = Math.abs(x);
      const res = abs > 0.0031308 ? 1.055 * Math.pow(abs, 1 / 2.4) - 0.055 : 12.92 * abs;
      return Math.sign(x) * res;
    };
    
    const r = Math.round(Math.min(1, Math.max(0, fn(rLinear))) * 255);
    const g = Math.round(Math.min(1, Math.max(0, fn(gLinear))) * 255);
    const b = Math.round(Math.min(1, Math.max(0, fn(bLinear))) * 255);
    
    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (err) {
    console.error('Error in oklch conversion:', err);
    return colorStr;
  }
};

export const sanitizeCSSColors = (cssText: string, isDarkMode: boolean = false): string => {
  if (!cssText || typeof cssText !== 'string') return cssText;
  
  let sanitized = cssText;
  
  // Replace OKLCH matches globally first
  const oklchGlobalRegex = /oklch\s*\(\s*[^)]+\)/gi;
  sanitized = sanitized.replace(oklchGlobalRegex, (match) => {
    return parseAndConvertOklch(match);
  });
  
  const lower = sanitized.toLowerCase();
  if (!lower.includes('okl') && !lower.includes('lab') && !lower.includes('lch') && !lower.includes('p3') && !lower.includes('color-mix')) {
    return sanitized;
  }
  
  // Handle nested color-mix
  const colorMixRegex = /color-mix\s*\((?:[^()]+|\([^()]*\))*\)/gi;
  sanitized = sanitized.replace(colorMixRegex, () => {
    return isDarkMode ? '#1f1f1f' : '#f0f0f0';
  });

  // Handle oklab, lch, lab, display-p3
  const colorRegex = /(?:(?:okl|l)ab|lch|color\s*\(\s*display-p3)\s*\((?:[^()]+|\([^()]*\))*\)/gi;
  sanitized = sanitized.replace(colorRegex, (match) => {
    const m = match.toLowerCase();
    
    // Handle transparency/alpha
    if (m.includes('/ 0') || m.includes(' 0)') || m.includes(', 0)') || m.includes(' 0%')) {
      return 'transparent';
    }
    
    // Specific check for oklab
    if (m.includes('oklab')) {
       return isDarkMode ? '#1f1f1f' : '#f0f0f0';
    }

    // Default safe fallbacks for different color groups if we can detect them
    if (m.includes('brand')) return '#0052CC';
    if (m.includes('emerald') || m.includes('green')) return '#10b981';
    if (m.includes('amber') || m.includes('yellow')) return '#f59e0b';
    if (m.includes('red')) return '#ef4444';
    if (m.includes('blue')) return '#3b82f6';
    if (m.includes('zinc') || m.includes('gray') || m.includes('slate') || m.includes('stone') || m.includes('neutral')) {
       return isDarkMode ? '#27272a' : '#f4f4f5';
    }

    // Generic safe fallback for non-oklch (like display-p3)
    return isDarkMode ? '#ffffff' : '#18181b';
  });

  return sanitized;
};

/**
 * Creates a proxy wrapper around a CSSStyleDeclaration to intercept property lookups
 * and automatically sanitize all style colors on access.
 */
const wrapStyleDeclaration = (style: CSSStyleDeclaration, isDarkMode: boolean): CSSStyleDeclaration => {
  return new Proxy(style, {
    get(target, prop, receiver) {
      if (prop === 'getPropertyValue') {
        return (propertyName: string) => {
          const val = target.getPropertyValue(propertyName);
          return typeof val === 'string' ? sanitizeCSSColors(val, isDarkMode) : val;
        };
      }
      
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      
      if (typeof val === 'string' && typeof prop === 'string') {
        const lowerProp = prop.toLowerCase();
        if (
          prop === 'cssText' ||
          lowerProp.includes('color') || 
          lowerProp.includes('fill') || 
          lowerProp.includes('stroke') ||
          lowerProp.includes('background') ||
          lowerProp.includes('bg') ||
          lowerProp.includes('border') ||
          lowerProp.includes('shadow') ||
          lowerProp.includes('outline')
        ) {
          return sanitizeCSSColors(val, isDarkMode);
        }
      }
      return val;
    }
  });
};

/**
 * Applies color sanitization to a document clone, typically used with html2canvas onclone callback.
 */
export const sanitizeDocumentColors = (clonedDoc: Document, isDarkMode: boolean = false) => {
  // 1. Resolve relative image URLs to absolute URLs in the cloned document so html2canvas can load them
  try {
    const images = Array.from(clonedDoc.getElementsByTagName('img'));
    images.forEach(img => {
      if (img.src) {
        // img.src automatically returns the fully resolved absolute URL when accessed via JavaScript
        img.src = img.src;
      }
    });
  } catch (e) {
    console.error('Failed to resolve image URLs in cloned document:', e);
  }

  // 2. Overwrite getComputedStyle of the cloned document's window
  if (clonedDoc.defaultView) {
    try {
      const originalGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
      clonedDoc.defaultView.getComputedStyle = function(el: Element, pseudoElt?: string | null) {
        const style = originalGetComputedStyle.call(this, el, pseudoElt);
        return wrapStyleDeclaration(style, isDarkMode);
      };
    } catch (e) {
      console.error('Failed to override getComputedStyle in cloned window:', e);
    }
  }

  // 3. Use a blunt approach for style elements inside head
  try {
    const headElements = Array.from(clonedDoc.head.querySelectorAll('style, link'));
    headElements.forEach(el => {
      if (el.tagName.toLowerCase() === 'style' && el.textContent) {
        el.textContent = sanitizeCSSColors(el.textContent, isDarkMode);
      }
    });
  } catch (e) {}

  // 4. Sanitize style tags
  try {
    Array.from(clonedDoc.getElementsByTagName('style')).forEach(style => {
      if (style.textContent) {
        style.textContent = sanitizeCSSColors(style.textContent, isDarkMode);
      }
    });
  } catch (e) {}

  // 5. Sanitize stylesheets
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
          try {
            if (rules[i].cssText.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
              sheet.deleteRule(i);
            }
          } catch (err) {}
        }
      }
    } catch (e) {}
  });

  // 6. Sanitize all elements (attributes and inline styles)
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
        
        if (!changed && el.style.cssText && el.style.cssText.toLowerCase().match(/(?:okl|l)ab|oklch|lch|p3|color-mix/)) {
          el.style.cssText = sanitizeCSSColors(el.style.cssText, isDarkMode);
        }
      }
    } catch (e) {}
  });

  // 7. Sanitize root variables specifically
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
};
