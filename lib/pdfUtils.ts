import html2pdf from 'html2pdf.js';

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

/**
 * Color Converter Utility using Canvas API
 * This forces the browser to resolve any color (lab, lch, oklch, var) to a standard Hex/RGB string
 */
const canvasContext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

const forceToStandardColor = (color: string): string => {
  if (!color || color === 'transparent' || color === 'inherit') return color;
  // If it's already safe, return immediately
  if (color.startsWith('#') || (color.startsWith('rgb') && !color.includes('var'))) return color;
  
  if (canvasContext) {
    // Reset to black to detect failure
    canvasContext.fillStyle = '#000000';
    // Try setting the tricky color
    canvasContext.fillStyle = color;
    // Read back the computed value (Browser converts it to hex/rgb here)
    return canvasContext.fillStyle;
  }
  return color;
};

/**
 * Sanitize DOM function
 * Creates a deep clone and converts all computed styles to inline safe styles
 */
const prepareSafeClone = (elementId: string): HTMLElement | null => {
  const original = document.getElementById(elementId);
  if (!original) return null;

  // 1. Deep clone the element
  const clone = original.cloneNode(true) as HTMLElement;

  // 2. Position it off-screen but keep layout dimensions
  // We must append it to body so getComputedStyle works reliably
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.width = `${original.offsetWidth}px`;
  clone.style.zIndex = '-1';
  // Remove shadows or transformations that might confuse the renderer
  clone.style.transition = 'none';
  clone.style.boxShadow = 'none';

  document.body.appendChild(clone);

  // 3. Iterate through ORIGINAL and CLONE in parallel
  // We read styles from original (which has correct CSS applied)
  // And write inline styles to clone (to force RGB)
  const originalAll = original.querySelectorAll('*');
  const cloneAll = clone.querySelectorAll('*');

  const colorProps = [
    'color', 'backgroundColor', 'borderColor', 
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke'
  ];

  // Process the root element itself first
  const rootStyle = window.getComputedStyle(original);
  colorProps.forEach(prop => {
    // @ts-expect-error - CSSStyleDeclaration properties are accessed dynamically
    const val = rootStyle[prop];
    if (val && typeof val === 'string') {
      const safeColor = forceToStandardColor(val);
      // Use setProperty for safer assignment
      clone.style.setProperty(prop, safeColor);
    }
  });

  // Process all children
  originalAll.forEach((origNode, index) => {
    const cloneNode = cloneAll[index];
    if (cloneNode instanceof HTMLElement && origNode instanceof Element) {
      const style = window.getComputedStyle(origNode);
      
      colorProps.forEach(prop => {
        // @ts-expect-error - CSSStyleDeclaration properties are accessed dynamically
        const val = style[prop];
        if (val && typeof val === 'string') {
           // Check if color needs fixing
           if (val.includes('lab') || val.includes('lch') || val.includes('ok') || val.includes('var')) {
             const safeColor = forceToStandardColor(val);
             // Use setProperty for safer assignment
             cloneNode.style.setProperty(prop, safeColor);
           }
        }
      });
    }
  });

  return clone;
};

/**
 * Generate PDF - Optimized Version
 */
export const generatePDF = async (elementId: string, filename: string = 'report'): Promise<void> => {
  // Prepare the safe clone with RGB colors
  const safeElement = prepareSafeClone(elementId);
  
  if (!safeElement) {
    alert('ไม่พบเอกสารที่จะบันทึก กรุณาลองใหม่อีกครั้ง');
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      // We don't need complex onclone anymore because we sanitized the input
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  } as const;

  await processPDFGeneration(safeElement, opt);
};

/**
 * Generate PDF Landscape - Optimized Version
 */
export const generatePDFLandscape = async (elementId: string, filename: string = 'report'): Promise<void> => {
  const safeElement = prepareSafeClone(elementId);
  
  if (!safeElement) {
    alert('ไม่พบเอกสารที่จะบันทึก กรุณาลองใหม่อีกครั้ง');
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'landscape'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  } as const;

  await processPDFGeneration(safeElement, opt);
};

/**
 * Shared Processing Logic
 */
const processPDFGeneration = async (element: HTMLElement, opt: Record<string, unknown>) => {
  let loadingToast: HTMLDivElement | null = null;

  try {
    // Show loading
    loadingToast = document.createElement('div');
    loadingToast.id = 'pdf-loading-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3';
    loadingToast.innerHTML = `
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>กำลังสร้างไฟล์ PDF...</span>
    `;
    document.body.appendChild(loadingToast);

    // Generate from the SAFE CLONE
    await html2pdf().set(opt).from(element).save();

    // Cleanup the clone from DOM
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }

    // Success
    if (loadingToast) loadingToast.remove();
    const successToast = document.createElement('div');
    successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3';
    successToast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>บันทึกไฟล์ PDF สำเร็จ!</span>
    `;
    document.body.appendChild(successToast);
    setTimeout(() => successToast.remove(), 3000);

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Cleanup on error too
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }

    if (loadingToast) loadingToast.remove();
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999]';
    errorToast.textContent = 'เกิดข้อผิดพลาดในการบันทึก PDF';
    document.body.appendChild(errorToast);
    setTimeout(() => errorToast.remove(), 3000);
  }
};

export const handlePrint = (): void => {
  if (isMobileDevice()) {
    alert('ฟังก์ชันพิมพ์รายงานสามารถใช้งานได้บนคอมพิวเตอร์เท่านั้น\n\nสำหรับมือถือ กรุณาใช้ปุ่ม "บันทึก PDF" แทน');
    return;
  }
  window.print();
};