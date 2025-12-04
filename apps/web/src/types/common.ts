export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange";
  options?: SelectOption[];
}

export type Theme = "light" | "dark" | "system";
export type Language = "en" | "hi";
