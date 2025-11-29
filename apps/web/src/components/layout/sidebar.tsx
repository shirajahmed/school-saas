'use client';

import { cn } from '@/lib/utils';
import { SIDEBAR_SECTIONS } from '@/constants/navigation';
import { useAuth } from '@/providers/auth-provider';
import { SidebarSection } from './sidebar-section';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth();

  const filteredSections = SIDEBAR_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.roles || item.roles.some(role => user?.roles.includes(role))
    ),
  })).filter(section => section.items.length > 0);

  return (
    <div className={cn(
      'bg-card border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex h-16 items-center px-4 border-b border-border">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-foreground">
            School MS
          </h2>
        )}
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {filteredSections.map((section, index) => (
            <SidebarSection
              key={index}
              section={section}
              collapsed={collapsed}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
