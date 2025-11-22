import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

/**
 * Utility to convert a React PDF document to a downloadable blob in the browser.
 */
export const downloadPdf = async (
  documentNode: ReactElement<DocumentProps>,
  filename: string
): Promise<void> => {
  if (typeof window === 'undefined') {
    console.warn('downloadPdf should only be invoked on the client');
    return;
  }

  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    const blob = await pdf(documentNode).toBlob();
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate PDF document', error);
    alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
  }
};

