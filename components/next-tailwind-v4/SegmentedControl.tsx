"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./lib/utils";

/** Assigns a node to several refs (object or callback). */
function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
        }
    };
}

/*
 * SegmentedControl — a single-select control built on Radix Tabs (keyboard: arrows, Home, End).
 *
 * Semantics depend on how it is used:
 * - Without `SegmentedControl.Content` it is a choice between options, exposed as a radio group
 *   (role="radiogroup" / role="radio" + aria-checked). Give the List an accessible name (aria-label).
 * - With `SegmentedControl.Content` panels it is a set of tabs (tablist / tab / tabpanel), and each
 *   trigger's aria-controls references its mounted panel.
 */

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface SegmentedControlContextValue {
    value: string;
    /** "radio" until a Content panel is rendered, then "tabs". */
    mode: "radio" | "tabs";
    panels: ReadonlySet<string>;
    registerPanel: (value: string) => () => void;
}

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null);

// =========== Root ===========
export type SegmentedControlRootProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

const SegmentedControlRoot = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, SegmentedControlRootProps>(
    ({ className, value: valueProp, defaultValue, onValueChange, ...props }, ref) => {
        const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "");
        const isControlled = valueProp !== undefined;
        const value = isControlled ? valueProp : uncontrolledValue;

        const handleValueChange = React.useCallback(
            (next: string) => {
                if (!isControlled) setUncontrolledValue(next);
                onValueChange?.(next);
            },
            [isControlled, onValueChange]
        );

        const [panels, setPanels] = React.useState<ReadonlySet<string>>(() => new Set());
        const registerPanel = React.useCallback((panelValue: string) => {
            setPanels((previous) => (previous.has(panelValue) ? previous : new Set(previous).add(panelValue)));
            return () =>
                setPanels((previous) => {
                    if (!previous.has(panelValue)) return previous;
                    const next = new Set(previous);
                    next.delete(panelValue);
                    return next;
                });
        }, []);

        const contextValue = React.useMemo<SegmentedControlContextValue>(
            () => ({ value, mode: panels.size > 0 ? "tabs" : "radio", panels, registerPanel }),
            [value, panels, registerPanel]
        );

        return (
            <SegmentedControlContext.Provider value={contextValue}>
                <TabsPrimitive.Root ref={ref} value={value} onValueChange={handleValueChange} className={cn("w-full", className)} {...props} />
            </SegmentedControlContext.Provider>
        );
    }
);
SegmentedControlRoot.displayName = "SegmentedControl.Root";

// =========== Indicator measurement ===========
function useActiveIndicator(value: string | undefined) {
    const [mounted, setMounted] = React.useState(false);
    const [lineStyle, setLineStyle] = React.useState({ width: 0, left: 0 });
    const listRef = React.useRef<HTMLDivElement | null>(null);

    const updateActiveTab = React.useCallback(() => {
        const list = listRef.current;
        if (!list) return;
        const activeTab = list.querySelector<HTMLElement>('[data-segment][data-state="active"]');
        if (!activeTab) return;
        const { offsetWidth: width, offsetLeft: left } = activeTab;
        setLineStyle((previous) => (previous.width === width && previous.left === left ? previous : { width, left }));
    }, []);

    // Re-measure when the selection changes.
    useIsomorphicLayoutEffect(() => {
        updateActiveTab();
    }, [value, updateActiveTab]);

    // Re-measure when the list or any segment changes size (window resize, font load, label change)
    // and when the active state changes outside our context.
    React.useEffect(() => {
        setMounted(true);
        const list = listRef.current;
        if (!list) return;

        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateActiveTab) : null;
        if (resizeObserver) {
            resizeObserver.observe(list);
            list.querySelectorAll("[data-segment]").forEach((segment) => resizeObserver.observe(segment));
        }

        const mutationObserver = new MutationObserver(updateActiveTab);
        mutationObserver.observe(list, { attributes: true, subtree: true, childList: true, attributeFilter: ["data-state"] });

        updateActiveTab();

        return () => {
            resizeObserver?.disconnect();
            mutationObserver.disconnect();
        };
    }, [updateActiveTab]);

    return { mounted, listRef, lineStyle };
}

// =========== List ===========
export interface SegmentedControlListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
    /** Classes for the sliding indicator behind the active segment. */
    indicatorClassName?: string;
}

const SegmentedControlList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, SegmentedControlListProps>(({ children, className, indicatorClassName, ...rest }, forwardedRef) => {
    const context = React.useContext(SegmentedControlContext);
    const { mounted, listRef, lineStyle } = useActiveIndicator(context?.value);
    const combinedRef = React.useMemo(() => composeRefs(forwardedRef, listRef), [forwardedRef, listRef]);
    const roleProps = context?.mode === "radio" ? { role: "radiogroup" } : {};

    return (
        <TabsPrimitive.List
            ref={combinedRef}
            className={cn("relative isolate grid w-full auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted/80 p-1", className)}
            {...roleProps}
            {...rest}
        >
            {children}

            {/* Floating background */}
            <div
                className={cn(
                    "absolute inset-y-1 left-0 -z-10 rounded-md bg-surface shadow-xs transition-transform duration-slow ck-dark:bg-border",
                    {
                        hidden: !mounted,
                    },
                    indicatorClassName
                )}
                style={{
                    transform: `translate3d(${lineStyle.left}px, 0, 0)`,
                    width: `${lineStyle.width}px`,
                    transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
                }}
                aria-hidden="true"
                data-slot="indicator"
            />
        </TabsPrimitive.List>
    );
});
SegmentedControlList.displayName = "SegmentedControl.List";

// =========== Trigger ===========
type SemanticProps = { role?: "radio"; "aria-checked"?: boolean; "aria-selected"?: undefined; "aria-controls"?: undefined };

export type SegmentedControlTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

const SegmentedControlTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, SegmentedControlTriggerProps>(({ className, value, ...rest }, forwardedRef) => {
    const context = React.useContext(SegmentedControlContext);

    let semanticProps: SemanticProps = {};
    if (context?.mode === "radio") {
        semanticProps = { role: "radio", "aria-checked": context.value === value, "aria-selected": undefined, "aria-controls": undefined };
    } else if (context && !context.panels.has(value)) {
        semanticProps = { "aria-controls": undefined };
    }

    return (
        <TabsPrimitive.Trigger
            ref={forwardedRef}
            value={value}
            data-segment=""
            className={cn(
                // base
                "peer relative z-10 whitespace-nowrap rounded-md p-1 size-p-sm text-muted-foreground",
                "flex items-center justify-center gap-1.5",
                "transition duration-slow ease-out",
                // hover
                "hover:text-foreground",
                // focus: drawn inside the segment so it does not overlap its neighbours
                "focus-ring-inset",
                // active
                "data-[state=active]:text-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...semanticProps}
            {...rest}
        />
    );
});
SegmentedControlTrigger.displayName = "SegmentedControl.Trigger";

// =========== Content ===========
export type SegmentedControlContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

/** Optional panel. Rendering any Content switches the control to tabs semantics. */
const SegmentedControlContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, SegmentedControlContentProps>(({ className, value, ...rest }, forwardedRef) => {
    const registerPanel = React.useContext(SegmentedControlContext)?.registerPanel;
    useIsomorphicLayoutEffect(() => registerPanel?.(value), [registerPanel, value]);

    return <TabsPrimitive.Content ref={forwardedRef} value={value} className={cn("rounded-md focus-ring", className)} {...rest} />;
});
SegmentedControlContent.displayName = "SegmentedControl.Content";

// Compound component pattern
const SegmentedControl = {
    Root: SegmentedControlRoot,
    List: SegmentedControlList,
    Trigger: SegmentedControlTrigger,
    Content: SegmentedControlContent,
};

export { SegmentedControl, SegmentedControlRoot as Root, SegmentedControlList as List, SegmentedControlTrigger as Trigger, SegmentedControlContent as Content };
