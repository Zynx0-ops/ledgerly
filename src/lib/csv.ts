/**
 * A small, dependency-free CSV reader built for bank exports, which are messy:
 * quoted fields containing commas, CRLF line endings, a BOM from Excel, and a
 * different column layout at every institution.
 */

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ColumnRole =
  | "date"
  | "merchant"
  | "amount"
  | "debit"
  | "credit"
  | "category"
  | "notes"
  | "ignore";

/** Bank CSVs use a handful of header spellings — guess, then let the user correct. */
export function guessRoles(headers: string[]): ColumnRole[] {
  return headers.map((h) => {
    const k = h.toLowerCase().replace(/[^a-z]/g, "");
    if (/^(date|transactiondate|posteddate|postingdate|datetime)$/.test(k)) return "date";
    if (/(date)/.test(k) && !/(post|avail)/.test(k)) return "date";
    if (/^(description|merchant|name|payee|memo|details|transaction)$/.test(k)) return "merchant";
    if (/^(amount|value|transactionamount)$/.test(k)) return "amount";
    if (/^(debit|withdrawal|withdrawals|moneyout|paymentsandcredits)$/.test(k)) return "debit";
    if (/^(credit|deposit|deposits|moneyin)$/.test(k)) return "credit";
    if (/^(category|categoryname|type)$/.test(k)) return "category";
    if (/^(notes?|comment|reference|memo)$/.test(k)) return "notes";
    if (/desc|merch|payee/.test(k)) return "merchant";
    return "ignore";
  });
}

export const ROLE_LABELS: Record<ColumnRole, string> = {
  date: "Date",
  merchant: "Merchant / description",
  amount: "Amount (signed)",
  debit: "Debit (money out)",
  credit: "Credit (money in)",
  category: "Category name",
  notes: "Notes",
  ignore: "— Skip this column —",
};
