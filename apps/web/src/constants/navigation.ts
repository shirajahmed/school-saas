import { UserRole } from '@/types/auth';
import { NavItem, SidebarSection } from '@/types/navigation';

export const DASHBOARD_ROUTES = {
  OVERVIEW: '/dashboard',
  STUDENTS: '/dashboard/students',
  TEACHERS: '/dashboard/teachers',
  CLASSES: '/dashboard/classes',
  ATTENDANCE: '/dashboard/attendance',
  EXAMS: '/dashboard/exams',
  REPORTS: '/dashboard/reports',
  AI: '/dashboard/ai',
  ACCOUNT: '/dashboard/account',
  SETTINGS: '/dashboard/settings',
} as const;

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: DASHBOARD_ROUTES.OVERVIEW,
        icon: 'LayoutDashboard',
        roles: Object.values(UserRole),
      },
    ],
  },
  {
    title: 'Academic',
    items: [
      {
        title: 'Students',
        href: DASHBOARD_ROUTES.STUDENTS,
        icon: 'Users',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
      },
      {
        title: 'Teachers',
        href: DASHBOARD_ROUTES.TEACHERS,
        icon: 'UserCheck',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN],
      },
      {
        title: 'Classes',
        href: DASHBOARD_ROUTES.CLASSES,
        icon: 'BookOpen',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
      },
      {
        title: 'Attendance',
        href: DASHBOARD_ROUTES.ATTENDANCE,
        icon: 'Calendar',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
      },
      {
        title: 'Exams & Results',
        href: DASHBOARD_ROUTES.EXAMS,
        icon: 'FileText',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TEACHER],
      },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      {
        title: 'AI Dashboard',
        href: DASHBOARD_ROUTES.AI,
        icon: 'Bot',
        roles: Object.values(UserRole),
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Reports',
        href: DASHBOARD_ROUTES.REPORTS,
        icon: 'BarChart3',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN],
      },
      {
        title: 'Account',
        href: DASHBOARD_ROUTES.ACCOUNT,
        icon: 'CreditCard',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
      },
      {
        title: 'Settings',
        href: DASHBOARD_ROUTES.SETTINGS,
        icon: 'Settings',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.BRANCH_ADMIN],
      },
    ],
  },
];
