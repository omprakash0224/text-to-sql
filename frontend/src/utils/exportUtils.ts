/**
 * DataSpeak — CSV Export Utility
 * Handles client-side RFC 4180 CSV generation with mandatory formula injection defense.
 * Per AGENTS.md Section 4.C: Cells starting with '=', '+', '-', or '@' are neutralized.
 */

/**
 * Sanitize an individual cell value against CSV formula injection (DDE attacks).
 * If a string begins with =, +, -, or @, prefix it with an apostrophe or wrap safely.
 */
export function sanitizeCellValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // CSV Formula Injection Defense
  if (/^[=+\-@]/.test(str)) {
    // Neutralize spreadsheet executable formulas by prefixing with a single quote
    str = `'${str}`;
  }

  // RFC 4180 escaping: if cell contains quotes, commas, or newlines, wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert tabular rows and column keys into a sanitized RFC 4180 CSV string.
 */
export function generateCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const headerLine = columns.map((col) => sanitizeCellValue(col)).join(',');

  const dataLines = rows.map((row) =>
    columns.map((col) => sanitizeCellValue(row[col])).join(',')
  );

  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Trigger browser file download of CSV content with standardized naming:
 * dataspeak-{slugified-question}-{YYYY-MM-DD}.csv
 */
export function downloadCsv(
  columns: string[],
  rows: Record<string, unknown>[],
  questionPrompt?: string
): string {
  const csvContent = generateCsv(columns, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const slug = (questionPrompt || 'results')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)
    .replace(/^-+|-+$/g, '');

  const filename = `dataspeak-${slug || 'query'}-${dateStr}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
