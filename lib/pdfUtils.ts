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
 * Generate and download PDF from HTML element
 * @param elementId - ID of the HTML element to convert to PDF
 * @param filename - Name of the PDF file (without extension)
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
        // Fix for unsupported color functions (lab, oklab, etc.)
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            const style = window.getComputedStyle(el);
            // Convert computed colors to RGB
            if (style.color) {
              el.style.color = style.color;
            }
            if (style.backgroundColor) {
              el.style.backgroundColor = style.backgroundColor;
            }
            if (style.borderColor) {
              el.style.borderColor = style.borderColor;
            }
          }
        });
      }
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  } as const;

  try {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.id = 'pdf-loading-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3';
    loadingToast.innerHTML = `
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>กำลังสร้างไฟล์ PDF...</span>
    `;
    document.body.appendChild(loadingToast);

    await html2pdf().set(opt).from(element).save();

    // Remove loading and show success
    loadingToast.remove();
    
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
    
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999]';
    errorToast.textContent = 'เกิดข้อผิดพลาดในการบันทึก PDF';
    document.body.appendChild(errorToast);
    
    setTimeout(() => errorToast.remove(), 3000);
  }
};

/**
 * Generate and download PDF with landscape orientation (for wide reports)
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
        // Fix for unsupported color functions (lab, oklab, etc.)
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            const style = window.getComputedStyle(el);
            // Convert computed colors to RGB
            if (style.color) {
              el.style.color = style.color;
            }
            if (style.backgroundColor) {
              el.style.backgroundColor = style.backgroundColor;
            }
            if (style.borderColor) {
              el.style.borderColor = style.borderColor;
            }
          }
        });
      }
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'landscape' // Wide format for statistics
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  } as const;

  try {
    const loadingToast = document.createElement('div');
    loadingToast.id = 'pdf-loading-toast';
    loadingToast.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-3';
    loadingToast.innerHTML = `
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>กำลังสร้างไฟล์ PDF...</span>
    `;
    document.body.appendChild(loadingToast);

    await html2pdf().set(opt).from(element).save();

    loadingToast.remove();
    
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
    
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999]';
    errorToast.textContent = 'เกิดข้อผิดพลาดในการบันทึก PDF';
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

