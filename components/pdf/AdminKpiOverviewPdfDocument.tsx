'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { DashboardKpiData } from '@/app/admin/dashboard/kpi-overview/types';

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

interface AdminKpiOverviewPdfDocumentProps {
  data: DashboardKpiData;
  rangeLabel: string;
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
    marginBottom: 20,
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
  
  // KPI Cards Section
  kpiSection: {
    marginBottom: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 15,
  },
  kpiCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1 solid #e2e8f0',
    marginBottom: 12,
  },
  kpiCardTitle: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 6,
  },
  kpiCardValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 4,
  },
  kpiCardSubtitle: {
    fontSize: 9,
    color: '#64748b',
  },
  kpiCardBadge: {
    fontSize: 8,
    color: '#10b981',
    backgroundColor: '#ecfdf5',
    padding: 2,
    borderRadius: 4,
    marginTop: 4,
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
  
  // Summary Section
  summarySection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    border: '1 solid #bbf7d0',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottom: '1 solid #d1fae5',
  },
  summaryItemLabel: {
    fontSize: 10,
    color: '#64748b',
    flex: 1,
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
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

const formatPercent = (num: number, showSign: boolean = false): string => {
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
};

const AdminKpiOverviewPdfDocument = ({
  data,
  rangeLabel,
  generatedAt,
}: AdminKpiOverviewPdfDocumentProps) => (
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
          <Text style={styles.metaLabel}>ช่วงเวลา:</Text>
          <Text style={styles.metaValue}>{rangeLabel}</Text>
          <Text style={styles.metaLabel}>วันที่สร้าง:</Text>
          <Text style={styles.metaValue}>{generatedAt}</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Dashboard KPI Overview</Text>
        <Text style={styles.subtitle}>วิเคราะห์ผลงานของครูทุกกลุ่มสาระในรูปแบบพรีเมียมสำหรับผู้บริหาร</Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiSection}>
        <View style={styles.kpiGrid}>
          {/* Total Works Card */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardTitle}>จำนวนผลงานทั้งหมด</Text>
            <Text style={styles.kpiCardValue}>{formatNumber(data.summary.total)}</Text>
            <Text style={styles.kpiCardSubtitle}>ช่วงเวลา: {data.summary.rangeLabel}</Text>
            <Text style={styles.kpiCardBadge}>
              {formatPercent(data.summary.changePct, true)} เทียบกับช่วงก่อนหน้า
            </Text>
          </View>

          {/* Top Subject Card */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardTitle}>TOP SUBJECT</Text>
            <Text style={styles.kpiCardValue}>{data.topSubjectGroup.name}</Text>
            <Text style={styles.kpiCardSubtitle}>
              {formatNumber(data.topSubjectGroup.works)} งาน ({formatPercent(data.topSubjectGroup.percentage)} ของทั้งหมด)
            </Text>
          </View>

          {/* Most Active Category Card */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardTitle}>หมวดงานที่เคลื่อนไหวสูงสุด</Text>
            <Text style={styles.kpiCardValue}>{data.mostActiveCategory.name}</Text>
            <Text style={styles.kpiCardSubtitle}>
              {formatNumber(data.mostActiveCategory.works)} งาน
            </Text>
            <Text style={styles.kpiCardBadge}>
              {formatPercent(data.mostActiveCategory.changePct, true)} เทียบช่วงก่อนหน้า
            </Text>
          </View>

          {/* Top Teacher Card */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardTitle}>ครูที่ส่งผลงานมากที่สุด</Text>
            <Text style={styles.kpiCardValue}>{data.topTeacher.name}</Text>
            <Text style={styles.kpiCardSubtitle}>
              {formatNumber(data.topTeacher.works)} งาน
            </Text>
          </View>

          {/* Fastest Growing Category Card */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardTitle}>หมวดที่เติบโตเร็วที่สุด</Text>
            <Text style={styles.kpiCardValue}>{data.fastestGrowingCategory.name}</Text>
            <Text style={styles.kpiCardSubtitle}>
              การเติบโต: {formatPercent(data.fastestGrowingCategory.growthPct, true)}
            </Text>
            <Text style={styles.kpiCardSubtitle}>
              ช่วงก่อนหน้า: {formatPercent(data.fastestGrowingCategory.previousPct)}
            </Text>
          </View>

          {/* Average Works Card */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardTitle}>ค่าเฉลี่ยงานต่อกลุ่มสาระ</Text>
            <Text style={styles.kpiCardValue}>
              {formatNumber(data.averagePerSubjectGroup.perGroup)} งาน/กลุ่ม
            </Text>
            <Text style={styles.kpiCardSubtitle}>
              {data.averagePerSubjectGroup.description}
            </Text>
          </View>
        </View>
      </View>

      {/* Charts Placeholder */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>จำนวนผลงานแยกตามกลุ่มสาระ</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            กราฟสถิติ (แสดงในเวอร์ชันออนไลน์)
          </Text>
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>สรุปภาพรวม</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>กลุ่มสาระที่มีผลงานมากที่สุด</Text>
          <Text style={styles.summaryItemValue}>
            {data.topSubjectGroup.name} ({formatNumber(data.topSubjectGroup.works)} งาน)
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>หมวดงานที่เติบโตเร็วที่สุด</Text>
          <Text style={styles.summaryItemValue}>
            {data.fastestGrowingCategory.name} ({formatPercent(data.fastestGrowingCategory.growthPct, true)})
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>ครูที่ส่งผลงานมากที่สุด</Text>
          <Text style={styles.summaryItemValue}>
            {data.topTeacher.name} ({formatNumber(data.topTeacher.works)} งาน)
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>สร้างเมื่อ: {generatedAt}</Text>
        <Text style={styles.pageNumber}>หน้า 1</Text>
      </View>
    </Page>
  </Document>
);

export default AdminKpiOverviewPdfDocument;

