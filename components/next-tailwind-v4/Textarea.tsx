"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import { useFieldControlProps } from "./Field";

const MIN_HEIGHT = 82;

export interface TextareaRootProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Error state: destructive border and aria-invalid. Also taken from Field.Root. */
    invalid?: boolean;
    /** @deprecated Use `invalid`. */
    error?: boolean;
    /** Called with the new text on every change, in addition to the native `onChange` event handler. */
    onValueChange?: (value: string) => void;
    /** Show the drag handle for resizing (default true). */
    resizable?: boolean;
    /** Extra content shown in the bottom-right corner, e.g. <Textarea.CharCounter max={200} />. */
    children?: React.ReactNode;
    /** Class for the outer wrapper; `className` styles the <textarea> itself. */
    wrapperClassName?: string;
}

interface TextareaContextValue {
    length: number;
    counterId: string;
    setHasCounter: (value: boolean) => void;
}

const TextareaContext = React.createContext<TextareaContextValue | null>(null);

const TextareaRoot = React.forwardRef<HTMLTextAreaElement, TextareaRootProps>(
    (
        { className, wrapperClassName, invalid, error, children, style, value, defaultValue, onChange, onValueChange, resizable = true, ...props },
        forwardedRef
    ) => {
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = React.useState(() => String(defaultValue ?? ""));
        const currentValue = isControlled ? String(value ?? "") : internalValue;
        const [height, setHeight] = React.useState<number | null>(null);
        const [hasCounter, setHasCounter] = React.useState(false);
        const counterId = `${React.useId()}-counter`;
        const resizeStart = React.useRef<{ y: number; height: number } | null>(null);
        const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

        const controlProps = useFieldControlProps(
            {
                ...props,
                "aria-describedby": [props["aria-describedby"], hasCounter ? counterId : undefined].filter(Boolean).join(" ") || undefined,
            },
            { invalid: invalid ?? error }
        );
        const disabled = Boolean(controlProps.disabled);

        const setRefs = (node: HTMLTextAreaElement | null) => {
            textareaRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
        };

        const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (!isControlled) setInternalValue(event.target.value);
            onChange?.(event);
            onValueChange?.(event.target.value);
        };

        // Pointer events cover mouse, pen and touch. The handle is decorative for assistive tech.
        const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
            if (disabled || !textareaRef.current) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            resizeStart.current = { y: event.clientY, height: textareaRef.current.offsetHeight };
        };

        const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
            if (!resizeStart.current) return;
            setHeight(Math.max(MIN_HEIGHT, resizeStart.current.height + event.clientY - resizeStart.current.y));
        };

        const handlePointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
            resizeStart.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        };

        return (
            <TextareaContext.Provider value={{ length: currentValue.length, counterId, setHasCounter }}>
                <div data-disabled={disabled || undefined} className={cn("group/textarea relative flex w-full flex-col size-p-sm", wrapperClassName)}>
                    <textarea
                        ref={setRefs}
                        value={currentValue}
                        onChange={handleChange}
                        style={{ ...(height !== null ? { height } : null), ...style }}
                        className={cn(
                            "block w-full resize-none rounded-xl border bg-transparent px-3 py-2.5 pb-8 size-p-sm text-foreground",
                            "min-h-[82px] transition-colors duration-base ease-standard",
                            "placeholder:text-muted-foreground",
                            // Field focus. The halo colour and ring-0 are focus variants so they beat the forms plugin's
                            // `textarea:focus` base rule (its transparent outline and blue 1px ring).
                            "field-focus focus:ring-0",
                            controlProps["aria-invalid"]
                                ? "border-destructive focus:outline-destructive/25 hover:bg-destructive-subtle focus:border-destructive focus:hover:bg-transparent"
                                : "border-input focus:outline-accent hover:bg-muted focus:border-foreground focus:hover:bg-transparent",
                            "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/60",
                            className
                        )}
                        {...controlProps}
                    />

                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        {children}
                        {resizable && (
                            <span
                                aria-hidden="true"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                className="cursor-se-resize touch-none text-muted-foreground/60 group-data-[disabled]/textarea:pointer-events-none"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M9.11111 2L2 9.11111M10 6.44444L6.44444 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        )}
                    </div>
                </div>
            </TextareaContext.Provider>
        );
    }
);
TextareaRoot.displayName = "Textarea.Root";

export interface TextareaCharCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Character limit. Without it the counter shows the current length only. */
    max?: number;
    /** Override the counted length (defaults to the textarea's current value length). */
    current?: number;
}

const CharCounter = React.forwardRef<HTMLSpanElement, TextareaCharCounterProps>(({ current, max, className, ...props }, ref) => {
    const context = React.useContext(TextareaContext);
    const count = current ?? context?.length ?? 0;
    const overLimit = max !== undefined && count > max;
    const setHasCounter = context?.setHasCounter;

    React.useEffect(() => {
        if (!setHasCounter) return;
        setHasCounter(true);
        return () => setHasCounter(false);
    }, [setHasCounter]);

    return (
        <span
            ref={ref}
            id={context?.counterId}
            className={cn(
                "size-subheading-2xs tabular-nums transition-colors",
                // Full muted-foreground: the faded /70 shade measured 2.92:1 on white.
                overLimit ? "text-destructive-strong" : "text-muted-foreground",
                "group-data-[disabled]/textarea:text-muted-foreground/40",
                className
            )}
            {...props}
        >
            {max !== undefined ? `${count}/${max}` : count}
            {max !== undefined && <span className="sr-only"> characters used</span>}
        </span>
    );
});
CharCounter.displayName = "Textarea.CharCounter";

export { TextareaRoot as Root, CharCounter };
