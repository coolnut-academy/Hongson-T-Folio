'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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

export interface DepartmentStatsPdf {
  department: string;
  totalUsers: number;
  submittedUsers: number;
  notSubmittedUsers: number;
  totalEntries: number;
  approvedByDeputy: number;
  approvedByDirector: number;
  fullyApproved: number;
}

interface AdminStatsPdfDocumentProps {
  departmentStats: DepartmentStatsPdf[];
  summary: {
    totalUsers: number;
    totalSubmitted: number;
    totalEntries: number;
  };
  periodText: string;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    padding: 30,
    fontSize: 11,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottom: '2 solid #0f172a',
    paddingBottom: 12,
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
  },
  metaText: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    border: '1 solid #e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 6,
  },
  card: {
    border: '1 solid #e2e8f0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statBox: {
    width: '25%',
    paddingRight: 10,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  footerRow: {
    marginTop: 10,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 6,
    fontSize: 9,
    color: '#475569',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    borderTop: '1 solid #cbd5f5',
    paddingTop: 10,
    marginTop: 14,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
});

const percent = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : '0%';

const AdminStatsPdfDocument = ({
  departmentStats,
  summary,
  periodText,
  generatedAt,
}: AdminStatsPdfDocumentProps) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>รายงานสถิติงานบุคลากร</Text>
        <Text style={styles.subtitle}>ช่วงเวลา: {periodText}</Text>
        <Text style={styles.metaText}>วันที่พิมพ์: {generatedAt}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>บุคลากรทั้งหมด</Text>
          <Text style={styles.summaryValue}>{summary.totalUsers}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>บุคลากรที่ส่งงาน</Text>
          <Text style={styles.summaryValue}>
            {summary.totalSubmitted} ({percent(summary.totalSubmitted, summary.totalUsers)})
          </Text>
        </View>
        <View style={{ ...styles.summaryCard, marginRight: 0 }}>
          <Text style={styles.summaryLabel}>ผลงานทั้งหมด</Text>
          <Text style={styles.summaryValue}>{summary.totalEntries}</Text>
        </View>
      </View>

      {departmentStats.length === 0 ? (
        <Text style={styles.metaText}>ไม่มีข้อมูลในช่วงเวลาที่เลือก</Text>
      ) : (
        departmentStats.map((dept) => (
          <View key={dept.department} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{dept.department}</Text>
              <Text style={styles.metaText}>ผลงานทั้งหมด {dept.totalEntries} รายการ</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>บุคลากรทั้งหมด</Text>
                <Text style={styles.statValue}>{dept.totalUsers}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ส่งงานแล้ว</Text>
                <Text style={styles.statValue}>
                  {dept.submittedUsers} ({percent(dept.submittedUsers, dept.totalUsers)})
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ยังไม่ส่งงาน</Text>
                <Text style={styles.statValue}>{dept.notSubmittedUsers}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>อนุมัติครบ</Text>
                <Text style={styles.statValue}>
                  {dept.fullyApproved} ({percent(dept.fullyApproved, dept.totalUsers)})
                </Text>
              </View>
            </View>
            <View style={styles.footerRow}>
              <Text>รอง ผอ.: {dept.approvedByDeputy}</Text>
              <Text>ผอ.: {dept.approvedByDirector}</Text>
              <Text>
                รายการต่อคน:{' '}
                {dept.totalUsers > 0 ? (dept.totalEntries / dept.totalUsers).toFixed(1) : '0'}
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.footer}>
        ระบบ Hongson T-Folio | เอกสารนี้ถูกสร้างขึ้นจากระบบอิเล็กทรอนิกส์
      </Text>
    </Page>
  </Document>
);

export default AdminStatsPdfDocument;

