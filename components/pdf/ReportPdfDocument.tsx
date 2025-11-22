'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

const registerSarabunFonts = () => {
  const globalObj = globalThis as typeof globalThis & { __sarabunFontsRegistered?: boolean };
  if (globalObj.__sarabunFontsRegistered) return;

  Font.register({
    family: 'Sarabun',
    fonts: [
      { src: '/fonts/Sarabun-Thin.ttf', fontWeight: 100 },
      { src: '/fonts/Sarabun-ThinItalic.ttf', fontWeight: 100, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-ExtraLight.ttf', fontWeight: 200 },
      { src: '/fonts/Sarabun-ExtraLightItalic.ttf', fontWeight: 200, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-Light.ttf', fontWeight: 300 },
      { src: '/fonts/Sarabun-LightItalic.ttf', fontWeight: 300, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Sarabun-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-Medium.ttf', fontWeight: 500 },
      { src: '/fonts/Sarabun-MediumItalic.ttf', fontWeight: 500, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-SemiBold.ttf', fontWeight: 600 },
      { src: '/fonts/Sarabun-SemiBoldItalic.ttf', fontWeight: 600, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700 },
      { src: '/fonts/Sarabun-BoldItalic.ttf', fontWeight: 700, fontStyle: 'italic' },
      { src: '/fonts/Sarabun-ExtraBold.ttf', fontWeight: 800 },
      { src: '/fonts/Sarabun-ExtraBoldItalic.ttf', fontWeight: 800, fontStyle: 'italic' },
    ],
  });

  Font.register({
    family: 'THSarabunNew',
    fonts: [
      { src: '/fonts/THSarabunNew.ttf', fontWeight: 'normal' },
      { src: '/fonts/TH Sarabun New Bold.ttf', fontWeight: 'bold' },
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
    padding: 40,
    fontSize: 11,
    color: '#1e293b',
  },
  header: {
    borderBottom: '2 solid #0f172a',
    paddingBottom: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 2,
  },
  entryCard: {
    borderLeft: '3 solid #10b981',
    paddingLeft: 12,
    marginBottom: 18,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  entryMeta: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 6,
  },
  entryBadge: {
    fontSize: 9,
    color: '#0f172a',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entryDescription: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 6,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 6,
  },
  imageSection: {
    marginTop: 10,
  },
  imageLabel: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  image: {
    width: 80,
    height: 80,
    objectFit: 'cover',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 40,
  },
  footer: {
    borderTop: '1 solid #cbd5f5',
    paddingTop: 12,
    marginTop: 24,
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

const formatDateRange = (start: string, end?: string) => {
  if (!start) return '-';
  const formatter = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const startText = formatter.format(new Date(start));
  if (!end || end === start) return startText;
  const endText = formatter.format(new Date(end));
  return `${startText} - ${endText}`;
};

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    result.push(items.slice(i, i + chunkSize));
  }
  return result;
};

const ReportPdfDocument = ({
  entries,
  user,
  title,
  subtitle,
  generatedAt,
  showUserColumn = false,
  usersMap = {},
}: ReportPdfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>ผู้รายงาน</Text>
            <Text style={styles.metaValue}>{user.name || '-'}</Text>
            {user.position && <Text style={styles.subtitle}>{user.position}</Text>}
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.metaLabel}>วันที่พิมพ์</Text>
            <Text style={styles.metaValue}>{generatedAt}</Text>
          </View>
        </View>
      </View>

      {entries.length === 0 ? (
        <Text style={styles.emptyState}>ไม่มีข้อมูลในช่วงเวลาที่เลือก</Text>
      ) : (
        entries.map((entry, index) => (
          <View key={`${entry.id}-${index}`} style={styles.entryCard} wrap={false}>
            <Text style={styles.entryTitle}>
              {index + 1}. {entry.title}
            </Text>

            <Text style={styles.entryMeta}>
              {formatDateRange(entry.dateStart, entry.dateEnd)}
              {showUserColumn && entry.userId
                ? `  •  โดย ${usersMap[entry.userId] || 'ไม่ระบุ'}`
                : ''}
            </Text>

            <Text style={styles.entryBadge}>{entry.category}</Text>

            {entry.description && (
              <Text style={styles.entryDescription}>{entry.description}</Text>
            )}

            {entry.images && entry.images.length > 0 && (
              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>ภาพประกอบ ({entry.images.length})</Text>
                <View style={styles.imageGrid}>
                  {chunkArray(entry.images, 5).map((row, rowIndex) => (
                    <View key={`${entry.id}-row-${rowIndex}`} style={styles.imageRow}>
                      {row.map((imageUrl, imageIndex) => (
                        // @react-pdf/renderer images render into PDFs, so alt text is not supported.
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <Image key={`${entry.id}-${rowIndex}-${imageIndex}`} src={imageUrl} style={styles.image} />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={styles.footer}>
        ระบบ Hongson T-Folio | เอกสารนี้ถูกสร้างขึ้นจากระบบอิเล็กทรอนิกส์
      </Text>
    </Page>
  </Document>
);

export default ReportPdfDocument;

