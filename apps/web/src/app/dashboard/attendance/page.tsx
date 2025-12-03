import { ComingSoon } from '@/components/ui/coming-soon';

export default function AttendancePage() {
  return (
    <ComingSoon
      title="Attendance Management"
      description="Digital attendance tracking and monitoring system"
      features={[
        'Mark daily attendance for students',
        'Real-time attendance tracking',
        'Generate attendance reports',
        'Send notifications to parents',
        'Attendance analytics and insights',
        'Bulk attendance operations'
      ]}
    />
  );
}
