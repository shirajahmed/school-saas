'use client';

import { Clock, Rocket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';

interface ComingSoonProps {
  title: string;
  description?: string;
  features?: string[];
}

export function ComingSoon({ title, description, features }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-lg">
            {description || 'This feature is currently under development'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Coming Soon</span>
          </div>
          
          {features && features.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Planned Features:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
