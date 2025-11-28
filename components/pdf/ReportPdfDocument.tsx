'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// --- (คงส่วน registerSarabunFonts ไว้เหมือนเดิม) ---
const registerSarabunFonts = () => {
  const globalObj = globalThis as typeof globalThis & { __sarabunFontsRegistered?: boolean };
  if (globalObj.__sarabunFontsRegistered) return;

  Font.register({
    family: 'Sarabun',
    fonts: [
      { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700 },
    ],
  });
  globalObj.__sarabunFontsRegistered = true;
};
registerSarabunFonts();

export interface ReportPdfEntry {
  id: string;
  title: string;
  category: string;
  description?: string;
  dateStart: string;
  dateEnd?: string;
  images?: string[];
  userId?: string;
}

interface ReportPdfDocumentProps {
  entries: ReportPdfEntry[];
  user: { name: string; position?: string };
  title: string;
  subtitle?: string;
  generatedAt: string;
  showUserColumn?: boolean;
  usersMap?: Record<string, string>;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 30, // ลด Padding ลงเล็กน้อยเพื่อให้มีพื้นที่มากขึ้น
    fontSize: 11,
    color: '#1e293b',
    flexDirection: 'column',
  },
  // ส่วนหัว (Header) ที่รวม Logo และข้อมูลผู้รายงาน
  headerContainer: {
    flexDirection: 'row',
    height: 80, // Fix ความสูงส่วนหัว
    borderBottom: '1 solid #e2e8f0',
    marginBottom: 10,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 15,
    objectFit: 'contain',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  reportSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTop: '1 dashed #cbd5f5',
  },
  userText: {
    fontSize: 10,
    color: '#475569',
  },

  // ส่วนเนื้อหา (Content Body) - ใช้ Flex: 1 เพื่อให้ขยายเต็มพื้นที่ที่เหลือ
  contentBody: {
    flex: 1, 
    flexDirection: 'column',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 5,
    color: '#1e293b',
  },
  entryMetaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    color: '#475569',
    marginBottom: 10,
  },
  entryDescContainer: {
    minHeight: 40, // อย่างน้อยต้องมีความสูงเท่านี้
    marginBottom: 10,
  },
  entryDesc: {
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  
  // ส่วนรูปภาพ (Images)
  imagesContainer: {
    flex: 1, // ให้รูปภาพกินพื้นที่ที่เหลือทั้งหมดในหน้า
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 5,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center', // จัดรูปให้อยู่กลางถ้ามีน้อย
    alignContent: 'flex-start',
  },
  // ปรับขนาดรูปตามจำนวนให้เหมาะสม (Dynamic Sizing concept)
  imageWrapper: {
    width: '48%', // 2 รูปต่อแถว
    height: 150,  // Fix ความสูงรูปภาพเพื่อไม่ให้ดันหน้า
    marginBottom: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 4,
  },

  // ส่วนท้าย (Footer)
  footer: {
    height: 30,
    borderTop: '1 solid #e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#94a3b8',
  },
});

const formatDateRange = (start: string, end?: string) => {
  // (ใช้ฟังก์ชันเดิมของคุณ)
  if (!start) return '-';
  const formatter = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const startText = formatter.format(new Date(start));
  if (!end || end === start) return startText;
  return `${startText} - ${formatter.format(new Date(end))}`;
};

const truncateText = (text?: string, maxChars = 800) => {
  if (!text) return '- ไม่มีรายละเอียด -';
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
};

const ReportPdfDocument = ({
  entries,
  user,
  title,
  subtitle,
  generatedAt,
}: ReportPdfDocumentProps) => (
  <Document>
    {/* KEY CHANGE 1: Loop สร้าง <Page> สำหรับแต่ละ Entry เลย เพื่อรับประกัน 1 หน้า/1 งาน */}
    {entries.map((entry, index) => (
      <Page key={entry.id} size="A4" style={styles.page}>
        
        {/* 1. HEADER: รวมทุกอย่างไว้ด้านบนสุด */}
        <View style={styles.headerContainer}>
            {/* ใส่ Logo ตรงนี้ */}
             <Image src="/images/logo.png" style={styles.logo} />
             
             <View style={styles.headerInfo}>
                <Text style={styles.reportTitle}>{title}</Text>
                <Text style={styles.reportSubtitle}>{subtitle || 'รายงานสรุปผลงานรายบุคคล'}</Text>
                
                <View style={styles.userInfoRow}>
                    <Text style={styles.userText}>ผู้รายงาน: {user.name} {user.position ? `(${user.position})` : ''}</Text>
                    <Text style={styles.userText}>วันที่พิมพ์: {generatedAt}</Text>
                </View>
             </View>
        </View>

        {/* 2. CONTENT: พื้นที่เนื้อหาหลัก */}
        <View style={styles.contentBody}>
            <Text style={styles.entryTitle}>{index + 1}. {entry.title}</Text>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.entryMetaBadge}>
                    หมวดหมู่: {entry.category} | วันที่: {formatDateRange(entry.dateStart, entry.dateEnd)}
                </Text>
            </View>

            <View style={styles.entryDescContainer}>
                <Text style={styles.entryDesc}>
                    {truncateText(entry.description)}
                </Text>
            </View>

            {/* 3. IMAGES: พื้นที่รูปภาพ (บังคับขนาด) */}
            <View style={styles.imagesContainer}>
                <View style={styles.imageGrid}>
                    {/* จำกัดรูปแค่ 4-6 รูป เพื่อไม่ให้ล้นหน้าแน่นอน (ใช้ slice) */}
                    {entry.images?.slice(0, 6).map((img, i) => (
                        <View key={i} style={styles.imageWrapper}>
                            <Image src={img} style={styles.image} />
                        </View>
                    ))}
                </View>
                {entry.images && entry.images.length > 6 && (
                   <Text style={{fontSize: 9, color: '#ef4444', textAlign: 'center', marginTop: 5}}>
                       *มีรูปภาพเพิ่มเติมอีก {entry.images.length - 6} รูป ในระบบ*
                   </Text>
                )}
            </View>
        </View>

        {/* 4. FOOTER */}
        <View style={styles.footer}>
             <Text style={styles.footerText}>
                System generated by Hongson T-Folio | หน้า {index + 1} จาก {entries.length}
             </Text>
        </View>

      </Page>
    ))}
  </Document>
);

export default ReportPdfDocument;