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

export interface FilterType {
  column: string;
  value: string;
  condition: 'AND' | 'OR';
}

export interface QueryParams {
  tableName: string;
  filters: FilterType[];
  orderByColumn?: string;
  orderDirection?: 'asc' | 'desc';
  limit: number;
  rawQuery?: string;
  groupByColumns?: string[];
}

export interface Relation {
  name: string;
  relatedTable: string;
  cardinality: string;
  relationshipType: string;
  constraints: Array<{
    field: string;
    relatedField: string;
  }>;
}

export interface RelationData {
  tableName: string;
  relations: Relation[];
}