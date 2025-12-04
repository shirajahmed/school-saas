'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            School Management
            <span className="text-primary"> System</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A comprehensive, AI-powered platform for modern educational institutions. 
            Manage students, teachers, classes, and more with ease.
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Access your school dashboard or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/auth/register')}>
                Create School Account
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 Academic Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive student and teacher management with class scheduling and curriculum tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                AI-powered tools for students, teachers, and administrators to enhance learning and productivity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Analytics & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed insights and reports on attendance, performance, and institutional metrics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
