'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

export function OverviewPage() {
  const { t } = useLanguage();

  const stats = [
    {
      title: t('dashboard.totalStudents'),
      value: '1,234',
      change: '+12%',
      icon: Users,
    },
    {
      title: t('dashboard.totalTeachers'),
      value: '89',
      change: '+3%',
      icon: GraduationCap,
    },
    {
      title: t('dashboard.classesToday'),
      value: '24',
      change: '0%',
      icon: Calendar,
    },
    {
      title: t('dashboard.attendanceRate'),
      value: '94.2%',
      change: '+2.1%',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcome')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New student enrolled</p>
                  <p className="text-xs text-muted-foreground">John Doe joined Class 10A</p>
                </div>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Attendance marked</p>
                  <p className="text-xs text-muted-foreground">Class 9B attendance completed</p>
                </div>
                <span className="text-xs text-muted-foreground">5 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              {t('dashboard.markAttendance')}
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              {t('dashboard.addStudent')}
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              {t('dashboard.generateReport')}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
