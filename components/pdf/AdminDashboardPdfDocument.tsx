'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Sarabun fonts for Thai text support
const globalObj = globalThis as typeof globalThis & { __sarabunFontsRegistered?: boolean };

if (!globalObj.__sarabunFontsRegistered) {
  try {
    Font.register({
      family: 'Sarabun',
      fonts: [
        { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 400, fontStyle: 'normal' },
        { src: '/fonts/Sarabun-Medium.ttf', fontWeight: 500, fontStyle: 'normal' },
        { src: '/fonts/Sarabun-SemiBold.ttf', fontWeight: 600, fontStyle: 'normal' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700, fontStyle: 'normal' },
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

interface DepartmentStats {
  department: string;
  totalUsers: number;
  submittedUsers: number;
  notSubmittedUsers: number;
  totalEntries: number;
  approvedByDeputy: number;
  approvedByDirector: number;
  fullyApproved: number;
}

interface AdminDashboardPdfDocumentProps {
  totalUsers: number;
  totalSubmitted: number;
  totalEntries: number;
  periodText: string;
  categoryChartData: Array<{ name: string; fullName: string; count: number; color: string }>;
  monthlyChartData: Array<{ month: string; monthNum: number; count: number }>;
  departmentStats: DepartmentStats[];
  generatedAt: string;
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
    backgroundColor: '#fff',
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
    minWidth: 0,
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
  
  // Title Section
  titleSection: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  
  // Stats Cards Section
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1 solid #e2e8f0',
  },
  statTitle: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 9,
    color: '#64748b',
  },
  
  // Chart Section
  chartSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1 solid #e2e8f0',
  },
  chartPlaceholder: {
    padding: 20,
    backgroundColor: '#f1f5f9',
    border: '1 dashed #cbd5e1',
    borderRadius: 4,
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  
  // Department Stats Section
  departmentSection: {
    marginBottom: 20,
  },
  departmentTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottom: '2 solid #1e293b',
  },
  departmentCard: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1 solid #e2e8f0',
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  departmentName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
  },
  departmentTotal: {
    fontSize: 16,
    fontWeight: 700,
    color: '#10b981',
  },
  departmentStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  departmentStatItem: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    border: '1 solid #e2e8f0',
  },
  departmentStatLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  departmentStatValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
  },
  departmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTop: '1 solid #e2e8f0',
    fontSize: 9,
    color: '#64748b',
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1 solid #e2e8f0',
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
  },
  pageNumber: {
    fontSize: 10,
    color: '#64748b',
  },
});

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('th-TH').format(num);
};

const AdminDashboardPdfDocument = ({
  totalUsers,
  totalSubmitted,
  totalEntries,
  periodText,
  categoryChartData,
  monthlyChartData,
  departmentStats,
  generatedAt,
}: AdminDashboardPdfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="portrait">
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
              สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาแม่ฮ่องสอน
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.metaLabel}>วันที่สร้างรายงาน:</Text>
          <Text style={styles.metaValue}>{generatedAt}</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>ภาพรวมผู้บริหาร</Text>
        <Text style={styles.subtitle}>ช่วงเวลา: {periodText}</Text>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>บุคลากรทั้งหมด</Text>
            <Text style={styles.statValue}>{formatNumber(totalUsers)}</Text>
            <Text style={styles.statSubtitle}>คน</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>บุคลากรที่ส่งงาน</Text>
            <Text style={styles.statValue}>{formatNumber(totalSubmitted)}</Text>
            <Text style={styles.statSubtitle}>
              {totalUsers > 0 ? Math.round((totalSubmitted / totalUsers) * 100) : 0}% ของทั้งหมด
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>ผลงานทั้งหมด</Text>
            <Text style={styles.statValue}>{formatNumber(totalEntries)}</Text>
            <Text style={styles.statSubtitle}>รายการ</Text>
          </View>
        </View>
      </View>

      {/* Charts Placeholder */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>สถิติแยกตามหมวดหมู่</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            กราฟสถิติแยกตามหมวดหมู่ (แสดงในเวอร์ชันออนไลน์)
          </Text>
        </View>
      </View>

      {/* Department Stats */}
      <View style={styles.departmentSection}>
        <Text style={styles.departmentTitle}>รายงานสถิติตามกลุ่มสาระการเรียนรู้</Text>
        {departmentStats.map((stat, idx) => (
          <View key={idx} style={styles.departmentCard} wrap={false}>
            <View style={styles.departmentHeader}>
              <Text style={styles.departmentName}>{stat.department}</Text>
              <Text style={styles.departmentTotal}>{formatNumber(stat.totalEntries)} งาน</Text>
            </View>
            <View style={styles.departmentStatsGrid}>
              <View style={styles.departmentStatItem}>
                <Text style={styles.departmentStatLabel}>บุคลากรทั้งหมด</Text>
                <Text style={styles.departmentStatValue}>{formatNumber(stat.totalUsers)}</Text>
              </View>
              <View style={styles.departmentStatItem}>
                <Text style={styles.departmentStatLabel}>ส่งงานแล้ว</Text>
                <Text style={styles.departmentStatValue}>{formatNumber(stat.submittedUsers)}</Text>
              </View>
              <View style={styles.departmentStatItem}>
                <Text style={styles.departmentStatLabel}>ยังไม่ส่งงาน</Text>
                <Text style={styles.departmentStatValue}>{formatNumber(stat.notSubmittedUsers)}</Text>
              </View>
              <View style={styles.departmentStatItem}>
                <Text style={styles.departmentStatLabel}>อนุมัติครบ</Text>
                <Text style={styles.departmentStatValue}>{formatNumber(stat.fullyApproved)}</Text>
              </View>
            </View>
            <View style={styles.departmentFooter}>
              <Text>รอง ผอ.: {formatNumber(stat.approvedByDeputy)} | ผอ.: {formatNumber(stat.approvedByDirector)}</Text>
              <Text>
                รายการต่อคน: {stat.totalUsers > 0 ? (stat.totalEntries / stat.totalUsers).toFixed(1) : '0'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>สร้างเมื่อ: {generatedAt}</Text>
        <Text style={styles.pageNumber}>หน้า 1</Text>
      </View>
    </Page>
  </Document>
);

export default AdminDashboardPdfDocument;

