'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { WorkRecord } from '@/lib/filterData';

// Register Sarabun fonts for Thai text support
// Must be registered before component renders
const globalObj = globalThis as typeof globalThis & { __sarabunFontsRegistered?: boolean };

if (!globalObj.__sarabunFontsRegistered) {
  try {
    Font.register({
      family: 'Sarabun',
      fonts: [
        // Regular weights
        { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 400, fontStyle: 'normal' },
        { src: '/fonts/Sarabun-Medium.ttf', fontWeight: 500, fontStyle: 'normal' },
        { src: '/fonts/Sarabun-SemiBold.ttf', fontWeight: 600, fontStyle: 'normal' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700, fontStyle: 'normal' },
        // Italic weights
        { src: '/fonts/Sarabun-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
        { src: '/fonts/Sarabun-MediumItalic.ttf', fontWeight: 500, fontStyle: 'italic' },
        { src: '/fonts/Sarabun-SemiBoldItalic.ttf', fontWeight: 600, fontStyle: 'italic' },
        { src: '/fonts/Sarabun-BoldItalic.ttf', fontWeight: 700, fontStyle: 'italic' },
      ],
    });
    globalObj.__sarabunFontsRegistered = true;
  } catch (error) {
    console.warn('Failed to register Sarabun fonts:', error);
  }
}

interface AdminWorkFilterPdfDocumentProps {
  results: WorkRecord[];
  filterMeta?: {
    workCategory?: string;
    teacherName?: string;
    subjectGroup?: string;
    timeRange?: string;
    isAllTeachers?: boolean; // Flag to show "ผลงานครูทั้งหมด" in header
  };
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 40,
    fontSize: 11,
    color: '#1e293b',
    flexDirection: 'column',
  },

  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2 solid #1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 90,
    height: 90,
    marginRight: 5,
    borderRadius: 5,
    backgroundColor: '#fff', // สีขาว
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  logo: {
    width: 74,
    height: 74,
    objectFit: 'contain',
  },
  schoolInfo: {
    flex: 1,
    minWidth: 0, // อนุญาตให้ text wrap ได้
  },
  schoolName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 4,
  },
  schoolSubtext: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
    lineHeight: 1.5,
    flexWrap: 'wrap',
  },
  headerRight: {
    alignItems: 'flex-end',
    minWidth: 150,
  },
  metaLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 6,
  },

  // Title and Meta Section
  titleSection: {
    marginBottom: 15,
  },
  workTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 10,
    lineHeight: 1.4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItemLabel: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 5,
  },
  metaItemValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1e293b',
  },

  // Image Grid Section
  imageSection: {
    marginBottom: 20,
  },
  imageSectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageCell: {
    width: '48%',
    height: 120,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 4,
    border: '1 solid #e2e8f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    border: '1 dashed #cbd5e1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 9,
    color: '#94a3b8',
  },

  // Description Sections
  descriptionSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1 solid #e2e8f0',
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    textAlign: 'left',
    minHeight: 40,
  },
  emptyContent: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Footer Section
  footer: {
    marginTop: 'auto',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  pageNumber: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
  },
});

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

// Helper function to validate and normalize image URLs
const normalizeImageUrl = (url: string | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;

  const trimmedUrl = url.trim();
  if (trimmedUrl === '') return null;

  // ถ้าเป็น data URL (base64) ให้ใช้ตามเดิม
  if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // ถ้าเป็น relative path ให้เพิ่ม protocol
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }

  // ถ้าไม่มี protocol ให้เพิ่ม https://
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    // ถ้าเป็น path ภายใน (เริ่มด้วย /) ให้ใช้ตามเดิม
    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  }

  return trimmedUrl;
};

const AdminWorkFilterPdfDocument = ({
  results,
  filterMeta,
}: AdminWorkFilterPdfDocumentProps) => {
  const isAllTeachers = filterMeta?.isAllTeachers || false;

  return (
    <Document>
      {results.map((work, index) => (
        <Page key={work.id} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <Image
                  src="/logo-hongson-metaverse.png"
                  style={styles.logo}
                />
              </View>
              <View style={styles.schoolInfo}>
                <Text style={styles.schoolName}>
                  โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ
                </Text>
                <Text style={styles.schoolSubtext}>
                  <Text style={{ fontSize: 12, color: '#475569', lineHeight: 1.3 }}>
                    สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาแม่ฮ่องสอน&nbsp;
                  </Text>
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {isAllTeachers ? (
                <>
                  <Text style={styles.metaLabel}>รายงาน:</Text>
                  <Text style={styles.metaValue}>ผลงานครูทั้งหมด</Text>
                  <Text style={styles.metaLabel}>ครูผู้สอน:</Text>
                  <Text style={styles.metaValue}>{work.teacher_name}</Text>
                  <Text style={styles.metaLabel}>กลุ่มสาระ:</Text>
                  <Text style={styles.metaValue}>{work.subject_group}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.metaLabel}>ครูผู้สอน:</Text>
                  <Text style={styles.metaValue}>{work.teacher_name}</Text>
                  <Text style={styles.metaLabel}>กลุ่มสาระ:</Text>
                  <Text style={styles.metaValue}>{work.subject_group}</Text>
                </>
              )}
              <Text style={styles.metaLabel}>วันที่จัดกิจกรรม:</Text>
              <Text style={styles.metaValue}>{formatDate(work.created_at)}</Text>
            </View>
          </View>

          {/* Title and Meta */}
          <View style={styles.titleSection}>
            <Text style={styles.workTitle}>{work.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>หมวดหมู่งาน:</Text>
                <Text style={styles.metaItemValue}>{work.work_category}</Text>
              </View>
            </View>
          </View>

          {/* Image Grid (2x2) */}
          <View style={styles.imageSection}>
            <Text style={styles.imageSectionTitle}>รูปภาพประกอบ</Text>
            <View style={styles.imageGrid}>
              {Array.from({ length: 4 }).map((_, i) => {
                // ใช้ normalizeImageUrl เพื่อตรวจสอบและ normalize URL
                const imageUrl = normalizeImageUrl(work.images?.[i]);

                // ตรวจสอบอีกครั้งว่า imageUrl ถูกต้อง
                const isValidUrl = imageUrl && (
                  imageUrl.startsWith('http://') ||
                  imageUrl.startsWith('https://') ||
                  imageUrl.startsWith('/') ||
                  imageUrl.startsWith('data:')
                );

                return (
                  <View key={i} style={styles.imageCell}>
                    {isValidUrl ? (
                      <Image
                        src={imageUrl}
                        style={styles.image}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>ไม่มีภาพ</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Description Sections */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>สรุปกิจกรรม / รายละเอียด</Text>
            <Text style={styles.sectionContent}>
              {work.description || (
                <Text style={styles.emptyContent}>- ไม่มีรายละเอียด -</Text>
              )}
            </Text>
          </View>

          {/* Page Number Only */}
          <View style={styles.footer}>
            <Text style={styles.pageNumber}>
              หน้า {index + 1} / {results.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default AdminWorkFilterPdfDocument;

