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

export interface QueryParams {
  tableName?: string;
  whereColumn?: string;
  whereValue?: string;
  orderByColumn?: string;
  orderDirection?: 'asc' | 'desc';
  rawQuery?: string;
}