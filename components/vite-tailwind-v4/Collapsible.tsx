"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";

/*
 * One trigger that shows and hides one region.
 *   Collapsible.Trigger → <button aria-expanded aria-controls>
 *   Collapsible.Content → stays in the DOM and is `hidden` while closed, so aria-controls always resolves
 * Built on React + Radix Slot only. For a list of sections where only some are open, use Accordion.
 */

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type CollapsibleContextValue = {
    open: boolean;
    disabled: boolean;
    contentId: string;
    setContentId: (id: string | undefined) => void;
    toggle: () => void;
};

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsible(part: string) {
    const context = React.useContext(CollapsibleContext);
    if (!context) throw new Error(`<Collapsible.${part}> must be rendered inside <Collapsible.Root>.`);
    return context;
}

const stateAttribute = (open: boolean) => (open ? "open" : "closed");

export interface CollapsibleRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Open state (controlled). */
    open?: boolean;
    /** Initial open state (uncontrolled). */
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Prevents the trigger from toggling. */
    disabled?: boolean;
    asChild?: boolean;
}

const Root = React.forwardRef<HTMLDivElement, CollapsibleRootProps>(
    ({ open: openProp, defaultOpen = false, onOpenChange, disabled = false, asChild = false, children, ...props }, ref) => {
        const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
        const isControlled = openProp !== undefined;
        const open = isControlled ? openProp : uncontrolledOpen;

        const generatedId = `collapsible-${React.useId()}`;
        const [customContentId, setContentId] = React.useState<string | undefined>(undefined);

        const toggle = React.useCallback(() => {
            if (!isControlled) setUncontrolledOpen(!open);
            onOpenChange?.(!open);
        }, [isControlled, open, onOpenChange]);

        const context = React.useMemo(
            () => ({ open, disabled, contentId: customContentId ?? generatedId, setContentId, toggle }),
            [open, disabled, customContentId, generatedId, toggle]
        );
        const Comp = asChild ? Slot : "div";

        return (
            <CollapsibleContext.Provider value={context}>
                <Comp ref={ref} data-state={stateAttribute(open)} data-disabled={disabled ? "" : undefined} {...props}>
                    {children}
                </Comp>
            </CollapsibleContext.Provider>
        );
    }
);
Root.displayName = "Collapsible.Root";

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Merge the trigger behaviour onto the single child element (e.g. a Button). */
    asChild?: boolean;
}

const Trigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(({ asChild = false, onClick, disabled, type, ...props }, ref) => {
    const context = useCollapsible("Trigger");
    const isDisabled = Boolean(disabled ?? context.disabled);
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            ref={ref}
            type={asChild ? type : (type ?? "button")}
            aria-controls={context.contentId}
            aria-expanded={context.open}
            data-state={stateAttribute(context.open)}
            data-disabled={isDisabled ? "" : undefined}
            disabled={isDisabled || undefined}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                onClick?.(event);
                if (!event.defaultPrevented && !isDisabled) context.toggle();
            }}
            {...props}
        />
    );
});
Trigger.displayName = "Collapsible.Trigger";

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Keep the content visible while closed so you can animate it yourself with `data-state`. */
    forceMount?: boolean;
}

const Content = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(({ id, forceMount = false, className, ...props }, ref) => {
    const context = useCollapsible("Content");
    const { setContentId } = context;

    // A consumer id replaces the generated one, and the trigger's aria-controls follows it.
    useIsomorphicLayoutEffect(() => {
        if (!id) return;
        setContentId(id);
        return () => setContentId(undefined);
    }, [id, setContentId]);

    return (
        <div
            ref={ref}
            id={id ?? context.contentId}
            data-state={stateAttribute(context.open)}
            data-disabled={context.disabled ? "" : undefined}
            hidden={!context.open && !forceMount}
            className={cn(
                // [hidden] must win over display utilities (e.g. `flex`) a consumer adds.
                "[&[hidden]]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=open]:duration-base",
                className
            )}
            {...props}
        />
    );
});
Content.displayName = "Collapsible.Content";

export { Root, Trigger, Content };
