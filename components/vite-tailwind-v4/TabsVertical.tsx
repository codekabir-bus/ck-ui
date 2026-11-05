"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { RiArrowRightSLine } from "react-icons/ri";
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

// =========== Icon rendering ===========
type IconElementProps = React.HTMLAttributes<Element> & { ref?: React.Ref<Element> };

const isComponentType = (value: unknown): value is React.ElementType =>
    typeof value === "function" || (typeof value === "object" && value !== null && "$$typeof" in value && !React.isValidElement(value));

/** Renders an icon passed as an element (`as={<Icon />}`), a component (`as={Icon}`) or as children, merging classes and the ref. */
function renderIcon(source: React.ReactNode | React.ElementType, iconClassName: string, ref: React.ForwardedRef<Element> | undefined, props: React.HTMLAttributes<Element>) {
    if (React.isValidElement<IconElementProps>(source)) {
        return React.cloneElement(source, {
            "aria-hidden": true,
            ...props,
            className: cn(iconClassName, source.props.className),
            ref: composeRefs(source.props.ref, ref ?? undefined),
        });
    }
    if (isComponentType(source)) {
        const Component = source;
        return <Component ref={ref} aria-hidden="true" {...props} className={iconClassName} />;
    }
    return source ?? null;
}

// =========== Content ===========
const TabsVerticalContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, value, ...props }, ref) => {
    const registry = React.useContext(PanelRegistryContext);
    const register = registry?.register;
    useIsomorphicLayoutEffect(() => register?.(value), [register, value]);

    return <TabsPrimitive.Content ref={ref} value={value} className={cn("mt-2 rounded-md focus-ring", className)} {...props} />;
});
TabsVerticalContent.displayName = "TabsVertical.Content";

// =========== Root ===========
export type TabsVerticalRootProps = Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "orientation">;

const TabsVerticalRoot = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsVerticalRootProps>(({ className, ...props }, ref) => {
    const registry = usePanelRegistry();
    return (
        <PanelRegistryContext.Provider value={registry}>
            <TabsPrimitive.Root ref={ref} orientation="vertical" className={cn("w-full", className)} {...props} />
        </PanelRegistryContext.Provider>
    );
});
TabsVerticalRoot.displayName = "TabsVertical.Root";

// =========== List ===========
const TabsVerticalList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => {
    return <TabsPrimitive.List ref={ref} className={cn("space-y-2 w-full", className)} {...props} />;
});
TabsVerticalList.displayName = "TabsVertical.List";

// =========== Icon ===========
export interface TabsVerticalIconProps extends React.HTMLAttributes<HTMLElement> {
    /** Icon element (`as={<RiUserLine />}`) or component (`as={RiUserLine}`). Falls back to `children`. */
    as?: React.ElementType | React.ReactNode;
}

const iconClassName = "size-5 text-muted-foreground transition duration-base ease-out group-data-[state=active]/tab-item:text-primary-strong";

const TabsVerticalIcon = React.forwardRef<Element, TabsVerticalIconProps>(({ className, as, children, ...props }, ref) => {
    return renderIcon(as ?? children, cn(iconClassName, className), ref, props);
});
TabsVerticalIcon.displayName = "TabsVertical.Icon";

// =========== Arrow ===========
// A <span> (phrasing content) so it is valid inside the trigger <button>. Visible on the active tab only.
const TabsVerticalArrow = React.forwardRef<HTMLSpanElement, TabsVerticalIconProps>(({ className, as, children, ...props }, ref) => {
    const icon = renderIcon(as ?? children ?? <RiArrowRightSLine />, "size-5 text-muted-foreground", undefined, {});

    return (
        <span
            ref={ref}
            aria-hidden="true"
            className={cn(
                "ml-auto p-px text-muted-foreground rounded-full bg-surface ck-dark:bg-border opacity-0 shadow-regular scale-75 transition ease-out",
                "group-data-[state=active]/tab-item:scale-100 group-data-[state=active]/tab-item:opacity-100",
                className
            )}
            {...props}
        >
            {icon}
        </span>
    );
});
TabsVerticalArrow.displayName = "TabsVertical.Arrow";

// =========== Trigger ===========
export interface TabsVerticalTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
    /** Appends `TabsVertical.Arrow` after the label (ignored with `asChild`). */
    arrow?: boolean;
}

const TabsVerticalTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsVerticalTriggerProps>(({ className, children, arrow = false, asChild = false, value, ...props }, ref) => {
    const registry = React.useContext(PanelRegistryContext);
    // Without a matching Content, drop Radix's aria-controls so it does not reference a missing element.
    const panelProps = registry && !registry.panels.has(value) ? { "aria-controls": undefined } : {};
    const hasArrow = !asChild && React.Children.toArray(children).some((child) => React.isValidElement(child) && child.type === TabsVerticalArrow);

    return (
        <TabsPrimitive.Trigger
            ref={ref}
            value={value}
            asChild={asChild}
            className={cn(
                // base
                "group/tab-item w-full rounded-lg p-2 text-left size-label-sm font-medium text-muted-foreground",
                "transition duration-base ease-out",
                "grid auto-cols-auto grid-flow-col grid-cols-[auto,minmax(0,1fr)] items-center gap-1.5",
                // hover
                "hover:bg-muted",
                // focus
                "focus-ring-inset",
                // active
                "data-[state=active]:bg-muted data-[state=active]:text-foreground",
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
                    {arrow && !hasArrow && <TabsVerticalArrow />}
                </>
            )}
        </TabsPrimitive.Trigger>
    );
});
TabsVerticalTrigger.displayName = "TabsVertical.Trigger";

const TabsVertical = {
    Root: TabsVerticalRoot,
    List: TabsVerticalList,
    Trigger: TabsVerticalTrigger,
    Icon: TabsVerticalIcon,
    Arrow: TabsVerticalArrow,
    Content: TabsVerticalContent,
};

export {
    TabsVertical,
    TabsVerticalRoot as Root,
    TabsVerticalList as List,
    TabsVerticalTrigger as Trigger,
    TabsVerticalIcon as Icon,
    TabsVerticalArrow as Arrow,
    TabsVerticalContent as Content,
};
