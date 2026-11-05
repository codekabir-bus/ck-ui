"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import * as Label from "./Label";

/*
 * Field wires a label, description and message to one form control:
 *   Field.Label        → <label for={controlId}>
 *   Field.Description  → referenced by aria-describedby
 *   Field.Message      → referenced by aria-describedby (error text when invalid)
 *   invalid / required / disabled → aria-invalid, required/aria-required, disabled on the control
 * Controls (Input, Textarea, Select, Checkbox, Switch, Radio) read the context through
 * useFieldControlProps. It is plain React state: it works with native forms and form libraries.
 */

type FieldContextValue = {
    controlId: string;
    labelId: string;
    descriptionId: string;
    messageId: string;
    invalid: boolean;
    required: boolean;
    disabled: boolean;
    hasDescription: boolean;
    hasMessage: boolean;
    setHasDescription: (value: boolean) => void;
    setHasMessage: (value: boolean) => void;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useField() {
    return React.useContext(FieldContext);
}

/**
 * Provided by Fieldset.Root. A native <fieldset disabled> already disables the controls inside it;
 * this lets each Field.Root reflect that state (label styling, `disabled` on the control).
 */
export const FieldsetContext = React.createContext<{ disabled: boolean } | null>(null);

export interface FieldRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Id for the control; generated when omitted. */
    id?: string;
    invalid?: boolean;
    required?: boolean;
    disabled?: boolean;
}

const Root = React.forwardRef<HTMLDivElement, FieldRootProps>(({ id, invalid = false, required = false, disabled: disabledProp = false, className, children, ...props }, ref) => {
    const fieldset = React.useContext(FieldsetContext);
    const disabled = disabledProp || Boolean(fieldset?.disabled);
    const generatedId = React.useId();
    const controlId = id ?? `field-${generatedId}`;
    const [hasDescription, setHasDescription] = React.useState(false);
    const [hasMessage, setHasMessage] = React.useState(false);

    const value = React.useMemo<FieldContextValue>(
        () => ({
            controlId,
            labelId: `${controlId}-label`,
            descriptionId: `${controlId}-description`,
            messageId: `${controlId}-message`,
            invalid,
            required,
            disabled,
            hasDescription,
            hasMessage,
            setHasDescription,
            setHasMessage,
        }),
        [controlId, invalid, required, disabled, hasDescription, hasMessage]
    );

    return (
        <FieldContext.Provider value={value}>
            <div
                ref={ref}
                className={cn("flex flex-col gap-1.5", className)}
                data-invalid={invalid || undefined}
                data-disabled={disabled || undefined}
                {...props}
            >
                {children}
            </div>
        </FieldContext.Provider>
    );
});
Root.displayName = "Field.Root";

type FieldLabelProps = React.ComponentPropsWithoutRef<typeof Label.Root>;

const FieldLabel = React.forwardRef<React.ElementRef<typeof Label.Root>, FieldLabelProps>(({ children, ...props }, ref) => {
    const field = useField();

    return (
        <Label.Root ref={ref} id={field?.labelId} htmlFor={field?.controlId} disabled={field?.disabled} {...props}>
            {children}
            {field?.required && <Label.Asterisk />}
        </Label.Root>
    );
});
FieldLabel.displayName = "Field.Label";

const Description = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => {
    const field = useField();
    const setHasDescription = field?.setHasDescription;

    React.useEffect(() => {
        if (!setHasDescription) return;
        setHasDescription(true);
        return () => setHasDescription(false);
    }, [setHasDescription]);

    return <p ref={ref} id={field?.descriptionId} className={cn("size-p-xs text-muted-foreground", className)} {...props} />;
});
Description.displayName = "Field.Description";

export interface FieldMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    /** Only render while the field is invalid (default true). */
    showWhenValid?: boolean;
}

const Message = React.forwardRef<HTMLParagraphElement, FieldMessageProps>(({ className, showWhenValid = false, children, ...props }, ref) => {
    const field = useField();
    const visible = Boolean(children) && (showWhenValid || !field || field.invalid);
    const setHasMessage = field?.setHasMessage;

    React.useEffect(() => {
        if (!setHasMessage || !visible) return;
        setHasMessage(true);
        return () => setHasMessage(false);
    }, [setHasMessage, visible]);

    if (!visible) return null;

    return (
        <p
            ref={ref}
            id={field?.messageId}
            aria-live="polite"
            className={cn("size-p-xs", field?.invalid ? "text-destructive-strong" : "text-muted-foreground", className)}
            {...props}
        >
            {children}
        </p>
    );
});
Message.displayName = "Field.Message";

type ControlAttributes = {
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: React.AriaAttributes["aria-invalid"];
    "aria-required"?: React.AriaAttributes["aria-required"];
    required?: boolean;
    disabled?: boolean;
};

/**
 * Merges Field context into a control's props. Explicit props win; describedby ids are combined.
 */
export function useFieldControlProps<P extends ControlAttributes>(props: P, options: { invalid?: boolean } = {}): P & ControlAttributes {
    const field = useField();
    const invalid = Boolean(options.invalid || field?.invalid || props["aria-invalid"] === true || props["aria-invalid"] === "true");

    const describedBy = [props["aria-describedby"], field?.hasDescription ? field.descriptionId : undefined, field?.hasMessage ? field.messageId : undefined]
        .filter(Boolean)
        .join(" ");

    return {
        ...props,
        id: props.id ?? field?.controlId,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": invalid || undefined,
        required: props.required ?? (field?.required || undefined),
        disabled: props.disabled ?? (field?.disabled || undefined),
    };
}

/** Applies Field wiring to any custom control element (single child). */
const Control = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & ControlAttributes>((props, ref) => {
    const controlProps = useFieldControlProps(props);
    return <Slot ref={ref} {...controlProps} />;
});
Control.displayName = "Field.Control";

export { Root, FieldLabel as Label, Description, Message, Control };
