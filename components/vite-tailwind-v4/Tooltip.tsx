"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slottable } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import { usePortalContainer } from "./ThemeScope";

const DEFAULT_DELAY_DURATION = 200;
const DEFAULT_SKIP_DELAY_DURATION = 300;

// Tracks whether a Tooltip.Provider is above, so standalone Roots can create their own.
const TooltipProviderContext = React.createContext(false);

export type ProviderProps = TooltipPrimitive.TooltipProviderProps;

/**
 * Shares delay settings between tooltips. Wrap a region (or the app) once so moving between tooltips skips the
 * open delay (`skipDelayDuration`). Defaults match standalone tooltips: `delayDuration` 200ms, `skipDelayDuration` 300ms.
 */
const Provider = ({ children, delayDuration = DEFAULT_DELAY_DURATION, skipDelayDuration = DEFAULT_SKIP_DELAY_DURATION, ...props }: ProviderProps) => {
    return (
        <TooltipProviderContext.Provider value={true}>
            <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props}>
                {children}
            </TooltipPrimitive.Provider>
        </TooltipProviderContext.Provider>
    );
};
Provider.displayName = "Tooltip.Provider";

export interface RootProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
    /** Open delay in ms. Inside a `Tooltip.Provider` it defaults to the Provider's value; otherwise 200. */
    delayDuration?: number;
    /**
     * Skip-delay window in ms for a Root used without `Tooltip.Provider` (reopening within it is instant). @default 300
     * Inside a Provider this prop is ignored; set it on the Provider instead.
     */
    skipDelayDuration?: number;
}

/** Works inside a shared `Tooltip.Provider` or standalone (it then creates its own Provider). */
const Root = ({ children, delayDuration, skipDelayDuration, ...props }: RootProps) => {
    const hasProvider = React.useContext(TooltipProviderContext);

    if (hasProvider) {
        return (
            <TooltipPrimitive.Root delayDuration={delayDuration} {...props}>
                {children}
            </TooltipPrimitive.Root>
        );
    }

    return (
        <Provider delayDuration={delayDuration ?? DEFAULT_DELAY_DURATION} skipDelayDuration={skipDelayDuration ?? DEFAULT_SKIP_DELAY_DURATION}>
            <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
        </Provider>
    );
};
Root.displayName = "Tooltip.Root";

/** The element the tooltip describes. It must be focusable (use `asChild` with a button or link) so keyboard users get the tooltip too. */
const Trigger = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>>((props, ref) => (
    <TooltipPrimitive.Trigger ref={ref} {...props} />
));
Trigger.displayName = "Tooltip.Trigger";

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

export type TooltipSize = "sm" | "md" | "lg";
/** @deprecated Use `sm` / `md` / `lg`. */
type LegacyTooltipSize = "small" | "medium" | "large";

const LEGACY_SIZES: Record<LegacyTooltipSize, TooltipSize> = { small: "sm", medium: "md", large: "lg" };

export function resolveTooltipSize(size?: TooltipSize | LegacyTooltipSize | null): TooltipSize {
    if (!size) return "md";
    return size in LEGACY_SIZES ? LEGACY_SIZES[size as LegacyTooltipSize] : (size as TooltipSize);
}

const sizeClasses: Record<TooltipSize, string> = {
    sm: "px-2 py-1 size-p-xs rounded-md",
    md: "px-3 py-1.5 size-p-sm rounded-md",
    lg: "px-4 py-3 size-p-sm rounded-xl",
};

type TooltipPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "left" | "right";
type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

const PLACEMENT_BY_POSITION: Record<TooltipPosition, { side: Side; align: Align }> = {
    "top-left": { side: "top", align: "start" },
    "top-center": { side: "top", align: "center" },
    "top-right": { side: "top", align: "end" },
    "bottom-left": { side: "bottom", align: "start" },
    "bottom-center": { side: "bottom", align: "center" },
    "bottom-right": { side: "bottom", align: "end" },
    left: { side: "left", align: "center" },
    right: { side: "right", align: "center" },
};

// Enter animation runs on mount for both "delayed-open" and "instant-open"; exit runs on "closed".
const BASE_ANIMATION = "animate-in fade-in-0 duration-fast data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

const ANIMATION_CLASSES: Record<"fade" | "scale" | "slide", string> = {
    fade: BASE_ANIMATION,
    scale: [BASE_ANIMATION, "zoom-in-95 data-[state=closed]:zoom-out-95"].join(" "),
    slide: [
        BASE_ANIMATION,
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:data-[state=closed]:slide-out-to-top-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=left]:data-[state=closed]:slide-out-to-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:data-[state=closed]:slide-out-to-left-2",
        "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:data-[state=closed]:slide-out-to-bottom-2",
    ].join(" "),
};

export interface ContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
    showArrow?: boolean;
    /** Removes the default surface, padding and typography. */
    unstyled?: boolean;
    animation?: "fade" | "scale" | "slide";
    /** Padding and text size. `small` / `medium` / `large` are deprecated aliases. @default "md" */
    size?: TooltipSize | LegacyTooltipSize;
    /** Placement shorthand. Explicit `side` / `align` props take precedence. @default "top-center" */
    position?: TooltipPosition;
}

/** The tooltip bubble; `className` goes on it. Radix links it to the trigger with `role="tooltip"` + `aria-describedby`. */
const Content = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, ContentProps>(
    (
        {
            children,
            className,
            side: sideProp,
            align: alignProp,
            sideOffset = 6,
            collisionPadding = 12,
            arrowPadding = 12,
            showArrow = true,
            unstyled,
            animation = "slide",
            size,
            position = "top-center",
            ...props
        },
        forwardedRef
    ) => {
        const placement = PLACEMENT_BY_POSITION[position];
        const container = usePortalContainer();

        return (
            <TooltipPrimitive.Portal container={container}>
                <TooltipPrimitive.Content
                    ref={forwardedRef}
                    side={sideProp ?? placement.side}
                    align={alignProp ?? placement.align}
                    sideOffset={sideOffset}
                    collisionPadding={collisionPadding}
                    arrowPadding={arrowPadding}
                    className={cn(
                        "z-tooltip",
                        !unstyled && ["w-max max-w-xs bg-background text-foreground shadow-medium ring-1 ring-border", sizeClasses[resolveTooltipSize(size)]],
                        ANIMATION_CLASSES[animation],
                        className
                    )}
                    {...props}
                >
                    <Slottable>{children}</Slottable>

                    {showArrow && (
                        <TooltipPrimitive.Arrow asChild>
                            <div className="block size-[11px] -translate-y-[calc(50%)] -rotate-45 rounded-bl-[3px] border border-border bg-background [clip-path:polygon(0_100%,0_0,100%_100%)]"></div>
                        </TooltipPrimitive.Arrow>
                    )}
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        );
    }
);
Content.displayName = "Tooltip.Content";

export { Provider, Root, Trigger, Content };
