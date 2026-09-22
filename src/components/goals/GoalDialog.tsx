"use client";

import { useState } from "react";
import { Dialog, fieldClass, ghostButton, labelClass, primaryButton } from "@/components/ui/Dialog";
import { deleteGoal, saveGoal } from "@/server/actions";
import type { Goal } from "@/lib/types";

export function GoalDialog({
  goal,
  trigger,
}: {
  goal?: Goal;
  trigger: { label: string; className: string };
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(goal);

  return (
    <>
      <button type="button" className={trigger.className} onClick={() => setOpen(true)}>
        {trigger.label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit goal" : "New goal"}>
        <form action={saveGoal} onSubmit={() => setOpen(false)} className="flex flex-col gap-3.5">
          {goal ? <input type="hidden" name="id" value={goal.id} /> : null}

          <div>
            <label className={labelClass} htmlFor="goal-name">
              What are you saving for?
            </label>
            <input
              id="goal-name"
              name="name"
              required
              defaultValue={goal?.name}
              placeholder="Emergency fund"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="goal-target">
                Target amount
              </label>
              <input
                id="goal-target"
                name="target"
                required
                inputMode="decimal"
                defaultValue={goal ? (goal.targetCents / 100).toFixed(2) : ""}
                placeholder="5000"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="goal-saved">
                Already saved
              </label>
              <input
                id="goal-saved"
                name="saved"
                inputMode="decimal"
                defaultValue={goal ? (goal.savedCents / 100).toFixed(2) : "0"}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="goal-kind">
                Type
              </label>
              <select id="goal-kind" name="kind" defaultValue={goal?.kind ?? "savings"} className={fieldClass}>
                <option value="savings">Savings goal</option>
                <option value="emergency">Emergency fund</option>
                <option value="debt">Pay off debt</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="goal-date">
                Target date{" "}
                <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <input
                id="goal-date"
                name="targetDate"
                type="date"
                defaultValue={goal?.targetDate ?? ""}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="goal-note">
              Note <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <input id="goal-note" name="note" defaultValue={goal?.note} className={fieldClass} />
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            {editing ? (
              <button
                type="submit"
                formAction={deleteGoal}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] text-[var(--critical)] transition-colors hover:bg-[var(--critical-wash)]"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className={ghostButton}>
                Cancel
              </button>
              <button type="submit" className={primaryButton}>
                {editing ? "Save changes" : "Create goal"}
              </button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
