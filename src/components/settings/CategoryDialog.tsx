"use client";

import { useState } from "react";
import { Dialog, fieldClass, labelClass, sheetDestructive, sheetPrimary } from "@/components/ui/Dialog";
import { deleteCategory, saveCategory } from "@/server/actions";
import { SERIES_HEX, SERIES_NAMES, SERIES_SLOTS } from "@/lib/palette";
import type { Category, CategoryGroup } from "@/lib/types";
import { SelectField } from "@/components/ui/Controls";

export function CategoryDialog({
  category,
  groups,
  defaultGroupId,
  trigger,
}: {
  category?: Category;
  groups: CategoryGroup[];
  defaultGroupId?: string;
  trigger: { label: string; className: string };
}) {
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(category?.colorSlot ?? 1);
  const editing = Boolean(category);

  return (
    <>
      <button type="button" className={trigger.className} onClick={() => setOpen(true)}>
        {trigger.label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit category" : "New category"}>
        <form action={saveCategory} onSubmit={() => setOpen(false)} className="flex flex-col gap-3.5">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          <input type="hidden" name="colorSlot" value={slot} />

          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
            <div>
              <label className={labelClass} htmlFor="cat-icon">
                Icon
              </label>
              <input
                id="cat-icon"
                name="icon"
                maxLength={4}
                defaultValue={category?.icon ?? "•"}
                className={`${fieldClass} text-center`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cat-name">
                Name
              </label>
              <input
                id="cat-name"
                name="name"
                required
                defaultValue={category?.name}
                placeholder="Groceries"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="cat-group">
              Group
            </label>
            <SelectField
              id="cat-group"
              name="groupId"
              defaultValue={category?.groupId ?? defaultGroupId ?? groups[0]?.id}
              className={fieldClass}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <span className={labelClass}>Chart color</span>
            <div className="flex flex-wrap gap-1.5">
              {SERIES_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  aria-label={SERIES_NAMES[s]}
                  aria-pressed={slot === s}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    slot === s ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--surface-1)]" : ""
                  }`}
                  style={{ background: SERIES_HEX[s] }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
              Colors are fixed slots from a colorblind-tested palette, so a category keeps the same
              hue in every chart.
            </p>
          </div>

          {/* Apple stacks sheet actions full-width at the bottom; the ✕ in the
              header is the cancel affordance, so there is no Cancel button. */}
          <div className="mt-2 flex flex-col gap-2">
            <button type="submit" className={sheetPrimary}>
              {editing ? "Save" : "Create"}
            </button>
            {editing ? (
              <button
                type="submit"
                formAction={deleteCategory}
                onClick={() => setOpen(false)}
                className={sheetDestructive}
              >
                Delete category
              </button>
            ) : null}
          </div>
        </form>
      </Dialog>
    </>
  );
}
