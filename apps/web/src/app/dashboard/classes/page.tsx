import { ComingSoon } from '@/components/ui/coming-soon';

export default function ClassesPage() {
  return (
    <ComingSoon
      title="Classes Management"
      description="Manage classes, sections, and academic structure"
      features={[
        'Create and manage classes',
        'Organize students into sections',
        'Assign class teachers',
        'Set class schedules and timetables',
        'Track class performance analytics'
      ]}
    />
  );
}
