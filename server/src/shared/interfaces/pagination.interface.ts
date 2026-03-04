export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ResolvePaginationQuery extends PaginationQuery {
  count: number;
}
