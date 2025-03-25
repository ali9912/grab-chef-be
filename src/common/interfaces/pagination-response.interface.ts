export interface PaginationResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
}
