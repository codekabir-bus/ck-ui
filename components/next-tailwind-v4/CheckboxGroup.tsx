"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import * as Checkbox from "./Checkbox";
import * as Field from "./Field";
import * as Fieldset from "./Fieldset";

/*
 * A group of Checkbox controls inside a Fieldset. The value is the list of checked item values.
 * Each item submits `name=value` with native forms (Radix renders a hidden input per checked box).
 * `required` means "at least one": it is enforced by one hidden, unnamed native checkbox so the browser
 * blocks submission, and the group then shows CheckboxGroup.Message instead of a browser bubble.
 */

export type CheckboxGroupOrientation = "vertical" | "horizontal";

type CheckboxGroupContextValue = {
    name?: string;
    form?: string;
    value: string[];
    setChecked: (itemValue: string, checked: boolean) => void;
    invalid: boolean;
    orientation: CheckboxGroupOrientation;
};

const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | null>(null);

function useCheckboxGroup(part: string) {
    const context = React.useContext(CheckboxGroupContext);
    if (!context) throw new Error(`<CheckboxGroup.${part}> must be rendered inside <CheckboxGroup.Root>.`);
    return context;
}

function useControllableValue(value: string[] | undefined, defaultValue: string[] | undefined, onValueChange: ((value: string[]) => void) | undefined) {
    const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultValue ?? []);
    const isControlled = value !== undefined;

    const setValue = React.useCallback(
        (next: string[]) => {
            if (!isControlled) setUncontrolled(next);
            onValueChange?.(next);
        },
        [isControlled, onValueChange]
    );

    return [isControlled ? value : uncontrolled, setValue] as const;
}

export interface CheckboxGroupRootProps extends Omit<Fieldset.FieldsetRootProps, "defaultValue" | "onChange"> {
    /** Submitted once per checked item (`name=value`). */
    name?: string;
    /** Checked item values (controlled). */
    value?: string[];
    /** Initially checked item values (uncontrolled). */
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** At least one item must be checked before the form submits. */
    required?: boolean;
    /** Error state: shows CheckboxGroup.Message and marks every checkbox aria-invalid. */
    invalid?: boolean;
    /** Lays the items out in a column (default) or a wrapping row. */
    orientation?: CheckboxGroupOrientation;
}

const Root = React.forwardRef<HTMLFieldSetElement, CheckboxGroupRootProps>(
    ({ name, form, value: valueProp, defaultValue, onValueChange, required = false, invalid = false, disabled = false, orientation = "vertical", children, ...props }, ref) => {
        const [value, setValue] = useControllableValue(valueProp, defaultValue, onValueChange);
        const [missingRequired, setMissingRequired] = React.useState(false);
        const validationRef = React.useRef<HTMLInputElement>(null);
        const fieldsetRef = React.useRef<HTMLFieldSetElement | null>(null);
        const composedRef = React.useCallback(
            (node: HTMLFieldSetElement | null) => {
                fieldsetRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },
            [ref]
        );
        const showRequiredError = required && missingRequired && value.length === 0;
        const isInvalid = invalid || showRequiredError;

        const setChecked = React.useCallback(
            (itemValue: string, checked: boolean) => {
                const next = checked ? (value.includes(itemValue) ? value : [...value, itemValue]) : value.filter((entry) => entry !== itemValue);
                if (next !== value) setValue(next);
            },
            [value, setValue]
        );

        // Clear the "at least one" error when the form is reset.
        React.useEffect(() => {
            const formElement = validationRef.current?.form;
            if (!formElement) return;
            const onReset = () => setMissingRequired(false);
            formElement.addEventListener("reset", onReset);
            return () => formElement.removeEventListener("reset", onReset);
        }, [required]);

        const handleInvalid = (event: React.FormEvent<HTMLInputElement>) => {
            // Replace the browser bubble (it would point at a hidden input) with the group's own message.
            event.preventDefault();
            setMissingRequired(true);
            fieldsetRef.current?.querySelector<HTMLButtonElement>("button[role=checkbox]:not(:disabled)")?.focus();
        };

        const context = React.useMemo(() => ({ name, form, value, setChecked, invalid: isInvalid, orientation }), [name, form, value, setChecked, isInvalid, orientation]);

        return (
            <CheckboxGroupContext.Provider value={context}>
                <Fieldset.Root
                    ref={composedRef}
                    form={form}
                    required={required}
                    invalid={isInvalid}
                    disabled={disabled}
                    data-orientation={orientation}
                    {...props}
                >
                    {children}
                    {required && (
                        <input
                            ref={validationRef}
                            type="checkbox"
                            aria-hidden="true"
                            tabIndex={-1}
                            form={form}
                            required
                            checked={value.length > 0}
                            onChange={() => {}}
                            onInvalid={handleInvalid}
                            className="pointer-events-none absolute left-0 top-0 m-0 size-px opacity-0"
                        />
                    )}
                </Fieldset.Root>
            </CheckboxGroupContext.Provider>
        );
    }
);
Root.displayName = "CheckboxGroup.Root";

/** The group label, rendered as the fieldset's <legend>. */
const Label = React.forwardRef<HTMLLegendElement, React.HTMLAttributes<HTMLLegendElement>>((props, ref) => <Fieldset.Legend ref={ref} {...props} />);
Label.displayName = "CheckboxGroup.Label";

const Description = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>((props, ref) => <Fieldset.Description ref={ref} {...props} />);
Description.displayName = "CheckboxGroup.Description";

/** Wraps the items and lays them out according to `orientation`. */
const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const { orientation } = useCheckboxGroup("Content");
    return (
        <Fieldset.Content
            ref={ref}
            data-orientation={orientation}
            className={cn(orientation === "horizontal" ? "flex-row flex-wrap gap-x-6 gap-y-3" : "gap-3", className)}
            {...props}
        />
    );
});
Content.displayName = "CheckboxGroup.Content";

export interface CheckboxGroupItemProps
    extends Omit<Checkbox.CheckboxRootProps, "checked" | "defaultChecked" | "onCheckedChange" | "value" | "name" | "form" | "children" | "invalid"> {
    /** Submitted as `name=value` when checked. */
    value: string;
    /** The item's label. */
    children: React.ReactNode;
    /** Secondary text under the label (wired with aria-describedby). */
    description?: React.ReactNode;
}

/** One labelled checkbox. `className` goes on the item row; other props go to the checkbox. */
const Item = React.forwardRef<HTMLButtonElement, CheckboxGroupItemProps>(({ value, children, description, disabled, id, className, ...props }, ref) => {
    const group = useCheckboxGroup("Item");

    return (
        <Field.Root id={id} disabled={disabled} invalid={group.invalid} className={cn("flex-row items-start gap-2.5", className)}>
            <Checkbox.Root
                ref={ref}
                name={group.name}
                form={group.form}
                value={value}
                checked={group.value.includes(value)}
                onCheckedChange={(checked) => group.setChecked(value, checked === true)}
                {...props}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
                <Field.Label className="leading-5">{children}</Field.Label>
                {description && <Field.Description>{description}</Field.Description>}
            </div>
        </Field.Root>
    );
});
Item.displayName = "CheckboxGroup.Item";

/** Error text for the group. Rendered while the group is invalid (including a missed `required`). */
const Message = React.forwardRef<HTMLParagraphElement, Fieldset.FieldsetMessageProps>((props, ref) => <Fieldset.Message ref={ref} {...props} />);
Message.displayName = "CheckboxGroup.Message";

export { Root, Label, Description, Content, Item, Message };
