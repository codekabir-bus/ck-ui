"use client";

import * as React from "react";
import { RiArrowDownSLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import * as Command from "./Command";
import { useFieldControlProps } from "./Field";
import * as Popover from "./Popover";

/*
 * Single-select combobox: a trigger (role="combobox", aria-haspopup="dialog") opens a popover with a
 * searchable Command list. The trigger's text is the selected label, so assistive technology reads the value.
 * Keyboard: Enter/Space/ArrowDown open; typing a character opens with that search; arrows + Enter pick an option;
 * Escape closes and returns focus to the trigger.
 * Native forms: with `name`, the value is submitted; `required` blocks submission while empty.
 */

export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    /** Extra search terms (e.g. a country code). */
    keywords?: string[];
}

export type ComboboxSize = "sm" | "md" | "lg";

const triggerSizes: Record<ComboboxSize, string> = {
    sm: "h-8 pl-2.5 pr-2",
    md: "h-9 pl-3 pr-2",
    lg: "h-10 pl-3 pr-2.5",
};

export interface ComboboxRootProps {
    options: ComboboxOption[];
    /** Selected value (controlled). `null` means nothing selected. */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    /** Accessible name of the search box inside the popup. */
    searchLabel?: string;
    emptyMessage?: React.ReactNode;
    /** Show a button that clears the selection. */
    clearable?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Submitted with native forms. */
    name?: string;
    form?: string;
    size?: ComboboxSize;
    id?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
    /** Classes for the outer wrapper (width, margins). */
    className?: string;
    /** Classes for the popup panel. */
    contentClassName?: string;
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

const Root = React.forwardRef<HTMLButtonElement, ComboboxRootProps>(
    (
        {
            options,
            value: valueProp,
            defaultValue = null,
            onValueChange,
            open: openProp,
            defaultOpen = false,
            onOpenChange,
            placeholder = "Select an option",
            searchPlaceholder = "Search…",
            searchLabel = "Search options",
            emptyMessage = "No results found.",
            clearable = false,
            clearLabel = "Clear selection",
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
            contentClassName,
        },
        forwardedRef
    ) => {
        const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onValueChange);
        const [open, setOpen] = useControllable<boolean>(openProp, defaultOpen, onOpenChange);
        const [search, setSearch] = React.useState("");
        const [missingRequired, setMissingRequired] = React.useState(false);
        const triggerRef = React.useRef<HTMLButtonElement | null>(null);
        const contentId = `${React.useId()}-listbox-dialog`;

        const controlProps = useFieldControlProps({ id, "aria-describedby": ariaDescribedBy, disabled, required }, { invalid: invalid || (missingRequired && !value) });
        const isInvalid = Boolean(controlProps["aria-invalid"]);
        const isDisabled = Boolean(controlProps.disabled);
        const isRequired = Boolean(controlProps.required);
        const selected = options.find((option) => option.value === value) ?? null;

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
            if (!next) setSearch("");
        };

        const select = (next: string) => {
            setValue(next);
            setMissingRequired(false);
            handleOpenChange(false);
        };

        const clear = () => {
            setValue(null);
            triggerRef.current?.focus();
        };

        const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (open || isDisabled) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                handleOpenChange(true);
            } else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
                // Type-to-search: open with the typed character already in the search box.
                event.preventDefault();
                setSearch(event.key);
                handleOpenChange(true);
            }
        };

        const showClear = clearable && selected !== null && !isDisabled;

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
                            data-placeholder={selected ? undefined : ""}
                            onKeyDown={onTriggerKeyDown}
                            className={cn(
                                "group flex w-full items-center justify-between gap-2 rounded-lg border bg-transparent text-left size-p-sm text-foreground transition duration-base ease-standard field-focus",
                                triggerSizes[size],
                                showClear && "pr-14",
                                isInvalid
                                    ? "border-destructive outline-destructive/25 hover:bg-destructive-subtle"
                                    : "border-input outline-accent hover:bg-muted data-[state=open]:border-foreground focus:border-foreground",
                                "data-[placeholder]:text-muted-foreground",
                                "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground"
                            )}
                        >
                            <span className="truncate">{selected ? selected.label : placeholder}</span>
                            <RiArrowDownSLine
                                aria-hidden="true"
                                className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-base group-data-[state=open]:rotate-180"
                            />
                        </button>
                    </Popover.Trigger>
                    <Popover.Content
                        id={contentId}
                        unstyled
                        showArrow={false}
                        position="bottom-left"
                        sideOffset={6}
                        animation="slide"
                        className={cn(
                            "w-[var(--radix-popover-trigger-width)] min-w-48 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface text-surface-foreground shadow-medium",
                            contentClassName
                        )}
                    >
                        <Command.Root label={searchLabel} defaultValue={value ?? undefined} loop>
                            <Command.Input placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
                            <Command.List className="max-h-64">
                                <Command.Empty>{emptyMessage}</Command.Empty>
                                {options.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <Command.Item
                                            key={option.value}
                                            value={option.value}
                                            keywords={[option.label, ...(option.keywords ?? [])]}
                                            disabled={option.disabled}
                                            data-checked={isSelected || undefined}
                                            onSelect={() => select(option.value)}
                                            className="pr-8"
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {isSelected && (
                                                <>
                                                    <span className="sr-only">, selected</span>
                                                    <RiCheckLine aria-hidden="true" className="absolute right-2 text-foreground" />
                                                </>
                                            )}
                                        </Command.Item>
                                    );
                                })}
                            </Command.List>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>

                {showClear && (
                    <button
                        type="button"
                        aria-label={clearLabel}
                        onClick={clear}
                        className="absolute right-8 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring"
                    >
                        <RiCloseLine aria-hidden="true" className="size-4" />
                    </button>
                )}

                {(name || isRequired) && (
                    // Carries the value for native forms and blocks submission while a required value is missing.
                    <input
                        tabIndex={-1}
                        aria-hidden="true"
                        name={name}
                        form={form}
                        value={value ?? ""}
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
Root.displayName = "Combobox.Root";

export { Root };
