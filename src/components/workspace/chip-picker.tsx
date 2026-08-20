import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

// Tap-only multi-select: preset chips toggle on/off, plus an optional small
// text field for the rare case not covered by the presets — so entry stays
// tap-first without forcing free typing for the common cases.
export function ChipPicker({
  options,
  value,
  onChange,
  allowCustom = true,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const extra = value.filter((v) => !options.includes(v));

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setCustom("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-colors",
            value.includes(option)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
      {extra.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className="rounded-full border border-primary bg-primary px-3 py-1.5 text-xs text-primary-foreground"
        >
          {option} ✕
        </button>
      ))}
      {allowCustom && (
        <div className="flex items-center gap-1">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Other…"
            className="h-7 w-24 rounded-full border border-input bg-transparent px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={addCustom}
            aria-label="Add"
            className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
