export interface Database {
  name: string;
  id: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Column {
  name: string;
  type: string;
}

export interface Filter {
  column: string;
  value: string;
  condition: 'AND' | 'OR';
}

export interface QueryParams {
  tableName: string;
  filters: Filter[];
  orderByColumn?: string;
  orderDirection?: 'asc' | 'desc';
  rawQuery?: string;
}