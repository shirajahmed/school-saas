'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Language } from '@/types/common';
import { STORAGE_KEYS } from '@/constants/config';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.teachers': 'Teachers',
    'nav.classes': 'Classes',
    'nav.attendance': 'Attendance',
    'nav.exams': 'Exams & Results',
    'nav.ai': 'AI Dashboard',
    'nav.reports': 'Reports',
    'nav.account': 'Account',
    'nav.settings': 'Settings',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back! Here\'s what\'s happening at your school today.',
    'dashboard.totalStudents': 'Total Students',
    'dashboard.totalTeachers': 'Total Teachers',
    'dashboard.classesToday': 'Classes Today',
    'dashboard.attendanceRate': 'Attendance Rate',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.markAttendance': 'Mark Attendance',
    'dashboard.addStudent': 'Add New Student',
    'dashboard.generateReport': 'Generate Report',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.createAccount': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': 'Don\'t have an account?',
    
    // Common
    'common.search': 'Search...',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.submit': 'Submit',
    'common.close': 'Close',
    
    // Header
    'header.search': 'Search students, teachers, classes...',
    'header.notifications': 'Notifications',
    'header.profile': 'Profile',
    'header.logout': 'Log out',
  },
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.students': 'छात्र',
    'nav.teachers': 'शिक्षक',
    'nav.classes': 'कक्षाएं',
    'nav.attendance': 'उपस्थिति',
    'nav.exams': 'परीक्षा और परिणाम',
    'nav.ai': 'AI डैशबोर्ड',
    'nav.reports': 'रिपोर्ट',
    'nav.account': 'खाता',
    'nav.settings': 'सेटिंग्स',
    
    // Dashboard
    'dashboard.title': 'डैशबोर्ड',
    'dashboard.welcome': 'वापसी पर स्वागत है! यहाँ आज आपके स्कूल में क्या हो रहा है।',
    'dashboard.totalStudents': 'कुल छात्र',
    'dashboard.totalTeachers': 'कुल शिक्षक',
    'dashboard.classesToday': 'आज की कक्षाएं',
    'dashboard.attendanceRate': 'उपस्थिति दर',
    'dashboard.recentActivity': 'हाल की गतिविधि',
    'dashboard.quickActions': 'त्वरित कार्य',
    'dashboard.markAttendance': 'उपस्थिति चिह्नित करें',
    'dashboard.addStudent': 'नया छात्र जोड़ें',
    'dashboard.generateReport': 'रिपोर्ट बनाएं',
    
    // Auth
    'auth.signIn': 'साइन इन',
    'auth.signUp': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.firstName': 'पहला नाम',
    'auth.lastName': 'अंतिम नाम',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.createAccount': 'खाता बनाएं',
    'auth.alreadyHaveAccount': 'पहले से खाता है?',
    'auth.dontHaveAccount': 'खाता नहीं है?',
    
    // Common
    'common.search': 'खोजें...',
    'common.loading': 'लोड हो रहा है...',
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.submit': 'जमा करें',
    'common.close': 'बंद करें',
    
    // Header
    'header.search': 'छात्र, शिक्षक, कक्षाएं खोजें...',
    'header.notifications': 'सूचनाएं',
    'header.profile': 'प्रोफ़ाइल',
    'header.logout': 'लॉग आउट',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
    if (stored && ['en', 'hi'].includes(stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
    setLanguageState(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
