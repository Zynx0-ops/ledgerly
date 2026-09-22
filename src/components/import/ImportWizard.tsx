"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fieldBase, fieldClass, ghostButton, labelClass, primaryButton } from "@/components/ui/Dialog";
import { SelectField, Switch } from "@/components/ui/Controls";
import { parseCsv, guessRoles, ROLE_LABELS, type ColumnRole } from "@/lib/csv";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { commitImport, stageImport, type StagedRow } from "@/server/actions";
import type { Account } from "@/lib/types";

type Step = "upload" | "map" | "review" | "done";

const ROLES: ColumnRole[] = [
  "date", "merchant", "amount", "debit", "credit", "category", "notes", "ignore",
];

export function ImportWizard({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [roles, setRoles] = useState<ColumnRole[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [flipSign, setFlipSign] = useState(false);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [staged, setStaged] = useState<StagedRow[]>([]);
  const [result, setResult] = useState<{ inserted: number; duplicates: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadText(text: string) {
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setError("That doesn't look like a CSV with any rows in it. Check the file and try again.");
      return;
    }
    setError(null);
    setRows(parsed);
    setRoles(guessRoles(parsed[0]));
    setStep("map");
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setRaw(text);
    loadText(text);
  }

  async function toReview() {
    if (!roles.includes("date")) {
      setError("Pick which column holds the date — nothing can be imported without it.");
      return;
    }
    if (!roles.includes("amount") && !roles.includes("debit") && !roles.includes("credit")) {
      setError("Pick an amount column, or a debit and/or credit pair.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const out = await stageImport(rows, roles, hasHeader, flipSign);
      if (!out.length) {
        setError("No rows could be read with that mapping. Check the date and amount columns.");
      } else {
        setStaged(out);
        setStep("review");
      }
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    setBusy(true);
    try {
      const res = await commitImport(accountId, staged);
      setResult(res);
      setStep("done");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const matched = staged.filter((r) => r.categoryId).length;
  const inflow = staged.filter((r) => r.amountCents > 0).reduce((n, r) => n + r.amountCents, 0);
  const outflow = staged.filter((r) => r.amountCents < 0).reduce((n, r) => n - r.amountCents, 0);

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-wrap items-center gap-2 t-footnote">
        {(["upload", "map", "review"] as Step[]).map((s, i) => {
          const order = ["upload", "map", "review", "done"];
          const active = step === s;
          const passed = order.indexOf(step) > order.indexOf(s);
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-medium ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : passed
                      ? "bg-[var(--good-wash)] text-[var(--good)]"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                }`}
              >
                {passed ? "✓" : i + 1}
              </span>
              <span className={active ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                {s === "upload" ? "Choose a file" : s === "map" ? "Match columns" : "Review"}
              </span>
              {i < 2 ? <span className="text-[var(--text-muted)]">→</span> : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p
          role="alert"
          className="rounded-[10px] border border-[var(--critical)] bg-[var(--critical-wash)] px-3 py-2 t-subhead text-[var(--critical)]"
        >
          {error}
        </p>
      ) : null}

      {step === "upload" ? (
        <div className="flex flex-col gap-4">
          <div className="sm:max-w-[288px]">
            <label className={labelClass} htmlFor="import-account">
              Import into which account?
            </label>
            <SelectField
              id="import-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={`${fieldBase} w-full`}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </SelectField>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-6 py-10 text-center transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-wash)]">
            <span aria-hidden className="text-2xl opacity-60">
              ↧
            </span>
            <span className="t-subhead font-medium text-[var(--text-primary)]">
              Choose a CSV file
            </span>
            <span className="max-w-sm t-footnote text-[var(--text-secondary)]">
              Export one from your bank — most call it &ldquo;Download transactions&rdquo;. The file
              is read in your browser and never leaves your machine.
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 t-footnote text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <span aria-hidden className="transition-transform group-open:rotate-90">
                ›
              </span>
              or paste the CSV text directly
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={6}
                placeholder="Date,Description,Amount&#10;2026-09-14,Trader Joe's,-52.30"
                className={`${fieldClass} font-mono t-footnote`}
              />
              <button type="button" onClick={() => loadText(raw)} className={`${ghostButton} self-start`}>
                Read this text
              </button>
            </div>
          </details>
        </div>
      ) : null}

      {step === "map" ? (
        <div className="flex flex-col gap-4">
          <p className="t-subhead text-[var(--text-secondary)]">
            Ledgerly guessed these from your header row. Fix anything it got wrong — the first three
            rows of your file are shown underneath each column.
          </p>

          <div className="overflow-x-auto rounded-[10px] border border-[var(--border)]">
            <table className="w-full t-footnote">
              <thead>
                <tr className="bg-[var(--surface-2)]">
                  {rows[0].map((h, i) => (
                    <th key={i} scope="col" className="min-w-[150px] p-2 text-left align-top">
                      <span className="mb-1.5 block truncate font-medium text-[var(--text-primary)]">
                        {hasHeader ? h : `Column ${i + 1}`}
                      </span>
                      <SelectField
                        value={roles[i] ?? "ignore"}
                        aria-label={`Role for column ${i + 1}`}
                        onChange={(e) => {
                          const next = [...roles];
                          next[i] = e.target.value as ColumnRole;
                          setRoles(next);
                        }}
                        className="w-full rounded-[8px] border-0 bg-[var(--surface-2)] px-2 py-1.5 t-footnote text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </SelectField>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(hasHeader ? 1 : 0, hasHeader ? 4 : 3).map((r, ri) => (
                  <tr key={ri} className="border-t border-[var(--border)]">
                    {rows[0].map((_, ci) => (
                      <td key={ci} className="truncate p-2 text-[var(--text-secondary)]">
                        {r[ci] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--border)] rounded-[10px] bg-[var(--surface-2)] px-3">
            <div className="py-1.5">
              <Switch
                checked={hasHeader}
                onChange={setHasHeader}
                label="First row is a header"
              />
            </div>
            <div className="py-1.5">
              <Switch
                checked={flipSign}
                onChange={setFlipSign}
                label="Flip the sign"
                description="My bank writes purchases as positive numbers"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("upload")} className={ghostButton}>
              Back
            </button>
            <button type="button" onClick={toReview} disabled={busy} className={primaryButton}>
              {busy ? "Reading…" : "Preview import"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Rows ready" value={String(staged.length)} />
            <Stat label="Auto-categorized" value={`${matched} of ${staged.length}`} />
            <Stat label="Money out" value={formatMoney(outflow, { showCents: false })} />
            <Stat label="Money in" value={formatMoney(inflow, { showCents: false })} />
          </div>

          <p className="t-subhead text-[var(--text-secondary)]">
            Nothing has been saved yet. Rows identical to ones already in this account are skipped
            automatically, so re-importing an overlapping statement is safe.
          </p>

          <div className="max-h-[400px] overflow-auto rounded-[10px] border border-[var(--border)]">
            <table className="w-full t-footnote">
              <thead className="sticky top-0 bg-[var(--surface-2)]">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Date</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Merchant</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Category</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {staged.slice(0, 250).map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="tnum px-3 py-1.5 text-[var(--text-secondary)]">{formatDate(r.date)}</td>
                    <td className="max-w-[180px] truncate px-3 py-1.5 text-[var(--text-primary)]">{r.merchant}</td>
                    <td className="px-3 py-1.5">
                      {r.categoryName ? (
                        <span className="text-[var(--text-secondary)]">{r.categoryName}</span>
                      ) : (
                        <span className="text-[var(--warning)]">Uncategorized</span>
                      )}
                    </td>
                    <td
                      className="tnum px-3 py-1.5 text-right"
                      style={{ color: r.amountCents > 0 ? "var(--good)" : "var(--text-primary)" }}
                    >
                      {formatMoney(r.amountCents, { signed: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {staged.length > 250 ? (
            <p className="t-footnote text-[var(--text-muted)]">
              Showing the first 250 rows. All {staged.length} will be imported.
            </p>
          ) : null}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("map")} className={ghostButton}>
              Back
            </button>
            <button type="button" onClick={commit} disabled={busy} className={primaryButton}>
              {busy ? "Importing…" : `Import ${staged.length} ${staged.length === 1 ? "transaction" : "transactions"}`}
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" && result ? (
        <div className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-[var(--good)] bg-[var(--good-wash)] p-5">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            Imported {result.inserted} {result.inserted === 1 ? "transaction" : "transactions"}
          </h2>
          <p className="t-subhead text-[var(--text-secondary)]">
            {result.duplicates > 0
              ? `${result.duplicates} ${result.duplicates === 1 ? "row was" : "rows were"} already in this account and ${result.duplicates === 1 ? "was" : "were"} skipped.`
              : "No duplicates found."}{" "}
            Anything Ledgerly couldn&rsquo;t categorize is waiting under &ldquo;Needs a
            category&rdquo; on the Transactions page.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/transactions?uncategorized=1" className={primaryButton}>
              Categorize the rest
            </a>
            <a href="/budget" className={ghostButton}>
              Build a budget from this
            </a>
            <button
              type="button"
              className={ghostButton}
              onClick={() => {
                setStep("upload");
                setRows([]);
                setStaged([]);
                setResult(null);
                setRaw("");
              }}
            >
              Import another file
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
      <p className="t-footnote text-[var(--text-secondary)]">{label}</p>
      <p className="figure mt-0.5 text-[18px] font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
