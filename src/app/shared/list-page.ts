import { HttpParams } from '@angular/common/http';

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number | null;
  size: number;
}

export interface ListQuery {
  page: number;
  size: number;
  fromDate?: string | null;
  toDate?: string | null;
  transactionType?: string | null;
  fromTo?: string | null;
}

export function monthToDate(): { fromDate: string; toDate: string } {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return {
    fromDate: `${now.getFullYear()}-${month}-01`,
    toDate: `${now.getFullYear()}-${month}-${day}`,
  };
}

export function listParams(query: ListQuery): HttpParams {
  let params = new HttpParams().set('page', String(query.page)).set('size', String(query.size));
  const fromDate = query.fromDate?.trim();
  const toDate = query.toDate?.trim();
  const transactionType = query.transactionType?.trim();
  const fromTo = query.fromTo?.trim();
  if (fromDate) {
    params = params.set('fromDate', fromDate);
  }
  if (toDate) {
    params = params.set('toDate', toDate);
  }
  if (transactionType) {
    params = params.set('transactionType', transactionType);
  }
  if (fromTo) {
    params = params.set('fromTo', fromTo);
  }
  return params;
}

export function readPage<T>(body: unknown): PageResult<T> {
  if (Array.isArray(body)) {
    return {
      content: body as T[],
      totalElements: body.length,
      totalPages: body.length > 0 ? 1 : 0,
      number: 0,
      size: body.length,
    };
  }
  if (!body || typeof body !== 'object') {
    return { content: [], totalElements: 0, totalPages: 0, number: null, size: 0 };
  }
  const record = body as Record<string, unknown>;
  const content = Array.isArray(record['content']) ? (record['content'] as T[]) : [];
  const page =
    record['page'] && typeof record['page'] === 'object'
      ? (record['page'] as Record<string, unknown>)
      : record;
  const totalElements = numberOr(page['totalElements'], content.length);
  const size = numberOr(page['size'], content.length);
  const totalPages = numberOr(
    page['totalPages'],
    size > 0 ? Math.ceil(totalElements / size) : 0,
  );
  return {
    content,
    totalElements,
    totalPages,
    number: page['number'] === undefined || page['number'] === null ? null : numberOr(page['number'], 0),
    size,
  };
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
