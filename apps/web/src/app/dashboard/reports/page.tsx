import { ComingSoon } from '@/components/ui/coming-soon';

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports & Analytics"
      description="Comprehensive reporting and data analytics dashboard"
      features={[
        'Student performance reports',
        'Attendance analytics',
        'Financial reports and insights',
        'Teacher performance metrics',
        'Custom report builder',
        'Export to PDF and Excel',
        'Automated report scheduling',
        'Interactive data visualizations'
      ]}
    />
  );
}
