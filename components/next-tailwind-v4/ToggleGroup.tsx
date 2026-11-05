"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "./lib/utils";
import { toggleVariants, type ToggleSize, type ToggleVariant } from "./Toggle";

/*
 * A set of toggles: type="single" (at most one pressed) or type="multiple" (independent toggles), built on
 * Radix ToggleGroup. One tab stop for the group; arrow keys move between items (roving focus).
 * Use it for toolbar-style formatting/filters. For choosing one view or mode, use SegmentedControl.
 */

const ToggleGroupContext = React.createContext<{ variant?: ToggleVariant; size?: ToggleSize }>({});

export type ToggleGroupRootProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
    variant?: ToggleVariant;
    size?: ToggleSize;
};

/** Name the group with `aria-label` (e.g. "Text formatting"). */
const Root = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Root>, ToggleGroupRootProps>(({ className, variant, size, children, ...props }, ref) => {
    const context = React.useMemo(() => ({ variant, size }), [variant, size]);

    return (
        <ToggleGroupPrimitive.Root
            ref={ref}
            className={cn("inline-flex items-center gap-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch", className)}
            {...props}
        >
            <ToggleGroupContext.Provider value={context}>{children}</ToggleGroupContext.Provider>
        </ToggleGroupPrimitive.Root>
    );
});
Root.displayName = "ToggleGroup.Root";

export interface ToggleGroupItemProps extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> {
    variant?: ToggleVariant;
    size?: ToggleSize;
}

const Item = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Item>, ToggleGroupItemProps>(({ className, variant, size, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    return <ToggleGroupPrimitive.Item ref={ref} className={cn(toggleVariants({ variant: variant ?? context.variant, size: size ?? context.size }), className)} {...props} />;
});
Item.displayName = "ToggleGroup.Item";

export { Root, Item };
