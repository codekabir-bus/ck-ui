"use client";

import * as React from "react";
import type { DayPickerLocale, Matcher } from "react-day-picker";
import { RiCalendarLine, RiCloseLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import * as Calendar from "./Calendar";
import { useFieldControlProps } from "./Field";
import * as Popover from "./Popover";

/*
 * A trigger that shows the chosen date and opens a Calendar in a popover. Like Combobox, the trigger is a
 * role="combobox" with aria-haspopup="dialog": its name comes from the label and its value is the shown date.
 * Formatting uses Intl.DateTimeFormat with `lang` (default: the calendar locale's code, else "en-US"),
 * so server and browser render the same text.
 * Native forms: with `name`, the date is submitted as YYYY-MM-DD; `required` blocks submission while empty.
 */

export type DatePickerSize = "sm" | "md" | "lg";

const triggerSizes: Record<DatePickerSize, string> = {
    sm: "h-8 px-2.5",
    md: "h-9 px-3",
    lg: "h-10 px-3",
};

/** Local calendar date as YYYY-MM-DD (no time zone shift). */
export function toISODate(date: Date) {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface DatePickerRootProps {
    /** Selected date (controlled). `null` means no date. */
    value?: Date | null;
    defaultValue?: Date | null;
    onValueChange?: (date: Date | null) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    placeholder?: string;
    min?: Date;
    max?: Date;
    /** Extra dates that cannot be picked (react-day-picker matchers). */
    disabledDates?: Matcher | Matcher[];
    /** Calendar locale (labels, week start). Import from "react-day-picker/locale". */
    locale?: Partial<DayPickerLocale>;
    /** BCP 47 tag for the trigger text. Defaults to the locale's code, then "en-US". */
    lang?: string;
    /** Intl.DateTimeFormat options for the trigger text. */
    formatOptions?: Intl.DateTimeFormatOptions;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    clearable?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    form?: string;
    size?: DatePickerSize;
    id?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    className?: string;
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange: ((value: T) => void) | undefined) {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const isControlled = value !== undefined;
    const setValue = React.useCallback(
        (next: T) => {
            if (!isControlled) setUncontrolled(next);
            onChange?.(next);
        },
        [isControlled, onChange]
    );
    return [isControlled ? (value as T) : uncontrolled, setValue] as const;
}

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

const Root = React.forwardRef<HTMLButtonElement, DatePickerRootProps>(
    (
        {
            value: valueProp,
            defaultValue = null,
            onValueChange,
            open: openProp,
            defaultOpen = false,
            onOpenChange,
            placeholder = "Pick a date",
            min,
            max,
            disabledDates,
            locale,
            lang,
            formatOptions = DEFAULT_FORMAT,
            weekStartsOn,
            clearable = false,
            clearLabel = "Clear date",
            disabled,
            invalid,
            required,
            name,
            form,
            size = "md",
            id,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
            className,
        },
        forwardedRef
    ) => {
        const [value, setValue] = useControllable<Date | null>(valueProp, defaultValue, onValueChange);
        const [open, setOpen] = useControllable<boolean>(openProp, defaultOpen, onOpenChange);
        const [missingRequired, setMissingRequired] = React.useState(false);
        const triggerRef = React.useRef<HTMLButtonElement | null>(null);
        const contentRef = React.useRef<HTMLDivElement | null>(null);
        const contentId = `${React.useId()}-calendar-dialog`;

        const controlProps = useFieldControlProps({ id, "aria-describedby": ariaDescribedBy, disabled, required }, { invalid: invalid || (missingRequired && !value) });
        const isInvalid = Boolean(controlProps["aria-invalid"]);
        const isDisabled = Boolean(controlProps.disabled);
        const isRequired = Boolean(controlProps.required);

        const formatted = React.useMemo(() => {
            if (!value) return null;
            try {
                return new Intl.DateTimeFormat(lang ?? locale?.code ?? "en-US", formatOptions).format(value);
            } catch {
                return toISODate(value);
            }
        }, [value, lang, locale, formatOptions]);


        const setTriggerRef = React.useCallback(
            (node: HTMLButtonElement | null) => {
                triggerRef.current = node;
                if (typeof forwardedRef === "function") forwardedRef(node);
                else if (forwardedRef) forwardedRef.current = node;
            },
            [forwardedRef]
        );

        const handleOpenChange = (next: boolean) => {
            if (isDisabled && next) return;
            setOpen(next);
        };

        const showClear = clearable && value !== null && !isDisabled;

        return (
            <div className={cn("relative w-full", className)}>
                <Popover.Root open={open} onOpenChange={handleOpenChange}>
                    <Popover.Trigger asChild>
                        <button
                            ref={setTriggerRef}
                            type="button"
                            role="combobox"
                            aria-haspopup="dialog"
                            aria-expanded={open}
                            aria-controls={open ? contentId : undefined}
                            id={controlProps.id}
                            aria-label={ariaLabel}
                            aria-labelledby={ariaLabelledBy}
                            aria-describedby={controlProps["aria-describedby"]}
                            aria-invalid={isInvalid || undefined}
                            aria-required={isRequired || undefined}
                            disabled={isDisabled}
                            data-placeholder={value ? undefined : ""}
                            className={cn(
                                "flex w-full items-center gap-2 rounded-lg border bg-transparent text-left size-p-sm text-foreground transition duration-base ease-standard field-focus",
                                triggerSizes[size],
                                showClear && "pr-10",
                                isInvalid
                                    ? "border-destructive outline-destructive/25 hover:bg-destructive-subtle"
                                    : "border-input outline-accent hover:bg-muted data-[state=open]:border-foreground focus:border-foreground",
                                "data-[placeholder]:text-muted-foreground",
                                "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground"
                            )}
                        >
                            <RiCalendarLine aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                                {formatted ?? placeholder}
                            </span>
                        </button>
                    </Popover.Trigger>
                    <Popover.Content
                        ref={contentRef}
                        id={contentId}
                        unstyled
                        showArrow={false}
                        position="bottom-left"
                        sideOffset={6}
                        animation="slide"
                        collisionPadding={8}
                        onOpenAutoFocus={(event) => {
                            // Start on the selected date (or today): the grid's single tab stop.
                            const day = contentRef.current?.querySelector<HTMLElement>("td button[tabindex='0']");
                            if (day) {
                                event.preventDefault();
                                day.focus();
                            }
                        }}
                        className="rounded-2xl border border-border bg-surface text-surface-foreground shadow-medium"
                    >
                        <Calendar.Root
                            selected={value ?? undefined}
                            defaultMonth={value ?? undefined}
                            onSelect={(date) => {
                                setValue(date ?? null);
                                setMissingRequired(false);
                                handleOpenChange(false);
                            }}
                            min={min}
                            max={max}
                            disabled={disabledDates}
                            locale={locale}
                            weekStartsOn={weekStartsOn}
                        />
                    </Popover.Content>
                </Popover.Root>

                {showClear && (
                    <button
                        type="button"
                        aria-label={clearLabel}
                        onClick={() => {
                            setValue(null);
                            triggerRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring"
                    >
                        <RiCloseLine aria-hidden="true" className="size-4" />
                    </button>
                )}

                {(name || isRequired) && (
                    <input
                        tabIndex={-1}
                        aria-hidden="true"
                        name={name}
                        form={form}
                        value={value ? toISODate(value) : ""}
                        required={isRequired}
                        disabled={isDisabled}
                        onChange={() => {}}
                        onInvalid={(event) => {
                            event.preventDefault();
                            setMissingRequired(true);
                            triggerRef.current?.focus();
                        }}
                        className="pointer-events-none absolute bottom-0 left-0 size-px opacity-0"
                    />
                )}
            </div>
        );
    }
);
Root.displayName = "DatePicker.Root";

export { Root };
