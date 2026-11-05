"use client";

import * as React from "react";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import { useField } from "./Field";
import * as Input from "./Input";

/*
 * A numeric field with spinbutton semantics (role="spinbutton", aria-valuenow/min/max), built on Input.
 * Typing is never blocked: "", "-", "1." are allowed while editing; the value is clamped to min/max and
 * normalised when the field is left or Enter is pressed. Keyboard: ArrowUp/Down by `step`, PageUp/PageDown by
 * `largeStep`, Home/End to min/max (when set). The − / + buttons are for pointer users (not tab stops).
 * Plain, locale-independent numbers ("1234.5"); no grouping separators are parsed.
 */

export interface NumberInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "size" | "min" | "max" | "step"> {
    value?: number | null;
    defaultValue?: number | null;
    onValueChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    /** Arrow-key and button increment. @default 1 */
    step?: number;
    /** PageUp/PageDown increment. @default step × 10 */
    largeStep?: number;
    size?: "sm" | "md" | "lg";
    invalid?: boolean;
    decrementLabel?: string;
    incrementLabel?: string;
    /** Classes for the outer Input.Root. */
    className?: string;
    inputClassName?: string;
}

const decimals = (value: number) => {
    const text = String(value);
    if (text.includes("e-")) return Number(text.split("e-")[1]);
    return text.includes(".") ? text.split(".")[1].length : 0;
};

const clamp = (value: number, min?: number, max?: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));

/** Parses plain numbers only; returns undefined for partial input ("-", ".", "1e"). */
export function parseNumber(text: string): number | null | undefined {
    const trimmed = text.trim();
    if (trimmed === "") return null;
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    (
        {
            value: valueProp,
            defaultValue = null,
            onValueChange,
            min,
            max,
            step = 1,
            largeStep,
            size = "md",
            invalid,
            disabled,
            readOnly,
            decrementLabel = "Decrease",
            incrementLabel = "Increase",
            className,
            inputClassName,
            id,
            onBlur,
            onKeyDown,
            ...props
        },
        ref
    ) => {
        const field = useField();
        const generatedId = React.useId();
        const inputId = id ?? field?.controlId ?? `number-${generatedId}`;
        const [uncontrolled, setUncontrolled] = React.useState<number | null>(defaultValue);
        const isControlled = valueProp !== undefined;
        const value = isControlled ? valueProp : uncontrolled;
        const [text, setText] = React.useState(value === null ? "" : String(value));
        const textRef = React.useRef(text);
        textRef.current = text;
        const editingRef = React.useRef(false);
        const isDisabled = Boolean(disabled ?? field?.disabled);
        const interactive = !isDisabled && !readOnly;

        // Follow external value changes unless the user is mid-edit with an equivalent value ("1." vs 1).
        React.useEffect(() => {
            if (editingRef.current && parseNumber(textRef.current) === value) return;
            setText(value === null ? "" : String(value));
        }, [value]);

        const setValue = (next: number | null) => {
            if (!isControlled) setUncontrolled(next);
            if (next !== value) onValueChange?.(next);
        };

        const precision = (base: number) => Math.max(decimals(step), decimals(base));

        const stepBy = (amount: number) => {
            if (!interactive) return;
            const base = value ?? (amount > 0 ? (min ?? 0) - step : (max ?? 0) + step);
            const raw = clamp(base + amount, min, max);
            const next = Number(raw.toFixed(precision(base)));
            setValue(next);
            setText(String(next));
        };

        const commit = () => {
            editingRef.current = false;
            const parsed = parseNumber(text);
            if (parsed === undefined) {
                setText(value === null ? "" : String(value));
                return;
            }
            const next = parsed === null ? null : clamp(parsed, min, max);
            setValue(next);
            setText(next === null ? "" : String(next));
        };

        const allowNegative = min === undefined || min < 0;
        const allowDecimal = !Number.isInteger(step);

        const buttonClasses =
            "flex h-full w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

        return (
            <Input.Root size={size} invalid={invalid} className={cn("w-auto", className)}>
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={decrementLabel}
                    aria-controls={inputId}
                    disabled={!interactive || (value !== null && min !== undefined && value <= min)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => stepBy(-step)}
                    className={cn(buttonClasses, "border-r border-input")}
                >
                    <RiSubtractLine aria-hidden="true" className="size-4" />
                </button>
                <Input.Wrapper className="px-2">
                    <Input.Input
                        ref={ref}
                        id={inputId}
                        role="spinbutton"
                        inputMode={allowNegative ? "text" : allowDecimal ? "decimal" : "numeric"}
                        autoComplete="off"
                        aria-valuenow={value ?? undefined}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        value={text}
                        disabled={disabled}
                        readOnly={readOnly}
                        onChange={(event) => {
                            editingRef.current = true;
                            setText(event.target.value);
                            const parsed = parseNumber(event.target.value);
                            // Report complete numbers as they are typed; clamping waits for commit.
                            if (parsed !== undefined) setValue(parsed);
                        }}
                        onBlur={(event) => {
                            commit();
                            onBlur?.(event);
                        }}
                        onKeyDown={(event) => {
                            onKeyDown?.(event);
                            if (event.defaultPrevented || !interactive) return;
                            const big = largeStep ?? step * 10;
                            const actions: Record<string, () => void> = {
                                ArrowUp: () => stepBy(step),
                                ArrowDown: () => stepBy(-step),
                                PageUp: () => stepBy(big),
                                PageDown: () => stepBy(-big),
                                Enter: commit,
                            };
                            const jumpTo = (target: number) => {
                                setValue(target);
                                setText(String(target));
                            };
                            if (min !== undefined) actions.Home = () => jumpTo(min);
                            if (max !== undefined) actions.End = () => jumpTo(max);
                            const action = actions[event.key];
                            if (!action) return;
                            if (event.key !== "Enter") event.preventDefault();
                            editingRef.current = false;
                            action();
                        }}
                        className={cn("text-center tabular-nums", inputClassName)}
                        {...props}
                    />
                </Input.Wrapper>
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={incrementLabel}
                    aria-controls={inputId}
                    disabled={!interactive || (value !== null && max !== undefined && value >= max)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => stepBy(step)}
                    className={cn(buttonClasses, "border-l border-input")}
                >
                    <RiAddLine aria-hidden="true" className="size-4" />
                </button>
            </Input.Root>
        );
    }
);
NumberInput.displayName = "NumberInput.Root";

export { NumberInput as Root };
