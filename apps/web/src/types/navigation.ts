import { UserRole } from './auth';

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
  roles?: UserRole[];
  module?: string;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
}
