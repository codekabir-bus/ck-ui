"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva } from "class-variance-authority";
import { RiArrowDownSLine, RiCheckLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import { useField, useFieldControlProps } from "./Field";
import { usePortalContainer } from "./ThemeScope";

type SelectVariant = "default" | "compact" | "compactForInput" | "inline";
type SelectSize = "sm" | "md" | "lg";

type SelectContextValue = {
    variant: SelectVariant;
    size: SelectSize;
    className?: string;
    required: boolean;
    leadingIcon?: React.ElementType;
    setLeadingIcon: (icon: React.ElementType | undefined) => void;
};

const SelectContext = React.createContext<SelectContextValue>({
    variant: "default",
    size: "md",
    required: false,
    setLeadingIcon: () => {},
});

const iconSizes = cva("shrink-0 text-muted-foreground", {
    variants: { size: { sm: "size-4", md: "size-5", lg: "size-6" } },
    defaultVariants: { size: "md" },
});

const triggerBase = [
    "group relative flex items-center justify-between overflow-hidden size-p-sm text-foreground transition duration-base ease-standard",
    "data-[placeholder]:text-muted-foreground",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-muted-foreground",
];

const triggerVariants: Record<SelectVariant, string> = {
    // Bordered triggers are fields: strong border plus a soft halo on focus (field-focus).
    default: "w-full rounded-lg border field-focus",
    compact: "w-fit min-w-12 rounded-lg border field-focus",
    inline: "h-5 min-h-5 w-fit min-w-16 gap-1 border-none bg-transparent p-0 pl-3 pr-2 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus-ring rounded",
    compactForInput: "h-full w-fit min-w-fit gap-1 rounded-none border-l border-input pl-3 pr-2 hover:bg-muted focus-ring-inset",
};

const triggerSizes: Record<SelectSize, string> = {
    sm: "h-8 gap-0.5 pl-2.5 pr-1.5",
    md: "h-9 gap-1 pl-3 pr-2",
    lg: "h-10 gap-1 rounded-10 pl-3 pr-2.5",
};

export type SelectRootProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & {
    variant?: SelectVariant;
    size?: SelectSize;
    /** Applied to the trigger. */
    className?: string;
};

function Root({ variant = "default", size = "md", className, children, required, disabled, ...props }: SelectRootProps) {
    const field = useField();
    const [leadingIcon, setLeadingIconState] = React.useState<React.ElementType | undefined>(undefined);
    const setLeadingIcon = React.useCallback((icon: React.ElementType | undefined) => setLeadingIconState(() => icon), []);
    const isRequired = Boolean(required ?? field?.required);

    return (
        <SelectContext.Provider value={{ variant, size, className, required: isRequired, leadingIcon, setLeadingIcon }}>
            <SelectPrimitive.Root required={isRequired || undefined} disabled={disabled ?? (field?.disabled || undefined)} {...props}>
                {children}
            </SelectPrimitive.Root>
        </SelectContext.Provider>
    );
}
Root.displayName = "Select.Root";

const Group = SelectPrimitive.Group;

const Value = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Value>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>>((props, ref) => (
    <SelectPrimitive.Value ref={ref} {...props} />
));
Value.displayName = "Select.Value";

/** Declares a leading icon for the trigger: <Select.Icon as={RiGlobalLine} /> inside Select.Root. */
function Icon({ as }: { as: React.ElementType }) {
    const { setLeadingIcon } = React.useContext(SelectContext);

    React.useEffect(() => {
        setLeadingIcon(as);
        return () => setLeadingIcon(undefined);
    }, [as, setLeadingIcon]);

    return null;
}
Icon.displayName = "Select.Icon";

export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    /** Error state. Also taken from Field.Root. */
    invalid?: boolean;
    /** @deprecated Use `invalid`. */
    error?: boolean;
};

const Trigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(({ className, children, invalid, error, ...props }, ref) => {
    const { variant, size, className: rootClassName, required, leadingIcon: LeadingIcon } = React.useContext(SelectContext);
    // Field required/disabled are applied on Select.Root (Radix); the trigger gets ids and ARIA state.
    // An explicit `disabled` on the trigger is still honoured.
    const controlProps = { ...useFieldControlProps(props, { invalid: invalid ?? error }), required: undefined, disabled: props.disabled };
    const isInvalid = Boolean(controlProps["aria-invalid"]);
    const bordered = variant === "default" || variant === "compact";

    return (
        <SelectPrimitive.Trigger
            ref={ref}
            aria-required={required || undefined}
            className={cn(
                triggerBase,
                triggerVariants[variant],
                bordered && triggerSizes[size],
                bordered &&
                    (isInvalid
                        ? "border-destructive outline-destructive/25 hover:bg-destructive-subtle data-[state=open]:border-destructive"
                        : "border-input outline-accent hover:bg-muted data-[state=open]:border-foreground focus:border-foreground"),
                bordered && "disabled:border-transparent disabled:bg-muted",
                rootClassName,
                className
            )}
            {...controlProps}
        >
            <span className="flex min-w-0 items-center gap-2">
                {LeadingIcon && <LeadingIcon aria-hidden="true" className={iconSizes({ size })} />}
                {children}
            </span>
            <SelectPrimitive.Icon asChild>
                <RiArrowDownSLine aria-hidden="true" className="ml-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-slow group-data-[state=open]:rotate-180" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
});
Trigger.displayName = "Select.Trigger";

const contentWidths: Record<SelectVariant, string> = {
    default: "min-w-[8rem] max-w-full",
    compact: "inline-flex w-fit min-w-20",
    inline: "",
    compactForInput: "inline-flex w-fit min-w-20",
};

const Content = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
    ({ className, children, position = "popper", ...props }, ref) => {
        const { variant } = React.useContext(SelectContext);
        const container = usePortalContainer();

        return (
            <SelectPrimitive.Portal container={container}>
                <SelectPrimitive.Content
                    ref={ref}
                    position={position}
                    side="bottom"
                    sideOffset={8}
                    collisionPadding={8}
                    className={cn(
                        "relative z-popover overflow-hidden rounded-2xl border border-border bg-surface text-surface-foreground shadow-medium",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                        contentWidths[variant],
                        className
                    )}
                    {...props}
                >
                    <SelectPrimitive.Viewport
                        className={cn("scroll-py-2 overflow-auto p-2", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}
                    >
                        {children}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        );
    }
);
Content.displayName = "Select.Content";

export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    /** Icon shown before the label (also mirrored in the trigger through Select.Value). */
    icon?: React.ElementType;
};

const Item = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(({ className, children, icon: ItemIcon, ...props }, ref) => {
    const { size } = React.useContext(SelectContext);

    return (
        <SelectPrimitive.Item
            ref={ref}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg p-2 pr-8 size-p-sm text-foreground outline-none transition-colors duration-base",
                // Keyboard focus also shows the inset focus ring: the highlight colour alone is too faint (1.1:1).
                "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground focus-ring-inset data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                size === "sm" && "gap-1.5",
                className
            )}
            {...props}
        >
            <SelectPrimitive.ItemText>
                <span className="flex items-center gap-2">
                    {ItemIcon && <ItemIcon aria-hidden="true" className={iconSizes({ size })} />}
                    {typeof children === "string" ? <span className="truncate">{children}</span> : children}
                </span>
            </SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                <RiCheckLine aria-hidden="true" className="size-4 text-muted-foreground" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
});
Item.displayName = "Select.Item";

const Label = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Label>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label ref={ref} className={cn("px-2 py-1.5 size-subheading-xs uppercase text-muted-foreground", className)} {...props} />
));
Label.displayName = "Select.Label";

const Separator = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(
    ({ className, ...props }, ref) => <SelectPrimitive.Separator ref={ref} className={cn("-mx-2 my-1 h-px bg-border", className)} {...props} />
);
Separator.displayName = "Select.Separator";

const Select = {
    Root,
    Group,
    Value,
    Trigger,
    Content,
    Item,
    Icon,
    Label,
    Separator,
};

export { Root, Group, Value, Trigger, Content, Item, Icon, Label, Separator };
export default Select;
