"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Slottable } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import { usePortalContainer } from "./ThemeScope";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Open state that works both controlled (`open` + `onOpenChange`) and uncontrolled (`defaultOpen`). */
function useControllableOpen(open: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
    const isControlled = open !== undefined;
    const value = isControlled ? open : uncontrolledOpen;

    const latest = React.useRef({ value, isControlled, onOpenChange });
    useIsomorphicLayoutEffect(() => {
        latest.current = { value, isControlled, onOpenChange };
    });

    const setOpen = React.useCallback((next: boolean) => {
        const current = latest.current;
        if (next === current.value) return;
        if (!current.isControlled) setUncontrolledOpen(next);
        current.onOpenChange?.(next);
    }, []);

    return [value, setOpen] as const;
}

/** Calls the consumer handler first; ours runs unless the consumer prevented the default. */
function composeHandlers<E extends { defaultPrevented: boolean }>(theirs: ((event: E) => void) | undefined, ours: ((event: E) => void) | undefined) {
    if (!ours) return theirs;
    return (event: E) => {
        theirs?.(event);
        if (!event.defaultPrevented) ours(event);
    };
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
    if (typeof ref === "function") ref(value);
    else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ---------------------------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------------------------

export type PopoverSize = "sm" | "md" | "lg";
/** @deprecated Use `sm` / `md` / `lg`. */
type LegacyPopoverSize = "small" | "medium" | "large";

const LEGACY_SIZES: Record<LegacyPopoverSize, PopoverSize> = { small: "sm", medium: "md", large: "lg" };

export function resolvePopoverSize(size?: PopoverSize | LegacyPopoverSize | null): PopoverSize {
    if (!size) return "md";
    return size in LEGACY_SIZES ? LEGACY_SIZES[size as LegacyPopoverSize] : (size as PopoverSize);
}

// `md` keeps the original look. The footer bleeds to the panel edges, so its offsets follow the padding.
const sizeStyles: Record<PopoverSize, { content: string; bodyWithFooter: string; footer: string }> = {
    sm: { content: "p-3 size-p-xs", bodyWithFooter: "mb-3", footer: "-mx-3 -mb-3 mt-3 px-3 py-3" },
    md: { content: "p-5 size-p-xs", bodyWithFooter: "mb-5", footer: "-mx-5 -mb-5 mt-5 px-5 py-4" },
    lg: { content: "p-6 size-p-sm", bodyWithFooter: "mb-6", footer: "-mx-6 -mb-6 mt-6 px-6 py-4" },
};

// ---------------------------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------------------------

type OpenReason = "click" | "hover" | "focus";

interface PopoverRootContextValue {
    triggerMode: "click" | "hover";
    contentRef: React.MutableRefObject<HTMLDivElement | null>;
    onTriggerPointerEnter: (event: React.PointerEvent) => void;
    onTriggerPointerLeave: (event: React.PointerEvent) => void;
    onTriggerFocus: () => void;
    onTriggerBlur: (event: React.FocusEvent) => void;
    onTriggerClick: (event: React.MouseEvent) => void;
    onContentPointerEnter: (event: React.PointerEvent) => void;
    onContentPointerLeave: (event: React.PointerEvent) => void;
    onContentFocus: () => void;
    onContentOpenAutoFocus: (event: Event) => void;
    onContentCloseAutoFocus: (event: Event) => void;
}

const PopoverRootContext = React.createContext<PopoverRootContextValue | null>(null);

const PopoverContext = React.createContext<{
    hasFooter: boolean;
    setHasFooter: React.Dispatch<React.SetStateAction<boolean>>;
    size: PopoverSize;
} | null>(null);

// ---------------------------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------------------------

export interface RootProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
    /**
     * `click` (default): the trigger toggles the popover and focus moves into it.
     * `hover`: opens on mouse hover and on keyboard focus of the trigger without moving focus;
     * clicking (or Enter/Space on) the trigger moves focus into the popover.
     */
    triggerMode?: "click" | "hover";
    /** Delay in ms before opening/closing on mouse hover (hover mode). @default 200 */
    hoverDelay?: number;
}

/** Works controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`) in both trigger modes. */
const Root = ({ children, triggerMode = "click", hoverDelay = 200, open: openProp, defaultOpen, onOpenChange, modal }: RootProps) => {
    const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);

    const openRef = React.useRef(open);
    useIsomorphicLayoutEffect(() => {
        openRef.current = open;
    });

    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const openReasonRef = React.useRef<OpenReason>("click");
    const focusInsideRef = React.useRef(false);
    const ignoreNextFocusRef = React.useRef(false);

    const clearTimer = React.useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
    }, []);
    React.useEffect(() => clearTimer, [clearTimer]);

    const show = React.useCallback(
        (reason: OpenReason) => {
            clearTimer();
            if (openRef.current) return;
            openReasonRef.current = reason;
            focusInsideRef.current = false;
            setOpen(true);
        },
        [clearTimer, setOpen]
    );

    const hide = React.useCallback(() => {
        clearTimer();
        setOpen(false);
    }, [clearTimer, setOpen]);

    // Changes coming from Radix: trigger click (click mode), Escape, outside interaction, Popover.Close.
    const handleOpenChange = React.useCallback(
        (next: boolean) => {
            if (next) show("click");
            else hide();
        },
        [show, hide]
    );

    const context = React.useMemo<PopoverRootContextValue>(() => {
        const scheduleShow = () => {
            clearTimer();
            if (openRef.current) return;
            timerRef.current = setTimeout(() => show("hover"), hoverDelay);
        };
        const scheduleHide = () => {
            clearTimer();
            timerRef.current = setTimeout(hide, hoverDelay);
        };
        const focusContent = () => {
            const content = contentRef.current;
            if (!content) return;
            const target = content.querySelector<HTMLElement>(TABBABLE) ?? content;
            target.focus();
        };

        return {
            triggerMode,
            contentRef,
            onTriggerPointerEnter: (event) => {
                if (event.pointerType === "mouse") scheduleShow();
            },
            onTriggerPointerLeave: (event) => {
                if (event.pointerType === "mouse") scheduleHide();
            },
            onTriggerFocus: () => {
                if (ignoreNextFocusRef.current) {
                    ignoreNextFocusRef.current = false;
                    return;
                }
                show("focus");
            },
            onTriggerBlur: (event) => {
                const next = event.relatedTarget as Node | null;
                if (next && contentRef.current?.contains(next)) return;
                hide();
            },
            onTriggerClick: (event) => {
                // Replace Radix's toggle: open (focus moves in) or, when already open, move focus into the content.
                event.preventDefault();
                if (openRef.current) focusContent();
                else show("click");
            },
            onContentPointerEnter: (event) => {
                if (event.pointerType === "mouse") clearTimer();
            },
            onContentPointerLeave: (event) => {
                if (event.pointerType === "mouse") scheduleHide();
            },
            onContentFocus: () => {
                focusInsideRef.current = true;
            },
            onContentOpenAutoFocus: (event) => {
                // Opened by hover or keyboard focus: keep focus where it is.
                if (triggerMode === "hover" && openReasonRef.current !== "click") event.preventDefault();
            },
            onContentCloseAutoFocus: (event) => {
                if (triggerMode !== "hover") return;
                if (!focusInsideRef.current) {
                    // Focus never entered the popover: do not move it.
                    event.preventDefault();
                    return;
                }
                // Radix returns focus to the trigger; that focus must not reopen the popover.
                ignoreNextFocusRef.current = true;
                setTimeout(() => {
                    ignoreNextFocusRef.current = false;
                }, 0);
            },
        };
    }, [triggerMode, hoverDelay, clearTimer, show, hide]);

    return (
        <PopoverRootContext.Provider value={context}>
            <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={modal}>
                {children}
            </PopoverPrimitive.Root>
        </PopoverRootContext.Provider>
    );
};
Root.displayName = "Popover.Root";

// ---------------------------------------------------------------------------------------------
// Trigger / Anchor
// ---------------------------------------------------------------------------------------------

const Trigger = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>>(
    ({ onPointerEnter, onPointerLeave, onFocus, onBlur, onClick, ...props }, ref) => {
        const root = React.useContext(PopoverRootContext);
        const hover = root?.triggerMode === "hover" ? root : null;

        return (
            <PopoverPrimitive.Trigger
                ref={ref}
                {...props}
                onPointerEnter={composeHandlers(onPointerEnter, hover?.onTriggerPointerEnter)}
                onPointerLeave={composeHandlers(onPointerLeave, hover?.onTriggerPointerLeave)}
                onFocus={composeHandlers(onFocus, hover?.onTriggerFocus)}
                onBlur={composeHandlers(onBlur, hover?.onTriggerBlur)}
                onClick={composeHandlers(onClick, hover?.onTriggerClick)}
            />
        );
    }
);
Trigger.displayName = "Popover.Trigger";

const Anchor = PopoverPrimitive.Anchor;

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

type PopoverPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "left" | "right";
type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

const PLACEMENT_BY_POSITION: Record<PopoverPosition, { side: Side; align: Align }> = {
    "top-left": { side: "top", align: "start" },
    "top-center": { side: "top", align: "center" },
    "top-right": { side: "top", align: "end" },
    "bottom-left": { side: "bottom", align: "start" },
    "bottom-center": { side: "bottom", align: "center" },
    "bottom-right": { side: "bottom", align: "end" },
    left: { side: "left", align: "center" },
    right: { side: "right", align: "center" },
};

const ANIMATION_CLASSES: Record<"fade" | "scale" | "slide", string> = {
    fade: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    scale: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    slide: [
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[side=bottom]:data-[state=open]:slide-in-from-top-2 data-[side=bottom]:data-[state=closed]:slide-out-to-top-2",
        "data-[side=left]:data-[state=open]:slide-in-from-right-2 data-[side=left]:data-[state=closed]:slide-out-to-right-2",
        "data-[side=right]:data-[state=open]:slide-in-from-left-2 data-[side=right]:data-[state=closed]:slide-out-to-left-2",
        "data-[side=top]:data-[state=open]:slide-in-from-bottom-2 data-[side=top]:data-[state=closed]:slide-out-to-bottom-2",
    ].join(" "),
};

export interface ContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
    showArrow?: boolean;
    /** Removes the default surface, padding and typography. */
    unstyled?: boolean;
    animation?: "fade" | "scale" | "slide";
    /** Padding and text size. `small` / `medium` / `large` are deprecated aliases. @default "md" */
    size?: PopoverSize | LegacyPopoverSize;
    /** Placement shorthand. Explicit `side` / `align` props take precedence. @default "top-center" */
    position?: PopoverPosition;
}

/** The popover panel (`role="dialog"`); `className` goes on it. */
const Content = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, ContentProps>(
    (
        {
            children,
            className,
            side: sideProp,
            align: alignProp,
            sideOffset = 12,
            collisionPadding = 12,
            arrowPadding = 12,
            showArrow = true,
            unstyled,
            animation = "scale",
            size,
            position = "top-center",
            onOpenAutoFocus,
            onCloseAutoFocus,
            onPointerEnter,
            onPointerLeave,
            onFocus,
            ...props
        },
        forwardedRef
    ) => {
        const root = React.useContext(PopoverRootContext);
        const [hasFooter, setHasFooter] = React.useState(false);
        const resolvedSize = resolvePopoverSize(size);
        const placement = PLACEMENT_BY_POSITION[position];
        const hover = root?.triggerMode === "hover" ? root : null;

        const ref = React.useCallback(
            (node: HTMLDivElement | null) => {
                if (root) root.contentRef.current = node;
                setRef(forwardedRef, node);
            },
            [root, forwardedRef]
        );

        const contextValue = React.useMemo(() => ({ hasFooter, setHasFooter, size: resolvedSize }), [hasFooter, resolvedSize]);
        const container = usePortalContainer();

        return (
            <PopoverContext.Provider value={contextValue}>
                <PopoverPrimitive.Portal container={container}>
                    <PopoverPrimitive.Content
                        ref={ref}
                        side={sideProp ?? placement.side}
                        align={alignProp ?? placement.align}
                        sideOffset={sideOffset}
                        collisionPadding={collisionPadding}
                        arrowPadding={arrowPadding}
                        onOpenAutoFocus={composeHandlers(onOpenAutoFocus, root?.onContentOpenAutoFocus)}
                        onCloseAutoFocus={composeHandlers(onCloseAutoFocus, root?.onContentCloseAutoFocus)}
                        onPointerEnter={composeHandlers(onPointerEnter, hover?.onContentPointerEnter)}
                        onPointerLeave={composeHandlers(onPointerLeave, hover?.onContentPointerLeave)}
                        onFocus={composeHandlers(onFocus, root?.onContentFocus)}
                        className={cn(
                            "z-popover",
                            !unstyled && ["w-max rounded-2xl bg-background text-foreground shadow-medium ring-1 ring-border", sizeStyles[resolvedSize].content],
                            ANIMATION_CLASSES[animation],
                            // The footer bleeds to the bottom edge.
                            hasFooter && !unstyled && "pb-0",
                            className
                        )}
                        {...props}
                    >
                        <div className={cn(hasFooter && !unstyled && sizeStyles[resolvedSize].bodyWithFooter)}>
                            <Slottable>{children}</Slottable>
                        </div>

                        {showArrow && (
                            <PopoverPrimitive.Arrow asChild>
                                <div className="size-[11px] -translate-y-[calc(50%)] -rotate-45 rounded-bl-[3px] border border-border bg-background [clip-path:polygon(0_100%,0_0,100%_100%)]"></div>
                            </PopoverPrimitive.Arrow>
                        )}
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverContext.Provider>
        );
    }
);
Content.displayName = "Popover.Content";

// ---------------------------------------------------------------------------------------------
// Close / Footer
// ---------------------------------------------------------------------------------------------

const Close = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Close>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close> & {
        unstyled?: boolean;
    }
>(({ className, unstyled, ...props }, forwardedRef) => (
    <PopoverPrimitive.Close ref={forwardedRef} className={cn(!unstyled && "absolute right-4 top-4 rounded-lg focus-ring", className)} {...props} />
));
Close.displayName = "Popover.Close";

type FooterProps = React.HTMLAttributes<HTMLDivElement>;

const Footer = React.forwardRef<HTMLDivElement, FooterProps>(({ className, children, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    const setHasFooter = context?.setHasFooter;
    const size = context?.size ?? "md";

    useIsomorphicLayoutEffect(() => {
        if (!setHasFooter) return;
        setHasFooter(true);
        return () => setHasFooter(false);
    }, [setHasFooter]);

    return (
        <div ref={ref} className={cn("flex items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-muted", sizeStyles[size].footer, className)} {...props}>
            {children}
        </div>
    );
});
Footer.displayName = "Popover.Footer";

export { Root, Anchor, Trigger, Content, Close, Footer };
