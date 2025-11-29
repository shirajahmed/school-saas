'use client';

import { useState } from 'react';
import { Menu, Search, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import { NotificationDropdown } from './notification-dropdown';
import { useLanguage } from '@/providers/language-provider';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center px-4 gap-4">
        {/* Left side - Menu Toggle and Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="shrink-0"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students, teachers, classes..."
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Mobile Search Toggle */}
          <div className="md:hidden flex-1">
            {!searchOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="w-full justify-start text-muted-foreground"
              >
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Search...</span>
              </Button>
            )}
          </div>
        </div>

        {/* Right side - All icons */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-4 z-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students, teachers, classes..."
              className="pl-10 pr-10"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(false)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
