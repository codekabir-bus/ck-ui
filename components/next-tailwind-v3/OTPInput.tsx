"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import { useFieldControlProps } from "./Field";

/*
 * One-time code input. There is exactly ONE real <input> (autocomplete="one-time-code"), laid over a row of
 * visual slots that are hidden from assistive technology. Screen readers, SMS autofill, password managers,
 * paste and deletion all work with that single field; the slots only draw its value and caret.
 *   - Typing fills the next slot; on a filled slot the character is replaced.
 *   - Pasting a full code replaces the value; separators like spaces or dashes are dropped.
 *   - Backspace deletes, ArrowLeft/ArrowRight/Home/End move between slots.
 */

export type OTPInputMode = "numeric" | "alphanumeric";
export type OTPInputSize = "sm" | "md" | "lg";

export interface OTPInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size" | "maxLength" | "type" | "pattern"> {
    /** Number of characters. @default 6 */
    length?: number;
    /** Allowed characters. @default "numeric" */
    mode?: OTPInputMode;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Called when the last slot is filled. */
    onComplete?: (value: string) => void;
    /** Draw a separator after every N slots (purely visual), e.g. 3 → "123 – 456". */
    groupSize?: number;
    size?: OTPInputSize;
    invalid?: boolean;
    /** Classes for the outer wrapper. */
    className?: string;
}

const slotSizes: Record<OTPInputSize, string> = {
    sm: "h-8 w-7 size-p-sm",
    md: "h-10 w-9 size-p-md",
    lg: "h-12 w-11 size-p-lg",
};

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function sanitizeOTP(text: string, mode: OTPInputMode) {
    return mode === "numeric" ? text.replace(/\D/g, "") : text.replace(/[^A-Za-z0-9]/g, "");
}

const OTPInput = React.forwardRef<HTMLInputElement, OTPInputProps>(
    (
        {
            length = 6,
            mode = "numeric",
            value: valueProp,
            defaultValue = "",
            onValueChange,
            onComplete,
            groupSize,
            size = "md",
            invalid,
            disabled,
            className,
            id,
            "aria-describedby": ariaDescribedBy,
            onFocus,
            onBlur,
            onKeyDown,
            onPaste,
            ...props
        },
        forwardedRef
    ) => {
        const [uncontrolled, setUncontrolled] = React.useState(() => sanitizeOTP(defaultValue, mode).slice(0, length));
        const isControlled = valueProp !== undefined;
        const value = isControlled ? sanitizeOTP(valueProp, mode).slice(0, length) : uncontrolled;
        const [focused, setFocused] = React.useState(false);
        const [selection, setSelection] = React.useState<[number, number]>([value.length, value.length]);
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        const slotsRef = React.useRef<HTMLDivElement | null>(null);
        const pendingSelection = React.useRef<[number, number] | null>(null);
        // Deferred caret placement after focus/click is cancelled as soon as the user types, pastes or presses a key.
        const placementToken = React.useRef(0);
        const placeLater = (index: () => number) => {
            const token = ++placementToken.current;
            requestAnimationFrame(() => {
                if (token === placementToken.current) select(index());
            });
        };
        const cancelPlacement = () => {
            placementToken.current += 1;
        };

        const controlProps = useFieldControlProps({ id, "aria-describedby": ariaDescribedBy, disabled, required: props.required }, { invalid });
        const isInvalid = Boolean(controlProps["aria-invalid"]);
        const isDisabled = Boolean(controlProps.disabled);

        const setRefs = (node: HTMLInputElement | null) => {
            inputRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
        };

        /** Caret at `index`; on a filled slot the character is selected so the next key replaces it. */
        const select = React.useCallback(
            (index: number, current = value) => {
                const position = Math.max(0, Math.min(index, current.length, length));
                const range: [number, number] = position < current.length ? [position, position + 1] : [position, position];
                const input = inputRef.current;
                if (input && document.activeElement === input) input.setSelectionRange(range[0], range[1]);
                setSelection(range);
            },
            [value, length]
        );

        // Apply a caret position after React has written a new value into the input.
        useIsomorphicLayoutEffect(() => {
            const pending = pendingSelection.current;
            const input = inputRef.current;
            if (!pending || !input) return;
            pendingSelection.current = null;
            if (document.activeElement === input) input.setSelectionRange(pending[0], pending[1]);
            setSelection(pending);
        });

        const update = (next: string, caret: number) => {
            if (!isControlled) setUncontrolled(next);
            if (next !== value) {
                onValueChange?.(next);
                if (next.length === length && value.length !== length) onComplete?.(next);
            }
            const position = Math.min(caret, length);
            pendingSelection.current = position < next.length ? [position, position + 1] : [position, position];
        };

        const syncSelection = () => {
            const input = inputRef.current;
            if (!input) return;
            setSelection([input.selectionStart ?? value.length, input.selectionEnd ?? value.length]);
        };

        const activeIndex = Math.min(selection[0], length - 1);
        const slotIndexAt = (clientX: number) => {
            const slots = Array.from(slotsRef.current?.querySelectorAll<HTMLElement>("[data-slot]") ?? []);
            const hit = slots.findIndex((slot) => {
                const rect = slot.getBoundingClientRect();
                return clientX >= rect.left && clientX <= rect.right;
            });
            return hit === -1 ? value.length : hit;
        };

        return (
            <div className={cn("relative inline-flex w-fit", isDisabled && "cursor-not-allowed opacity-50", className)} data-invalid={isInvalid || undefined}>
                <input
                    ref={setRefs}
                    type="text"
                    id={controlProps.id}
                    inputMode={mode === "numeric" ? "numeric" : "text"}
                    pattern={mode === "numeric" ? "[0-9]*" : "[A-Za-z0-9]*"}
                    autoComplete="one-time-code"
                    autoCapitalize={mode === "numeric" ? "off" : "characters"}
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={length}
                    value={value}
                    disabled={isDisabled}
                    required={controlProps.required}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={controlProps["aria-describedby"]}
                    onChange={(event) => {
                        cancelPlacement();
                        const input = event.target;
                        const next = sanitizeOTP(input.value, mode).slice(0, length);
                        // Caret after the change = allowed characters typed before it.
                        const caret = sanitizeOTP(input.value.slice(0, input.selectionStart ?? input.value.length), mode).length;
                        update(next, caret);
                    }}
                    onPaste={(event) => {
                        cancelPlacement();
                        onPaste?.(event);
                        if (event.defaultPrevented) return;
                        event.preventDefault();
                        const pasted = sanitizeOTP(event.clipboardData.getData("text"), mode);
                        if (!pasted) return;
                        const [start, end] = selection;
                        // A full code replaces everything; a partial one is inserted at the caret.
                        const next = pasted.length >= length ? pasted.slice(0, length) : (value.slice(0, start) + pasted + value.slice(end)).slice(0, length);
                        update(next, pasted.length >= length ? length : start + pasted.length);
                    }}
                    onKeyDown={(event) => {
                        cancelPlacement();
                        onKeyDown?.(event);
                        if (event.defaultPrevented) return;
                        const moves: Record<string, number> = {
                            ArrowLeft: activeIndex - 1,
                            ArrowRight: selection[0] < value.length ? selection[0] + 1 : selection[0],
                            Home: 0,
                            End: value.length,
                        };
                        if (event.key in moves) {
                            event.preventDefault();
                            select(moves[event.key]);
                        }
                    }}
                    onFocus={(event) => {
                        onFocus?.(event);
                        setFocused(true);
                        // Start on the first empty slot (or the last one when the code is complete).
                        placeLater(() => (value.length >= length ? length - 1 : value.length));
                    }}
                    onBlur={(event) => {
                        onBlur?.(event);
                        setFocused(false);
                    }}
                    onSelect={syncSelection}
                    onPointerUp={(event) => {
                        if (isDisabled) return;
                        const index = slotIndexAt(event.clientX);
                        placeLater(() => index);
                    }}
                    className={cn(
                        "absolute inset-0 z-10 h-full w-full cursor-text appearance-none border-0 bg-transparent p-0 text-base text-transparent caret-transparent",
                        "outline-none selection:bg-transparent focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
                    )}
                    {...props}
                />
                <div ref={slotsRef} aria-hidden="true" className="flex items-center gap-2">
                    {Array.from({ length }, (_, index) => {
                        const char = value[index] ?? "";
                        const isActive = focused && index === activeIndex;
                        return (
                            <React.Fragment key={index}>
                                <div
                                    data-slot=""
                                    data-active={isActive || undefined}
                                    data-filled={char ? "" : undefined}
                                    className={cn(
                                        "relative flex items-center justify-center rounded-lg border font-medium tabular-nums text-foreground shadow-x-small transition-[border-color,box-shadow] duration-fast ease-standard",
                                        slotSizes[size],
                                        // The active slot gets the field focus treatment: a strong border (destructive stays) plus a soft halo.
                                        "outline outline-0 outline-offset-2 data-[active]:outline-2",
                                        isInvalid ? "border-destructive outline-destructive/25" : "border-input outline-accent data-[active]:border-foreground"
                                    )}
                                >
                                    {char}
                                    {isActive && !char && <span className="h-4 w-px animate-pulse bg-foreground motion-reduce:animate-none" />}
                                </div>
                                {groupSize && (index + 1) % groupSize === 0 && index < length - 1 && <span className="text-muted-foreground">–</span>}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    }
);
OTPInput.displayName = "OTPInput.Root";

export { OTPInput as Root };
