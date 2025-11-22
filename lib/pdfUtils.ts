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
 * Core Logic: Efficiently fix unsupported colors (lab, lch, oklch) in the cloned document
 */
const fixColorsInClone = (clonedDoc: Document) => {
  const elements = clonedDoc.querySelectorAll('*');
  
  // Create a single reuseable element for color conversion
  // This avoids creating/destroying thousands of DOM elements
  const tempConverter = document.createElement('div');
  tempConverter.style.display = 'none';
  document.body.appendChild(tempConverter);

  const colorProperties = [
    'color', 'backgroundColor', 'borderColor', 
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'textDecorationColor', 'fill', 'stroke'
  ];

  try {
    elements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const style = window.getComputedStyle(el);
        
        colorProperties.forEach(prop => {
          const value = style.getPropertyValue(prop);
          
          // Performance Check: Only process if strictly necessary
          // Ignore empty, transparent, inherit, or standard formats (hex, rgb, hsl)
          if (!value || value === 'transparent' || value === 'inherit') return;
          if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) return;
          
          // If we detect modern color formats (lab, lch, oklab, oklch)
          if (value.includes('lab') || value.includes('lch') || value.includes('ok')) {
            // Use the shared converter
            tempConverter.style.color = value;
            // Browser will automatically compute this to rgb(...)
            const computedRGB = window.getComputedStyle(tempConverter).color;
            
            if (computedRGB && computedRGB !== value) {
              // Force override the style on the element
              // @ts-expect-error - Dynamic property assignment needed for color conversion
              el.style[prop] = computedRGB;
            }
          }
        });
      }
    });
  } catch (e) {
    console.warn('Color fix warning:', e);
  } finally {
    // Clean up the converter element
    if (document.body.contains(tempConverter)) {
      document.body.removeChild(tempConverter);
    }
  }
};

/**
 * Generate and download PDF from HTML element
 */
export const generatePDF = async (elementId: string, filename: string = 'report'): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
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
      letterRendering: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        fixColorsInClone(clonedDoc);
      }
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  } as const;

  await processPDFGeneration(element, opt);
};

/**
 * Generate and download PDF with landscape orientation
 */
export const generatePDFLandscape = async (elementId: string, filename: string = 'report'): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
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
      letterRendering: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        fixColorsInClone(clonedDoc);
      }
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'landscape'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  } as const;

  await processPDFGeneration(element, opt);
};

/**
 * Shared logic for showing toasts and executing html2pdf
 */
const processPDFGeneration = async (element: HTMLElement, opt: Record<string, unknown>) => {
  let loadingToast: HTMLDivElement | null = null;

  try {
    // Show loading indicator
    loadingToast = document.createElement('div');
    loadingToast.id = 'pdf-loading-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3';
    loadingToast.innerHTML = `
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>กำลังสร้างไฟล์ PDF...</span>
    `;
    document.body.appendChild(loadingToast);

    // Execute PDF generation
    await html2pdf().set(opt).from(element).save();

    // Success handling
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
    
    if (loadingToast) loadingToast.remove();
    
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999]';
    errorToast.textContent = 'เกิดข้อผิดพลาดในการบันทึก PDF (กรุณาลองใหม่อีกครั้ง)';
    document.body.appendChild(errorToast);
    
    setTimeout(() => errorToast.remove(), 3000);
  }
};

/**
 * Handle print with mobile detection
 */
export const handlePrint = (): void => {
  if (isMobileDevice()) {
    alert('ฟังก์ชันพิมพ์รายงานสามารถใช้งานได้บนคอมพิวเตอร์เท่านั้น\n\nสำหรับมือถือ กรุณาใช้ปุ่ม "บันทึก PDF" แทน');
    return;
  }
  
  window.print();
};