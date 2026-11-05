import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import { resolveButtonSize, type ButtonSize } from "./Button";

// Server-compatible: no hooks, context or cloneElement.
// Root publishes its size and shape as CSS custom properties (and typography, which buttons inherit);
// Items and Icons read them with fallbacks to the `md` values. Because the consuming classes are plain
// arbitrary-value utilities that read these properties, a consumer className such as `px-8` still wins through cn().

/** @deprecated Use `xs` / `sm` / `md` / `lg`. */
type LegacyButtonGroupSize = "x-small" | "small" | "medium" | "large";
export type ButtonGroupSize = ButtonSize;

const SIZE_VARS: Record<ButtonGroupSize, string> = {
    lg: "[--button-group-item-height:2.25rem] [--button-group-item-padding:1rem] [--button-group-item-gap:1rem] [--button-group-icon-size:1.25rem] [--button-group-icon-margin:-0.5rem]",
    md: "[--button-group-item-height:2rem] [--button-group-item-padding:0.875rem] [--button-group-item-gap:0.875rem] [--button-group-icon-size:1rem] [--button-group-icon-margin:-0.5rem]",
    sm: "[--button-group-item-height:1.75rem] [--button-group-item-padding:0.875rem] [--button-group-item-gap:0.875rem] [--button-group-icon-size:0.875rem] [--button-group-icon-margin:-0.5rem]",
    xs: "[--button-group-item-height:1.75rem] [--button-group-item-padding:0.375rem] [--button-group-item-gap:0.5rem] [--button-group-icon-size:1rem] [--button-group-icon-margin:0px]",
};

const ICON_SIZE_VARS: Record<ButtonGroupSize, string> = {
    lg: "[--button-group-icon-size:1.25rem] [--button-group-icon-margin:-0.5rem]",
    md: "[--button-group-icon-size:1rem] [--button-group-icon-margin:-0.5rem]",
    sm: "[--button-group-icon-size:0.875rem] [--button-group-icon-margin:-0.5rem]",
    xs: "[--button-group-icon-size:1rem] [--button-group-icon-margin:0px]",
};

// Buttons inherit font settings (Tailwind preflight), so typography set on Root applies to every Item.
const SIZE_TYPOGRAPHY: Record<ButtonGroupSize, string> = {
    lg: "size-label-sm",
    md: "size-label-sm",
    sm: "size-label-xs",
    xs: "size-label-xs",
};

const ROUNDED_VARS = {
    default: "[--button-group-radius:0.5rem]",
    full: "[--button-group-radius:9999px]",
};

const buttonGroupItemClasses = [
    "relative flex items-center justify-center whitespace-nowrap text-center",
    "h-[var(--button-group-item-height,2rem)] min-w-[var(--button-group-item-height,2rem)] gap-[var(--button-group-item-gap,0.875rem)] px-[var(--button-group-item-padding,0.875rem)]",
    "first:rounded-l-[var(--button-group-radius,0.5rem)] last:rounded-r-[var(--button-group-radius,0.5rem)]",
    "border border-border bg-background text-gray-600 ck-dark:text-neutral-400",
    "transition duration-base ease-standard",
    "hover:bg-gray-100 ck-dark:hover:bg-neutral-800",
    "focus-ring focus-visible:z-10",
    "data-[state=on]:bg-gray-200 data-[state=on]:text-foreground ck-dark:data-[state=on]:bg-neutral-700 ck-dark:data-[state=on]:text-foreground",
    "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:opacity-50",
];

const buttonGroupIconClasses = "shrink-0 size-[var(--button-group-icon-size,1rem)] mx-[var(--button-group-icon-margin,-0.5rem)]";

export interface ButtonGroupRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Size of every item in the group. */
    size?: ButtonGroupSize | LegacyButtonGroupSize;
    /** Pill-shaped outer corners. */
    roundedFull?: boolean;
}

const ButtonGroupRoot = React.forwardRef<HTMLDivElement, ButtonGroupRootProps>(({ className, size, roundedFull = false, ...props }, ref) => {
    const resolvedSize = resolveButtonSize(size);

    return (
        <div
            ref={ref}
            role="group"
            data-size={resolvedSize}
            data-rounded={roundedFull ? "full" : undefined}
            className={cn(
                "flex -space-x-[1.5px]",
                SIZE_VARS[resolvedSize],
                SIZE_TYPOGRAPHY[resolvedSize],
                roundedFull ? ROUNDED_VARS.full : ROUNDED_VARS.default,
                className
            )}
            {...props}
        />
    );
});
ButtonGroupRoot.displayName = "ButtonGroup.Root";

export interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Marks the item as the current selection: sets `aria-pressed` and `data-state="on" | "off"`. Leave undefined for plain action buttons. */
    active?: boolean;
    /** Render the single child element instead of a <button>, merging the item's props onto it. */
    asChild?: boolean;
    /** @deprecated Set `size` on ButtonGroup.Root. Overrides the group size for this item (and its icons) only. */
    size?: ButtonGroupSize | LegacyButtonGroupSize;
    /** @deprecated Set `roundedFull` on ButtonGroup.Root. */
    roundedFull?: boolean;
}

const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
    ({ className, active, asChild = false, size, roundedFull, disabled, type, children, ...props }, ref) => {
        const ownSize = size ? resolveButtonSize(size) : undefined;
        const classes = cn(
            buttonGroupItemClasses,
            ownSize && [SIZE_VARS[ownSize], SIZE_TYPOGRAPHY[ownSize]],
            roundedFull !== undefined && (roundedFull ? ROUNDED_VARS.full : ROUNDED_VARS.default),
            className
        );
        const state = active === undefined ? undefined : active ? "on" : "off";

        if (asChild) {
            return (
                <Slot ref={ref} className={classes} aria-pressed={active} data-state={state} aria-disabled={disabled || undefined} {...props}>
                    {children}
                </Slot>
            );
        }

        return (
            <button ref={ref} type={type ?? "button"} className={classes} aria-pressed={active} data-state={state} disabled={disabled} {...props}>
                {children}
            </button>
        );
    }
);
ButtonGroupItem.displayName = "ButtonGroup.Item";

export interface ButtonGroupIconProps extends React.HTMLAttributes<HTMLElement> {
    /** Overrides the size inherited from ButtonGroup.Root. */
    size?: ButtonGroupSize | LegacyButtonGroupSize;
    /** Element or icon component to render, e.g. `as={RiBold}`. Defaults to a <span>. */
    as?: React.ElementType;
}

const ButtonGroupIcon = React.forwardRef<HTMLElement, ButtonGroupIconProps>(({ as: Component = "span", className, size, ...props }, ref) => {
    return <Component ref={ref} aria-hidden="true" className={cn(buttonGroupIconClasses, size && ICON_SIZE_VARS[resolveButtonSize(size)], className)} {...props} />;
});
ButtonGroupIcon.displayName = "ButtonGroup.Icon";

const ButtonGroup = {
    Root: ButtonGroupRoot,
    Item: ButtonGroupItem,
    Icon: ButtonGroupIcon,
};

export { ButtonGroup, ButtonGroupRoot as Root, ButtonGroupItem as Item, ButtonGroupIcon as Icon };
export default ButtonGroup;
