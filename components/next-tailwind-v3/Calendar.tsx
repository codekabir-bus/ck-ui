"use client";

import { DayPicker, type ChevronProps, type Matcher, type PropsBase, type PropsSingle } from "react-day-picker";
import { RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightSLine, RiArrowUpSLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/*
 * A month calendar for picking one date, built on react-day-picker (which also does the date arithmetic):
 *   role="grid" with labelled day buttons ("Monday, June 1st, 2026, selected"), one tab stop (roving focus),
 *   arrows move by day/week, PageUp/PageDown by month, Shift+PageUp/PageDown by year, Home/End to week start/end.
 *   The month caption is a polite live region, so month changes are announced.
 * `min` / `max` disable dates outside the range and stop navigation past them.
 * Locale: pass a react-day-picker locale (`import { fr } from "react-day-picker/locale"`); the default is en-US.
 */

export type CalendarProps = Omit<PropsBase, "disabled" | "mode" | "required"> &
    Omit<PropsSingle, "mode"> & {
        /** Earliest selectable date. */
        min?: Date;
        /** Latest selectable date. */
        max?: Date;
        /** Dates that cannot be selected (react-day-picker matchers: dates, ranges, `{ dayOfWeek }`, functions). */
        disabled?: Matcher | Matcher[];
    };

function CalendarChevron({ orientation, className }: ChevronProps) {
    const Icon = orientation === "left" ? RiArrowLeftSLine : orientation === "right" ? RiArrowRightSLine : orientation === "up" ? RiArrowUpSLine : RiArrowDownSLine;
    return <Icon aria-hidden="true" className={cn("size-5", className)} />;
}

const toArray = <T,>(value: T | T[] | undefined): T[] => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

const dayCell = [
    "size-9 p-0 text-center",
    "[&[data-outside]>button]:text-muted-foreground",
    "[&[data-today]>button]:font-semibold [&[data-today]>button]:ring-1 [&[data-today]>button]:ring-inset [&[data-today]>button]:ring-foreground/25",
    "[&[data-selected]>button]:bg-primary [&[data-selected]>button]:text-primary-foreground [&[data-selected]>button]:ring-0 [&[data-selected]>button:hover]:bg-primary-hover",
    "[&[data-disabled]>button]:cursor-not-allowed [&[data-disabled]>button]:text-muted-foreground [&[data-disabled]>button]:line-through [&[data-disabled]>button]:opacity-50 [&[data-disabled]>button:hover]:bg-transparent",
].join(" ");

/** Pass `selected` + `onSelect` (controlled) or let it manage its own selection. */
function Root({ className, classNames, components, showOutsideDays = true, min, max, disabled, startMonth, endMonth, ...props }: CalendarProps) {
    const disabledMatchers = [...toArray(disabled), ...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])];

    return (
        <DayPicker
            mode="single"
            showOutsideDays={showOutsideDays}
            startMonth={startMonth ?? min}
            endMonth={endMonth ?? max}
            disabled={disabledMatchers.length ? disabledMatchers : undefined}
            className={cn("relative w-fit p-3", className)}
            classNames={{
                months: "relative flex flex-col gap-4 sm:flex-row",
                month: "flex w-full flex-col gap-3",
                nav: "absolute inset-x-3 top-3 z-[1] flex items-center justify-between",
                button_previous:
                    "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring aria-disabled:pointer-events-none aria-disabled:opacity-40",
                button_next:
                    "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring aria-disabled:pointer-events-none aria-disabled:opacity-40",
                month_caption: "flex h-8 items-center justify-center px-10",
                caption_label: "size-label-sm text-foreground",
                month_grid: "w-full border-collapse",
                weekdays: "",
                weekday: "size-9 pb-1 text-center font-normal size-p-xs text-muted-foreground",
                weeks: "",
                week: "",
                day: dayCell,
                day_button:
                    "inline-flex size-9 items-center justify-center rounded-lg size-p-sm text-foreground transition-colors duration-fast hover:bg-muted focus-ring",
                footer: "mt-3 size-p-xs text-muted-foreground",
                hidden: "invisible",
                outside: "",
                today: "",
                selected: "",
                disabled: "",
                focused: "",
                ...classNames,
            }}
            components={{ Chevron: CalendarChevron, ...components }}
            {...props}
        />
    );
}
Root.displayName = "Calendar.Root";

export { Root };
