"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import mergeRefs from "merge-refs";
import { RiArrowRightSLine } from "react-icons/ri";

import { cn } from "./lib/utils";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

// =========== Panel registry ===========
// Triggers only reference a panel (aria-controls) when a matching Content is rendered,
// so tabs used without panels do not point at elements that do not exist.
interface PanelRegistry {
    panels: ReadonlySet<string>;
    register: (value: string) => () => void;
}

const PanelRegistryContext = React.createContext<PanelRegistry | null>(null);

function usePanelRegistry(): PanelRegistry {
    const [panels, setPanels] = React.useState<ReadonlySet<string>>(() => new Set());
    const register = React.useCallback((value: string) => {
        setPanels((previous) => (previous.has(value) ? previous : new Set(previous).add(value)));
        return () =>
            setPanels((previous) => {
                if (!previous.has(value)) return previous;
                const next = new Set(previous);
                next.delete(value);
                return next;
            });
    }, []);
    return React.useMemo(() => ({ panels, register }), [panels, register]);
}

// =========== Selected-tab tracking ===========
// Root mirrors the selected value (controlled or not) and each Trigger registers its element under its value, so the
// List places its underline from React state instead of searching the DOM for the active tab.
interface TabsState {
    selected: string | undefined;
    triggers: React.RefObject<Map<string, HTMLElement>>;
    /** Changes whenever a trigger mounts, unmounts or changes value. */
    revision: number;
    registerTrigger: (value: string, node: HTMLElement) => () => void;
}

const TabsStateContext = React.createContext<TabsState | null>(null);

function useTabsState(selected: string | undefined): TabsState {
    const triggers = React.useRef(new Map<string, HTMLElement>());
    const [revision, setRevision] = React.useState(0);
    const registerTrigger = React.useCallback((value: string, node: HTMLElement) => {
        triggers.current.set(value, node);
        setRevision((count) => count + 1);
        return () => {
            if (triggers.current.get(value) === node) triggers.current.delete(value);
            setRevision((count) => count + 1);
        };
    }, []);
    return React.useMemo(() => ({ selected, triggers, revision, registerTrigger }), [selected, revision, registerTrigger]);
}

interface UnderlineBox {
    left: number;
    width: number;
}

const sameBox = (a: UnderlineBox | null, b: UnderlineBox | null) => a === b || (!!a && !!b && a.left === b.left && a.width === b.width);

/** The tab's position inside the list from layout offsets, which (unlike client rects) ignore scaled previews. */
function boxInList(list: HTMLElement, tab: HTMLElement): UnderlineBox {
    let left = 0;
    for (let node: HTMLElement | null = tab; node && node !== list; node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null) {
        left += node.offsetLeft;
    }
    return { left, width: tab.offsetWidth };
}

const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// =========== Icon rendering ===========
type IconElementProps = React.HTMLAttributes<Element> & { ref?: React.Ref<Element> };

const isComponentType = (value: unknown): value is React.ElementType =>
    typeof value === "function" || (typeof value === "object" && value !== null && "$$typeof" in value && !React.isValidElement(value));

/** Renders an icon passed as an element (`as={<Icon />}`), a component (`as={Icon}`) or as children, merging classes and the ref. */
function renderIcon(source: React.ReactNode | React.ElementType, iconClassName: string, ref: React.ForwardedRef<Element>, props: React.HTMLAttributes<Element>) {
    if (React.isValidElement<IconElementProps>(source)) {
        return React.cloneElement(source, {
            "aria-hidden": true,
            ...props,
            className: cn(iconClassName, source.props.className),
            ref: mergeRefs(source.props.ref, ref),
        });
    }
    if (isComponentType(source)) {
        const Component = source;
        return <Component ref={ref} aria-hidden="true" {...props} className={iconClassName} />;
    }
    return source ?? null;
}

// =========== Component Interfaces ===========
export type TabsHorizontalRootProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

export interface TabsHorizontalListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
    /** Classes for the horizontally scrollable wrapper around the list. */
    wrapperClassName?: string;
}

export interface TabsHorizontalTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
    /** Appends `TabsHorizontal.Arrow` after the label (ignored with `asChild`). */
    arrow?: boolean;
}

export interface TabsHorizontalIconProps extends React.HTMLAttributes<HTMLElement> {
    /** Icon element (`as={<RiUserLine />}`) or component (`as={RiUserLine}`). Falls back to `children`. */
    as?: React.ElementType | React.ReactNode;
}

// =========== Component Implementations ===========

const TabsHorizontalRoot = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsHorizontalRootProps>(
    ({ className, value, defaultValue, onValueChange, ...props }, ref) => {
        const registry = usePanelRegistry();
        // Radix still owns the selection; this copy only tells the List which trigger to underline.
        const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
        const handleValueChange = React.useCallback(
            (next: string) => {
                setUncontrolledValue(next);
                onValueChange?.(next);
            },
            [onValueChange]
        );
        const tabs = useTabsState(value ?? uncontrolledValue);

        return (
            <PanelRegistryContext.Provider value={registry}>
                <TabsStateContext.Provider value={tabs}>
                    <TabsPrimitive.Root
                        ref={ref}
                        orientation="horizontal"
                        className={cn("w-full", className)}
                        value={value}
                        defaultValue={defaultValue}
                        onValueChange={handleValueChange}
                        {...props}
                    />
                </TabsStateContext.Provider>
            </PanelRegistryContext.Provider>
        );
    }
);
TabsHorizontalRoot.displayName = "TabsHorizontal.Root";

// The wrapper only scrolls; the Radix List is the single element with role="tablist".
const TabsHorizontalList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsHorizontalListProps>(({ children, className, wrapperClassName, ...props }, forwardedRef) => {
    const tabs = React.useContext(TabsStateContext);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const listRef = React.useRef<HTMLDivElement | null>(null);
    const listRefs = React.useMemo(() => mergeRefs(forwardedRef, listRef), [forwardedRef]);
    const [underline, setUnderline] = React.useState<UnderlineBox | null>(null);
    const placed = React.useRef<UnderlineBox | null>(null);

    const selected = tabs?.selected;
    const triggers = tabs?.triggers;
    const revision = tabs?.revision;

    useIsomorphicLayoutEffect(() => {
        const list = listRef.current;
        if (!list || !triggers) return;

        const place = () => {
            const tab = selected === undefined ? undefined : triggers.current.get(selected);
            const box = tab && list.contains(tab) ? boxInList(list, tab) : null;
            if (sameBox(box, placed.current)) return;
            placed.current = box;
            setUnderline(box);

            // Keep the selected tab in the middle of a scrolling list (smooth unless reduced motion is preferred).
            const wrapper = wrapperRef.current;
            if (box && wrapper && wrapper.scrollWidth > wrapper.clientWidth && typeof wrapper.scrollTo === "function") {
                const middle = list.offsetLeft + box.left + box.width / 2;
                wrapper.scrollTo({ left: middle - wrapper.clientWidth / 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            }
        };

        place();
        if (typeof ResizeObserver === "undefined") return;
        // One observer for the list and every trigger: a size change of any of them can move the selected tab.
        const observer = new ResizeObserver(place);
        observer.observe(list);
        triggers.current.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, [selected, triggers, revision]);

    return (
        <div ref={wrapperRef} className={cn("relative grid overflow-x-auto overflow-y-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", wrapperClassName)}>
            <TabsPrimitive.List ref={listRefs} className={cn("group/tab-list h-12 relative flex items-center gap-6 whitespace-nowrap border-y border-border", className)} {...props}>
                {children}

                {/* The underline appears once a selected tab has been measured, then slides between tabs. */}
                <div
                    className={cn(
                        "absolute -bottom-px left-0 h-0.5 bg-primary",
                        "transition-[transform,width] duration-slow [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none",
                        !underline && "hidden"
                    )}
                    style={underline ? { width: underline.width, transform: `translateX(${underline.left}px)` } : undefined}
                    aria-hidden="true"
                    data-slot="indicator"
                />
            </TabsPrimitive.List>
        </div>
    );
});
TabsHorizontalList.displayName = "TabsHorizontal.List";

const iconClassName =
    "size-5 text-muted-foreground transition duration-base ease-out group-data-[state=active]/tab-item:text-primary-strong";

const TabsHorizontalIcon = React.forwardRef<Element, TabsHorizontalIconProps>(({ className, as, children, ...props }, ref) => {
    return renderIcon(as ?? children, cn(iconClassName, className), ref, props);
});
TabsHorizontalIcon.displayName = "TabsHorizontal.Icon";

const TabsHorizontalArrow = React.forwardRef<Element, TabsHorizontalIconProps>(({ className, as, children, ...props }, ref) => {
    const source = as ?? children ?? <RiArrowRightSLine />;
    return renderIcon(source, cn("size-5 text-muted-foreground", className), ref, props);
});
TabsHorizontalArrow.displayName = "TabsHorizontal.Arrow";

const TabsHorizontalTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsHorizontalTriggerProps>(({ className, children, asChild = false, arrow = false, value, ...props }, ref) => {
    const registry = React.useContext(PanelRegistryContext);
    // Without a matching Content, drop Radix's aria-controls so it does not reference a missing element.
    const panelProps = registry && !registry.panels.has(value) ? { "aria-controls": undefined } : {};
    const hasArrow = !asChild && React.Children.toArray(children).some((child) => React.isValidElement(child) && child.type === TabsHorizontalArrow);

    // Register this trigger's element under its value. Radix re-creates its composed refs on every render, so this
    // happens after commit and only when the element or the value really changed, never from inside a ref callback.
    const registerTrigger = React.useContext(TabsStateContext)?.registerTrigger;
    const elementRef = React.useRef<HTMLButtonElement | null>(null);
    const refs = React.useMemo(() => mergeRefs(ref, elementRef), [ref]);
    const registration = React.useRef<{ node: HTMLElement; value: string; release: () => void } | null>(null);
    useIsomorphicLayoutEffect(() => {
        const node = elementRef.current;
        const current = registration.current;
        if (current && current.node === node && current.value === value) return;
        current?.release();
        registration.current = node && registerTrigger ? { node, value, release: registerTrigger(value, node) } : null;
    });
    useIsomorphicLayoutEffect(
        () => () => {
            registration.current?.release();
            registration.current = null;
        },
        []
    );

    return (
        <TabsPrimitive.Trigger
            ref={refs}
            value={value}
            asChild={asChild}
            className={cn(
                // base
                "group/tab-item py-3.5 size-label-sm font-medium text-muted-foreground",
                "flex items-center justify-center gap-1.5",
                "transition duration-base ease-out",
                // focus: the scroll wrapper clips overflow, so the ring is drawn inside the trigger
                "focus-ring-inset rounded-md",
                "no-underline",
                // active
                "data-[state=active]:text-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...panelProps}
            {...props}
        >
            {asChild ? (
                children
            ) : (
                <>
                    {children}
                    {arrow && !hasArrow && <TabsHorizontalArrow />}
                </>
            )}
        </TabsPrimitive.Trigger>
    );
});
TabsHorizontalTrigger.displayName = "TabsHorizontal.Trigger";

const TabsHorizontalContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, value, ...props }, ref) => {
    const registry = React.useContext(PanelRegistryContext);
    const register = registry?.register;
    useIsomorphicLayoutEffect(() => register?.(value), [register, value]);

    return <TabsPrimitive.Content ref={ref} value={value} className={cn("mt-2 rounded-md focus-ring", className)} {...props} />;
});
TabsHorizontalContent.displayName = "TabsHorizontal.Content";

const TabsHorizontal = {
    Root: TabsHorizontalRoot,
    List: TabsHorizontalList,
    Trigger: TabsHorizontalTrigger,
    Icon: TabsHorizontalIcon,
    Arrow: TabsHorizontalArrow,
    Content: TabsHorizontalContent,
};

export {
    TabsHorizontal,
    TabsHorizontalRoot as Root,
    TabsHorizontalList as List,
    TabsHorizontalTrigger as Trigger,
    TabsHorizontalIcon as Icon,
    TabsHorizontalArrow as Arrow,
    TabsHorizontalContent as Content,
};
