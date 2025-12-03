'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SidebarSection as SidebarSectionType } from '@/types/navigation';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  FileText, 
  Bot, 
  BarChart3, 
  CreditCard, 
  Settings 
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  FileText,
  Bot,
  BarChart3,
  CreditCard,
  Settings,
};

interface SidebarSectionProps {
  section: SidebarSectionType;
  collapsed: boolean;
}

export function SidebarSection({ section, collapsed }: SidebarSectionProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      {!collapsed && (
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {section.title}
        </h3>
      )}
      
      <div className="space-y-1">
        {section.items.map((item) => {
          const Icon = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          // Get translation key from href
          const translationKey = `nav.${item.href.split('/').pop()}`;
          const translatedTitle = t(translationKey) !== translationKey ? t(translationKey) : item.title;
          
          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'w-full justify-start',
                collapsed ? 'px-2' : 'px-3',
                isActive && 'bg-secondary text-secondary-foreground'
              )}
              asChild
            >
              <Link href={item.href}>
                {Icon && (
                  <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{translatedTitle}</span>
                    {item.badge && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
