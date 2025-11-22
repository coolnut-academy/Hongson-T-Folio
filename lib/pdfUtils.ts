/**
 * Utility helpers related to printed reports.
 * The legacy html2pdf-based helpers have been replaced with React PDF.
 */

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