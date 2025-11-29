import { ComingSoon } from '@/components/ui/coming-soon';

export default function AIDashboardPage() {
  return (
    <ComingSoon
      title="AI Dashboard"
      description="Artificial Intelligence powered educational tools and insights"
      features={[
        'AI Student Assistant for personalized learning',
        'AI Teacher Assistant for lesson planning',
        'Automated question paper generation',
        'Intelligent performance predictions',
        'Smart recommendation system',
        'Natural language query interface',
        'Automated grading and feedback'
      ]}
    />
  );
}
