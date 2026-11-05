import * as React from "react";
// React + Vite: a plain <a> stands in for Next.js' <Link> (same props, full-page navigation). For client-side
// routing, render your router's link through `asChild`.
const Link = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Link(props, ref) {
    return <a ref={ref} {...props} />;
});
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so Button can be rendered from server components.

export type ButtonVariant = "default" | "stroke" | "lighter" | "ghost";
export type ButtonColor = "primary" | "neutral" | "destructive" | "success";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

/** @deprecated Use `primary` / `destructive`. */
type LegacyButtonColor = "blue" | "danger";
/** @deprecated Use `xs` / `sm` / `md` / `lg`. */
type LegacyButtonSize = "x-small" | "small" | "medium" | "large";

const LEGACY_COLORS: Record<LegacyButtonColor, ButtonColor> = { blue: "primary", danger: "destructive" };
const LEGACY_SIZES: Record<LegacyButtonSize, ButtonSize> = { "x-small": "xs", small: "sm", medium: "md", large: "lg" };

export function resolveButtonColor(color?: ButtonColor | LegacyButtonColor | null): ButtonColor {
    if (!color) return "primary";
    return color in LEGACY_COLORS ? LEGACY_COLORS[color as LegacyButtonColor] : (color as ButtonColor);
}

export function resolveButtonSize(size?: ButtonSize | LegacyButtonSize | null): ButtonSize {
    if (!size) return "md";
    return size in LEGACY_SIZES ? LEGACY_SIZES[size as LegacyButtonSize] : (size as ButtonSize);
}

const buttonRootVariants = cva(
    [
        "group/button relative flex items-center justify-center whitespace-nowrap rounded-lg border size-label-sm",
        "transition-colors duration-base ease-standard focus-ring",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground",
        "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-muted aria-disabled:text-muted-foreground",
    ],
    {
        variants: {
            variant: {
                default: "border-transparent",
                stroke: "bg-transparent hover:border-transparent",
                lighter: "border-transparent",
                ghost: "border-transparent bg-transparent",
            },
            color: {
                primary: "",
                neutral: "",
                destructive: "",
                success: "",
            },
            size: {
                lg: "h-10 min-w-10 gap-3 px-3",
                md: "h-9 min-w-9 gap-2.5 px-2.5",
                sm: "h-8 min-w-8 gap-2 px-2",
                xs: "h-7 min-w-7 gap-2 px-1.5",
            },
        },
        defaultVariants: {
            variant: "default",
            color: "primary",
            size: "md",
        },
        compoundVariants: [
            // Default (filled)
            { variant: "default", color: "primary", class: "bg-primary text-primary-foreground hover:bg-primary-hover" },
            { variant: "default", color: "neutral", class: "bg-secondary text-secondary-foreground hover:bg-secondary-hover" },
            { variant: "default", color: "destructive", class: "bg-destructive text-destructive-foreground hover:bg-destructive-hover" },
            { variant: "default", color: "success", class: "bg-success text-success-foreground hover:bg-success-hover" },

            // Stroke, lighter and ghost colour their text with the -strong shade (AA on background and -subtle).
            { variant: "stroke", color: "primary", class: "border-primary-border text-primary-strong hover:bg-primary-subtle" },
            { variant: "stroke", color: "neutral", class: "border-border text-muted-foreground hover:bg-muted hover:text-foreground" },
            { variant: "stroke", color: "destructive", class: "border-destructive-border text-destructive-strong hover:bg-destructive-subtle" },
            { variant: "stroke", color: "success", class: "border-success-border text-success-strong hover:bg-success-subtle" },

            // Lighter
            { variant: "lighter", color: "primary", class: "bg-primary-subtle text-primary-strong hover:border-primary-border hover:bg-transparent" },
            { variant: "lighter", color: "neutral", class: "bg-muted text-muted-foreground hover:border-border hover:bg-transparent hover:text-foreground" },
            { variant: "lighter", color: "destructive", class: "bg-destructive-subtle text-destructive-strong hover:border-destructive-border hover:bg-transparent" },
            { variant: "lighter", color: "success", class: "bg-success-subtle text-success-strong hover:border-success-border hover:bg-transparent" },

            // Ghost
            { variant: "ghost", color: "primary", class: "text-primary-strong hover:bg-primary-subtle" },
            { variant: "ghost", color: "neutral", class: "text-muted-foreground hover:bg-muted hover:text-foreground" },
            { variant: "ghost", color: "destructive", class: "text-destructive-strong hover:bg-destructive-subtle" },
            { variant: "ghost", color: "success", class: "text-success-strong hover:bg-success-subtle" },
        ],
    }
);

// Without an explicit size, Button.Icon follows the parent Button's data-size (pure CSS, works with asChild).
const buttonIconVariants = cva("flex shrink-0 items-center justify-center", {
    variants: {
        size: {
            inherit: "size-5 group-data-[size=sm]/button:size-4 group-data-[size=xs]/button:size-4",
            lg: "size-5",
            md: "size-5",
            sm: "size-4",
            xs: "size-4",
        },
    },
    defaultVariants: {
        size: "inherit",
    },
});

export interface ButtonRootProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
    /** Render the single child element instead of a <button>, merging Button's props onto it. */
    asChild?: boolean;
    variant?: ButtonVariant;
    color?: ButtonColor | LegacyButtonColor;
    size?: ButtonSize | LegacyButtonSize;
    /** Disables the button and marks it busy while an action runs. */
    loading?: boolean;
    /** Render a Next.js link styled as a button. */
    href?: string;
}

function LoadingIndicator() {
    return (
        <svg className="size-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
    ({ asChild = false, className, variant, color, size, loading = false, href, disabled, type, children, ...props }, ref) => {
        const resolvedSize = resolveButtonSize(size);
        const classes = cn(buttonRootVariants({ variant, color: resolveButtonColor(color), size: resolvedSize }), className);
        const isDisabled = Boolean(disabled || loading);

        if (asChild) {
            return (
                <Slot ref={ref} className={classes} data-size={resolvedSize} aria-disabled={isDisabled || undefined} aria-busy={loading || undefined} {...props}>
                    {children}
                </Slot>
            );
        }

        if (href !== undefined) {
            const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
            const anchorRef = ref as unknown as React.Ref<HTMLAnchorElement>;

            // A disabled link has no href, so it cannot be followed or focused.
            if (isDisabled) {
                return (
                    <a ref={anchorRef} className={classes} data-size={resolvedSize} aria-disabled="true" aria-busy={loading || undefined} {...anchorProps}>
                        {loading && <LoadingIndicator />}
                        {children}
                    </a>
                );
            }

            return (
                <Link ref={anchorRef} href={href} className={classes} data-size={resolvedSize} {...anchorProps}>
                    {children}
                </Link>
            );
        }

        return (
            <button ref={ref} type={type ?? "button"} className={classes} data-size={resolvedSize} disabled={isDisabled} aria-busy={loading || undefined} {...props}>
                {loading && <LoadingIndicator />}
                {children}
            </button>
        );
    }
);
ButtonRoot.displayName = "Button.Root";

export interface ButtonIconProps extends React.HTMLAttributes<HTMLElement> {
    size?: ButtonSize | LegacyButtonSize;
    /** Element or icon component to render, e.g. `as={RiAddLine}`. */
    as?: React.ElementType;
}

const ButtonIcon = React.forwardRef<HTMLElement, ButtonIconProps>(({ as: Component = "span", className, size, ...props }, ref) => {
    return <Component ref={ref} aria-hidden="true" className={cn(buttonIconVariants({ size: size ? resolveButtonSize(size) : "inherit" }), className)} {...props} />;
});
ButtonIcon.displayName = "Button.Icon";

const Button = {
    Root: ButtonRoot,
    Icon: ButtonIcon,
};

export { Button, ButtonRoot as Root, ButtonIcon as Icon, buttonRootVariants, buttonIconVariants };
export default Button;
