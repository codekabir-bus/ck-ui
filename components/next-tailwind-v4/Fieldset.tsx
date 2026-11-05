"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import { FieldsetContext } from "./Field";
import * as Label from "./Label";

/*
 * Fieldset groups related controls under a real <fieldset> / <legend>:
 *   Fieldset.Legend       → the group's accessible name
 *   Fieldset.Description  → referenced by aria-describedby on the fieldset
 *   Fieldset.Message      → referenced by aria-describedby while the group is invalid
 *   disabled              → native <fieldset disabled>; Field.Root children follow it
 */

type FieldsetPartsContextValue = {
    descriptionId: string;
    messageId: string;
    invalid: boolean;
    required: boolean;
    disabled: boolean;
    setHasDescription: (value: boolean) => void;
    setHasMessage: (value: boolean) => void;
};

const FieldsetPartsContext = React.createContext<FieldsetPartsContextValue | null>(null);

export function useFieldset() {
    return React.useContext(FieldsetPartsContext);
}

export interface FieldsetRootProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
    /** Shows Fieldset.Message and marks the group as having an error. */
    invalid?: boolean;
    /** Adds a required marker to the legend. Validation stays on the controls. */
    required?: boolean;
}

const Root = React.forwardRef<HTMLFieldSetElement, FieldsetRootProps>(
    ({ id, invalid = false, required = false, disabled = false, className, children, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
        const generatedId = React.useId();
        const baseId = id ?? `fieldset-${generatedId}`;
        const [hasDescription, setHasDescription] = React.useState(false);
        const [hasMessage, setHasMessage] = React.useState(false);

        const parts = React.useMemo<FieldsetPartsContextValue>(
            () => ({
                descriptionId: `${baseId}-description`,
                messageId: `${baseId}-message`,
                invalid,
                required,
                disabled,
                setHasDescription,
                setHasMessage,
            }),
            [baseId, invalid, required, disabled]
        );
        const fieldset = React.useMemo(() => ({ disabled }), [disabled]);

        const describedBy = [ariaDescribedBy, hasDescription ? parts.descriptionId : undefined, hasMessage ? parts.messageId : undefined].filter(Boolean).join(" ");

        return (
            <FieldsetPartsContext.Provider value={parts}>
                <FieldsetContext.Provider value={fieldset}>
                    <fieldset
                        ref={ref}
                        id={id}
                        disabled={disabled}
                        aria-describedby={describedBy || undefined}
                        data-invalid={invalid || undefined}
                        data-disabled={disabled || undefined}
                        className={cn("group/fieldset relative m-0 min-w-0 border-0 p-0", className)}
                        {...props}
                    >
                        {children}
                    </fieldset>
                </FieldsetContext.Provider>
            </FieldsetPartsContext.Provider>
        );
    }
);
Root.displayName = "Fieldset.Root";

const Legend = React.forwardRef<HTMLLegendElement, React.HTMLAttributes<HTMLLegendElement>>(({ className, children, ...props }, ref) => {
    const fieldset = useFieldset();

    return (
        <legend
            ref={ref}
            // Floated so it never sits on the fieldset border (native legend rendering); later parts clear it.
            className={cn("float-left mb-1 w-full p-0 size-label-sm text-foreground group-data-[disabled]/fieldset:text-muted-foreground/60", className)}
            {...props}
        >
            {children}
            {fieldset?.required && (
                <>
                    <Label.Asterisk className="ml-px" />{" "}
                    <span className="sr-only">(required)</span>
                </>
            )}
        </legend>
    );
});
Legend.displayName = "Fieldset.Legend";

const Description = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => {
    const fieldset = useFieldset();
    const setHasDescription = fieldset?.setHasDescription;

    React.useEffect(() => {
        if (!setHasDescription) return;
        setHasDescription(true);
        return () => setHasDescription(false);
    }, [setHasDescription]);

    return <p ref={ref} id={fieldset?.descriptionId} className={cn("clear-left size-p-xs text-muted-foreground", className)} {...props} />;
});
Description.displayName = "Fieldset.Description";

/** Layout wrapper for the controls in the group. */
const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("clear-left mt-3 flex flex-col gap-4", className)} {...props} />
));
Content.displayName = "Fieldset.Content";

export interface FieldsetMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    /** Also render while the group is valid (default false). */
    showWhenValid?: boolean;
}

const Message = React.forwardRef<HTMLParagraphElement, FieldsetMessageProps>(({ className, showWhenValid = false, children, ...props }, ref) => {
    const fieldset = useFieldset();
    const visible = Boolean(children) && (showWhenValid || !fieldset || fieldset.invalid);
    const setHasMessage = fieldset?.setHasMessage;

    React.useEffect(() => {
        if (!setHasMessage || !visible) return;
        setHasMessage(true);
        return () => setHasMessage(false);
    }, [setHasMessage, visible]);

    if (!visible) return null;

    return (
        <p
            ref={ref}
            id={fieldset?.messageId}
            aria-live="polite"
            className={cn("clear-left mt-2 size-p-xs", fieldset?.invalid ? "text-destructive-strong" : "text-muted-foreground", className)}
            {...props}
        >
            {children}
        </p>
    );
});
Message.displayName = "Fieldset.Message";

export { Root, Legend, Description, Content, Message };
