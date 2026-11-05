import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so LegendIndicator can be rendered from server components.

/** Decorative palette (an explicit palette API, see CONVENTIONS.md). */
export type LegendIndicatorColor = "neutral" | "gray" | "blue" | "indigo" | "orange" | "red" | "green" | "yellow" | "purple" | "pink" | "teal";
export type LegendIndicatorSize = "sm" | "md" | "lg";
/** @deprecated Use `sm` / `md` / `lg`. */
type LegacyLegendIndicatorSize = "small" | "medium" | "large";

const LEGACY_SIZES: Record<LegacyLegendIndicatorSize, LegendIndicatorSize> = { small: "sm", medium: "md", large: "lg" };

const SIZE_STYLES: Record<LegendIndicatorSize, string> = {
    sm: "size-2 border-[1.5px]",
    md: "size-3 border-2",
    lg: "size-4 border-[3px]",
};

const COLOR_STYLES: Record<LegendIndicatorColor, string> = {
    neutral: "bg-neutral-500 ck-dark:bg-neutral-400",
    gray: "bg-gray-500 ck-dark:bg-gray-400",
    blue: "bg-blue-500 ck-dark:bg-blue-500",
    indigo: "bg-indigo-500 ck-dark:bg-indigo-500",
    orange: "bg-orange-500 ck-dark:bg-orange-500",
    red: "bg-red-500 ck-dark:bg-red-500",
    green: "bg-green-500 ck-dark:bg-green-500",
    yellow: "bg-yellow-500 ck-dark:bg-yellow-500",
    purple: "bg-purple-500 ck-dark:bg-purple-500",
    pink: "bg-pink-500 ck-dark:bg-pink-500",
    teal: "bg-teal-500 ck-dark:bg-teal-500",
};

const hasKey = <T extends object>(record: T, key: string): key is Extract<keyof T, string> => Object.prototype.hasOwnProperty.call(record, key);

export function resolveLegendIndicatorSize(size?: LegendIndicatorSize | LegacyLegendIndicatorSize | null): LegendIndicatorSize {
    if (!size) return "md";
    if (hasKey(LEGACY_SIZES, size)) return LEGACY_SIZES[size];
    return hasKey(SIZE_STYLES, size) ? size : "md";
}

export interface LegendIndicatorRootProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
    /** Render the single child element instead of a <span>, merging the indicator's props onto it. */
    asChild?: boolean;
    color?: LegendIndicatorColor;
    /** @deprecated Use `color`. */
    variant?: LegendIndicatorColor;
    size?: LegendIndicatorSize | LegacyLegendIndicatorSize;
    /**
     * Accessible name, e.g. `label="Revenue"` or `label="Premium member"`. With a name the indicator is exposed as an
     * image (`role="img"`); without one it is decorative (`aria-hidden`, unless `asChild`) and must sit next to visible
     * text, because colour alone does not convey meaning.
     */
    label?: string;
}

/** A coloured dot. Children (e.g. a small icon) are centred inside it. `className` applies to the dot. */
const LegendIndicatorRoot = React.forwardRef<HTMLSpanElement, LegendIndicatorRootProps>(({ asChild = false, className, color, variant, size, label, children, ...props }, ref) => {
    const resolvedColor = color ?? variant ?? "gray";
    const resolvedSize = resolveLegendIndicatorSize(size);
    const labelled = Boolean(label) || props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
    // With asChild the child element owns its semantics (it may be a focusable control).
    const decorative = !asChild && !labelled;
    const Component = asChild ? Slot : "span";

    return (
        <Component
            ref={ref}
            role={labelled ? "img" : undefined}
            aria-label={label || undefined}
            aria-hidden={decorative || undefined}
            data-size={resolvedSize}
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full border-white text-white shadow-sm ck-dark:border-neutral-800",
                SIZE_STYLES[resolvedSize],
                COLOR_STYLES[resolvedColor] ?? COLOR_STYLES.gray,
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
});
LegendIndicatorRoot.displayName = "LegendIndicator.Root";

export { LegendIndicatorRoot as Root };
