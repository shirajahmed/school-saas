import { ComingSoon } from '@/components/ui/coming-soon';

export default function ExamsPage() {
  return (
    <ComingSoon
      title="Exams & Results"
      description="Comprehensive examination and result management system"
      features={[
        'Schedule and manage exams',
        'Create question papers',
        'Record and calculate results',
        'Generate report cards',
        'Performance analytics',
        'Grade management system',
        'Parent result notifications'
      ]}
    />
  );
}
