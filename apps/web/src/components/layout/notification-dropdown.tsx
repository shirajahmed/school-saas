'use client';

import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

const notifications = [
  {
    id: 1,
    title: 'New student enrolled',
    message: 'John Doe has been enrolled in Class 10A',
    time: '2 min ago',
    read: false,
  },
  {
    id: 2,
    title: 'Attendance marked',
    message: 'Class 9B attendance has been completed',
    time: '5 min ago',
    read: false,
  },
  {
    id: 3,
    title: 'Exam scheduled',
    message: 'Mathematics exam scheduled for next week',
    time: '1 hour ago',
    read: true,
  },
  {
    id: 4,
    title: 'Fee payment received',
    message: 'Payment received from Sarah Wilson',
    time: '2 hours ago',
    read: true,
  },
];

export function NotificationDropdown() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white text-[10px]">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-4 cursor-pointer"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center">
          <Button variant="ghost" size="sm" className="w-full">
            View all notifications
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
