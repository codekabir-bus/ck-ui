import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so Badge can be rendered from server components.

export type BadgeVariant = "filled" | "light" | "lighter" | "stroke";
/** Decorative palette (Badge is an explicit palette API, see CONVENTIONS.md). */
export type BadgeColor = "neutral" | "gray" | "blue" | "orange" | "red" | "green" | "yellow" | "purple" | "sky" | "pink" | "teal";
export type BadgeSize = "sm" | "md" | "lg";

/**
 * @deprecated These names never had styles of their own. They map to:
 * `default` → `filled`, `secondary` → `light`, `outline` → `stroke`, `destructive` → `filled` + `color="red"`.
 */
type LegacyBadgeVariant = "default" | "secondary" | "outline" | "destructive";
/** @deprecated Use `sm` / `md`. */
type LegacyBadgeSize = "small" | "medium";
/**
 * Sizes accepted by `size`. Any other string is applied as class names.
 * @deprecated Passing class names through `size` (e.g. `size="size-7"`) — use `className` instead.
 */
type BadgeSizeInput = BadgeSize | LegacyBadgeSize | (string & {});

const LEGACY_VARIANTS: Record<LegacyBadgeVariant, { variant: BadgeVariant; color?: BadgeColor }> = {
    default: { variant: "filled" },
    secondary: { variant: "light" },
    outline: { variant: "stroke" },
    destructive: { variant: "filled", color: "red" },
};
const LEGACY_SIZES: Record<LegacyBadgeSize, BadgeSize> = { small: "sm", medium: "md" };

const SIZE_STYLES: Record<BadgeSize, { root: string; icon: string }> = {
    sm: { root: "h-4 min-w-4 gap-1.5 px-1 uppercase size-subheading-2xs", icon: "-mx-1 size-3" },
    md: { root: "h-5 min-w-5 gap-1.5 px-2 size-label-xs capitalize", icon: "-mx-2 size-4" },
    lg: { root: "h-6 min-w-6 gap-1.5 px-2 size-label-xs capitalize", icon: "-mx-2 size-5" },
};

// Text is at least 4.5:1 on its background in both themes (WCAG AA, see color-contrast.test.ts): filled badges use the
// lightest shade white text passes on, lighter and stroke badges use -700 text in light mode.
const COLOR_STYLES: Record<BadgeVariant, Record<BadgeColor, string>> = {
    filled: {
        neutral: "bg-neutral-500 ck-dark:bg-neutral-600 text-white",
        gray: "bg-gray-500 ck-dark:bg-gray-600 text-white",
        blue: "bg-blue-600 text-white",
        orange: "bg-orange-700 text-white",
        red: "bg-red-600 text-white",
        green: "bg-green-700 text-white",
        yellow: "bg-yellow-700 text-white",
        purple: "bg-purple-600 text-white",
        sky: "bg-sky-700 text-white",
        pink: "bg-pink-600 text-white",
        teal: "bg-teal-700 text-white",
    },
    light: {
        neutral: "bg-neutral-100 ck-dark:bg-neutral-800 text-neutral-800 ck-dark:text-neutral-200",
        gray: "bg-gray-100 ck-dark:bg-gray-800 text-gray-800 ck-dark:text-gray-200",
        blue: "bg-blue-100 ck-dark:bg-blue-800 text-blue-800 ck-dark:text-blue-200",
        orange: "bg-orange-100 ck-dark:bg-orange-800 text-orange-800 ck-dark:text-orange-200",
        red: "bg-red-100 ck-dark:bg-red-800 text-red-800 ck-dark:text-red-200",
        green: "bg-green-100 ck-dark:bg-green-800 text-green-800 ck-dark:text-green-200",
        yellow: "bg-yellow-100 ck-dark:bg-yellow-800 text-yellow-800 ck-dark:text-yellow-200",
        purple: "bg-purple-100 ck-dark:bg-purple-800 text-purple-800 ck-dark:text-purple-200",
        sky: "bg-sky-100 ck-dark:bg-sky-800 text-sky-800 ck-dark:text-sky-200",
        pink: "bg-pink-100 ck-dark:bg-pink-800 text-pink-800 ck-dark:text-pink-200",
        teal: "bg-teal-100 ck-dark:bg-teal-800 text-teal-800 ck-dark:text-teal-200",
    },
    lighter: {
        neutral: "bg-neutral-100 ck-dark:bg-neutral-900 text-neutral-700 ck-dark:text-neutral-300",
        gray: "bg-gray-50 ck-dark:bg-gray-900 text-gray-700 ck-dark:text-gray-300",
        blue: "bg-blue-50 ck-dark:bg-blue-900 text-blue-700 ck-dark:text-blue-300",
        orange: "bg-orange-50 ck-dark:bg-orange-900 text-orange-700 ck-dark:text-orange-300",
        red: "bg-red-50 ck-dark:bg-red-900 text-red-700 ck-dark:text-red-300",
        green: "bg-green-50 ck-dark:bg-green-900 text-green-700 ck-dark:text-green-300",
        yellow: "bg-yellow-50 ck-dark:bg-yellow-900 text-yellow-700 ck-dark:text-yellow-300",
        purple: "bg-purple-50 ck-dark:bg-purple-900 text-purple-700 ck-dark:text-purple-300",
        sky: "bg-sky-50 ck-dark:bg-sky-900 text-sky-700 ck-dark:text-sky-300",
        pink: "bg-pink-50 ck-dark:bg-pink-900 text-pink-700 ck-dark:text-pink-300",
        teal: "bg-teal-50 ck-dark:bg-teal-900 text-teal-700 ck-dark:text-teal-300",
    },
    stroke: {
        neutral: "ring-1 ring-inset ring-neutral-200 ck-dark:ring-neutral-700 text-neutral-700 ck-dark:text-neutral-300",
        gray: "ring-1 ring-inset ring-gray-200 ck-dark:ring-gray-700 text-gray-700 ck-dark:text-gray-300",
        blue: "ring-1 ring-inset ring-blue-200 ck-dark:ring-blue-700 text-blue-700 ck-dark:text-blue-300",
        orange: "ring-1 ring-inset ring-orange-200 ck-dark:ring-orange-700 text-orange-700 ck-dark:text-orange-300",
        red: "ring-1 ring-inset ring-red-200 ck-dark:ring-red-700 text-red-700 ck-dark:text-red-300",
        green: "ring-1 ring-inset ring-green-200 ck-dark:ring-green-700 text-green-700 ck-dark:text-green-300",
        yellow: "ring-1 ring-inset ring-yellow-200 ck-dark:ring-yellow-700 text-yellow-700 ck-dark:text-yellow-300",
        purple: "ring-1 ring-inset ring-purple-200 ck-dark:ring-purple-700 text-purple-700 ck-dark:text-purple-300",
        sky: "ring-1 ring-inset ring-sky-200 ck-dark:ring-sky-700 text-sky-700 ck-dark:text-sky-300",
        pink: "ring-1 ring-inset ring-pink-200 ck-dark:ring-pink-700 text-pink-700 ck-dark:text-pink-300",
        teal: "ring-1 ring-inset ring-teal-200 ck-dark:ring-teal-700 text-teal-700 ck-dark:text-teal-300",
    },
};

const DISABLED_STYLES = "ring-1 ring-inset ring-border bg-transparent text-neutral-300 ck-dark:text-neutral-600";

const hasKey = <T extends object>(record: T, key: string): key is Extract<keyof T, string> => Object.prototype.hasOwnProperty.call(record, key);

/** Resolves a size to a canonical step, or to legacy class names when it is not a known size. */
export function resolveBadgeSize(size?: BadgeSizeInput | null): { size?: BadgeSize; className?: string } {
    if (!size) return { size: "sm" };
    if (hasKey(SIZE_STYLES, size)) return { size };
    if (hasKey(LEGACY_SIZES, size)) return { size: LEGACY_SIZES[size] };
    return { className: size };
}

export function resolveBadgeVariant(variant?: BadgeVariant | LegacyBadgeVariant | null, color?: BadgeColor | null): { variant: BadgeVariant; color: BadgeColor } {
    if (variant && hasKey(LEGACY_VARIANTS, variant)) {
        const legacy = LEGACY_VARIANTS[variant];
        return { variant: legacy.variant, color: legacy.color ?? color ?? "neutral" };
    }
    const resolvedVariant = variant && hasKey(COLOR_STYLES, variant) ? variant : "filled";
    const resolvedColor = color && hasKey(COLOR_STYLES.filled, color) ? color : "neutral";
    return { variant: resolvedVariant, color: resolvedColor };
}

function sizeClasses(size: BadgeSizeInput | undefined, part: "root" | "icon") {
    const resolved = resolveBadgeSize(size);
    return resolved.size ? SIZE_STYLES[resolved.size][part] : resolved.className;
}

export interface BadgeRootProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
    /** Render the single child element instead of a <span>, merging Badge's props onto it. */
    asChild?: boolean;
    variant?: BadgeVariant | LegacyBadgeVariant;
    color?: BadgeColor;
    size?: BadgeSizeInput;
    /** Muted, outlined appearance. Sets `aria-disabled` and `data-disabled`; it does not block events on an `asChild` element. */
    disabled?: boolean;
    /** Minimal horizontal padding, for counters and single characters. */
    square?: boolean;
    /** Pill shape (`rounded-full`) instead of `rounded-md`. */
    rounded?: boolean;
}

const BadgeRoot = React.forwardRef<HTMLSpanElement, BadgeRootProps>(
    ({ asChild = false, className, variant, color, size, disabled = false, square = false, rounded = false, children, ...props }, ref) => {
        const resolvedSize = resolveBadgeSize(size);
        const resolved = resolveBadgeVariant(variant, color);
        const Component = asChild ? Slot : "span";

        // Rounding comes before className so consumer classes (e.g. `rounded-full`) win.
        const classes = cn(
            "inline-flex items-center justify-center leading-none transition-colors duration-base ease-standard",
            resolvedSize.size ? SIZE_STYLES[resolvedSize.size].root : resolvedSize.className,
            square && "px-1",
            rounded ? "rounded-full" : "rounded-md",
            disabled ? DISABLED_STYLES : COLOR_STYLES[resolved.variant][resolved.color],
            className
        );

        return (
            <Component ref={ref} className={classes} data-size={resolvedSize.size} data-disabled={disabled ? "" : undefined} aria-disabled={disabled || undefined} {...props}>
                {children}
            </Component>
        );
    }
);
BadgeRoot.displayName = "Badge.Root";

type BadgeIconElement = React.ReactElement<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;

export interface BadgeIconProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Icon component to render, e.g. `as={RiInformationFill}`.
     * A rendered element (`as={<RiInformationFill />}`) is still accepted; its own classes are merged first.
     */
    as?: React.ElementType | BadgeIconElement;
    /** Icon size. Defaults to `sm`; it does not follow Badge.Root's size. */
    size?: BadgeSizeInput;
}

const BadgeIcon = React.forwardRef<HTMLElement, BadgeIconProps>(({ as, className, size, ...props }, ref) => {
    const classes = cn("shrink-0", sizeClasses(size, "icon"), className);

    if (React.isValidElement<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>(as)) {
        return React.cloneElement(as, { "aria-hidden": true, ...props, ref, className: cn(as.props.className, classes) });
    }

    const Component = as ?? "span";
    return <Component ref={ref} aria-hidden="true" className={classes} {...props} />;
});
BadgeIcon.displayName = "Badge.Icon";

export interface BadgeDotProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Dot box size. Defaults to `sm`. */
    size?: BadgeSizeInput;
}

const BadgeDot = React.forwardRef<HTMLSpanElement, BadgeDotProps>(({ className, size, ...props }, ref) => {
    return (
        <span
            ref={ref}
            aria-hidden="true"
            className={cn("flex shrink-0 items-center justify-center before:h-1 before:w-1 before:rounded-full before:bg-current", sizeClasses(size, "icon"), className)}
            {...props}
        />
    );
});
BadgeDot.displayName = "Badge.Dot";

export { BadgeRoot as Root, BadgeIcon as Icon, BadgeDot as Dot };
