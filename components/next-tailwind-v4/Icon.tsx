import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so Icon can be rendered from server components.
// The icon inside the container is sized with CSS (`[&>*]:size-*`), so children are never cloned.

/** Decorative palette (Icon is an explicit palette API, see CONVENTIONS.md). */
export type IconColor = "neutral" | "gray" | "blue" | "orange" | "red" | "green" | "yellow" | "purple" | "pink" | "teal" | "cyan";
export type IconVariant = "stroke" | "lighter";
export type IconSize = "sm" | "md" | "lg" | "xl" | "2xl";

/** @deprecated Combined form, e.g. `variant="blue-lighter"` — use `variant="lighter" color="blue"`. */
export type LegacyIconVariant = `${IconColor}-${IconVariant}`;
/** @deprecated Use `sm` / `md` / `lg` / `xl` / `2xl`. */
type LegacyIconSize = "small" | "medium" | "large" | "x-large" | "2x-large";

const LEGACY_SIZES: Record<LegacyIconSize, IconSize> = { small: "sm", medium: "md", large: "lg", "x-large": "xl", "2x-large": "2xl" };

// Container size and the size of its direct children (the icon).
const SIZE_STYLES: Record<IconSize, { container: string; icon: string }> = {
    sm: { container: "h-8 w-8 p-1.5 [&>*]:size-4", icon: "size-4" }, // 16px icon
    md: { container: "h-10 w-10 p-2.5 [&>*]:size-5", icon: "size-5" }, // 20px icon
    lg: { container: "h-12 w-12 p-3 [&>*]:size-6", icon: "size-6" }, // 24px icon
    xl: { container: "h-14 w-14 p-3.5 [&>*]:size-7", icon: "size-7" }, // 28px icon
    "2xl": { container: "h-16 w-16 p-4 [&>*]:size-8", icon: "size-8" }, // 32px icon
};

const VARIANT_STYLES: Record<LegacyIconVariant, string> = {
    "neutral-lighter": "bg-neutral-50 text-muted-foreground ck-dark:bg-neutral-800",
    "neutral-stroke": "border border-border text-muted-foreground",

    "gray-lighter": "bg-gray-50 text-gray-500 ck-dark:bg-gray-800 ck-dark:text-gray-400",
    "gray-stroke": "border border-gray-200 text-gray-500 ck-dark:border-gray-700 ck-dark:text-gray-400",

    "blue-lighter": "bg-blue-50 text-blue-500 ck-dark:bg-blue-900/20 ck-dark:text-blue-400",
    "blue-stroke": "border border-blue-200 text-blue-500 ck-dark:border-blue-700 ck-dark:text-blue-400",

    "orange-lighter": "bg-orange-50 text-orange-500 ck-dark:bg-orange-900/20 ck-dark:text-orange-400",
    "orange-stroke": "border border-orange-200 text-orange-500 ck-dark:border-orange-700 ck-dark:text-orange-400",

    "red-lighter": "bg-red-50 text-red-500 ck-dark:bg-red-900/20 ck-dark:text-red-400",
    "red-stroke": "border border-red-200 text-red-500 ck-dark:border-red-700 ck-dark:text-red-400",

    "green-lighter": "bg-green-50 text-green-500 ck-dark:bg-green-900/20 ck-dark:text-green-400",
    "green-stroke": "border border-green-200 text-green-500 ck-dark:border-green-700 ck-dark:text-green-400",

    "yellow-lighter": "bg-yellow-50 text-yellow-500 ck-dark:bg-yellow-900/20 ck-dark:text-yellow-400",
    "yellow-stroke": "border border-yellow-200 text-yellow-500 ck-dark:border-yellow-700 ck-dark:text-yellow-400",

    "purple-lighter": "bg-purple-50 text-purple-500 ck-dark:bg-purple-900/20 ck-dark:text-purple-400",
    "purple-stroke": "border border-purple-200 text-purple-500 ck-dark:border-purple-700 ck-dark:text-purple-400",

    "pink-lighter": "bg-pink-50 text-pink-500 ck-dark:bg-pink-900/20 ck-dark:text-pink-400",
    "pink-stroke": "border border-pink-200 text-pink-500 ck-dark:border-pink-700 ck-dark:text-pink-400",

    "teal-lighter": "bg-teal-50 text-teal-500 ck-dark:bg-teal-900/20 ck-dark:text-teal-400",
    "teal-stroke": "border border-teal-200 text-teal-500 ck-dark:border-teal-700 ck-dark:text-teal-400",

    "cyan-lighter": "bg-cyan-50 text-cyan-500 ck-dark:bg-cyan-900/20 ck-dark:text-cyan-400",
    "cyan-stroke": "border border-cyan-200 text-cyan-500 ck-dark:border-cyan-700 ck-dark:text-cyan-400",
};

const hasKey = <T extends object>(record: T, key: string): key is Extract<keyof T, string> => Object.prototype.hasOwnProperty.call(record, key);

export function resolveIconSize(size?: IconSize | LegacyIconSize | null): IconSize {
    if (!size) return "md";
    if (hasKey(LEGACY_SIZES, size)) return LEGACY_SIZES[size];
    return hasKey(SIZE_STYLES, size) ? size : "md";
}

/** A legacy combined variant (`"blue-lighter"`) sets both parts; an explicit `color` still wins over its colour. */
export function resolveIconVariant(variant?: IconVariant | LegacyIconVariant | null, color?: IconColor | null): { variant: IconVariant; color: IconColor } {
    if (variant && hasKey(VARIANT_STYLES, variant)) {
        const separator = variant.lastIndexOf("-");
        return { color: color ?? (variant.slice(0, separator) as IconColor), variant: variant.slice(separator + 1) as IconVariant };
    }
    return { variant: variant === "lighter" ? "lighter" : "stroke", color: color ?? "neutral" };
}

function hasTextContent(children: React.ReactNode) {
    return React.Children.toArray(children).some((child) => typeof child === "string" || typeof child === "number");
}

export interface IconRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
    /** Render the single child element instead of a <div>, merging Icon's props onto it. */
    asChild?: boolean;
    /** `stroke` (bordered) or `lighter` (tinted background). The legacy combined form `"blue-lighter"` is still accepted. */
    variant?: IconVariant | LegacyIconVariant;
    color?: IconColor;
    size?: IconSize | LegacyIconSize;
}

/**
 * Round container that sizes and colours the icon inside it.
 * Decorative by default (`aria-hidden`); pass `aria-label` to expose it as an image (`role="img"`).
 * It stays exposed when it contains text, and with `asChild` the child element decides.
 */
const IconRoot = React.forwardRef<HTMLDivElement, IconRootProps>(({ asChild = false, variant, color, size, className, children, ...props }, ref) => {
    const resolvedSize = resolveIconSize(size);
    const resolved = resolveIconVariant(variant, color);
    const labelled = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
    const decorative = !asChild && !labelled && !hasTextContent(children);
    const Component = asChild ? Slot : "div";

    return (
        <Component
            ref={ref}
            role={labelled ? "img" : undefined}
            aria-hidden={decorative || undefined}
            data-size={resolvedSize}
            // Rounding comes before className so a consumer `rounded-*` class wins.
            className={cn("flex items-center justify-center rounded-full", SIZE_STYLES[resolvedSize].container, VARIANT_STYLES[`${resolved.color}-${resolved.variant}`], className)}
            {...props}
        >
            {children}
        </Component>
    );
});
IconRoot.displayName = "Icon.Root";

export interface IconChildProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: IconSize | LegacyIconSize;
}

/** Sized wrapper for icon content outside an Icon.Root. Inside a Root, the Root's size applies. */
const IconChild = React.forwardRef<HTMLDivElement, IconChildProps>(({ size, className, ...props }, ref) => {
    return <div ref={ref} className={cn(SIZE_STYLES[resolveIconSize(size)].icon, className)} {...props} />;
});
IconChild.displayName = "Icon.Child";

/** `Icon` is the same component as `Icon.Root` (kept for `import { Icon } from "./Icon"`). */
export { IconRoot as Root, IconRoot as Icon, IconChild as Child };
export default IconRoot;
