/**
 * Utility helpers related to printed reports.
 * The legacy html2pdf-based helpers have been replaced with React PDF.
 */

import type { ReportPdfEntry } from '@/components/pdf/ReportPdfDocument';

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
};

export const handlePrint = (): void => {
  if (isMobileDevice()) {
    alert(
      'ฟังก์ชันพิมพ์รายงานสามารถใช้งานได้บนคอมพิวเตอร์เท่านั้น\n\nสำหรับมือถือ กรุณาใช้ปุ่ม "บันทึก PDF" แทน'
    );
    return;
  }
  window.print();
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
};

/**
 * Preloads remote evidence images and embeds them as data URLs
 * so @react-pdf/renderer can reliably render them into the PDF.
 */
export const prepareEntriesForPdf = async (
  entries: ReportPdfEntry[]
): Promise<ReportPdfEntry[]> => {
  if (typeof window === 'undefined') return entries;

  return Promise.all(
    entries.map(async (entry) => {
      if (!entry.images || entry.images.length === 0) return entry;

      const resolvedImages = await Promise.all(
        entry.images.map(async (imageUrl) => {
          try {
            return await fetchAsDataUrl(imageUrl);
          } catch (error) {
            console.warn('Failed to inline image for PDF export', error);
            return imageUrl;
          }
        })
      );

      return {
        ...entry,
        images: resolvedImages,
      };
    })
  );
};