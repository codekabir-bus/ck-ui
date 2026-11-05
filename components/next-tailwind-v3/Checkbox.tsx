"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "./lib/utils";
import { useFieldControlProps } from "./Field";

export type CheckboxRootProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    /** Error state (aria-invalid). Also taken from Field.Root. */
    invalid?: boolean;
};

/*
 * The 20px control stacks its layers in a single grid cell: a 16px coloured plate, a raised surface over it while the
 * box is empty, and the two marks. Each layer is styled from the Radix root's data-state (and disabled/aria-invalid),
 * so the component keeps no state of its own. The check mark uses pathLength=1, so its draw-in needs no measured length.
 */
const layer = "col-start-1 row-start-1";

const Root = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxRootProps>(({ className, invalid, ...props }, ref) => {
    const controlProps = useFieldControlProps(props, { invalid });

    return (
        <CheckboxPrimitive.Root
            ref={ref}
            className={cn("group/checkbox relative grid size-5 shrink-0 place-items-center rounded-md focus-ring disabled:cursor-not-allowed", className)}
            {...controlProps}
        >
            <span
                aria-hidden="true"
                data-slot="plate"
                className={cn(
                    layer,
                    "size-4 rounded-[4px] bg-input transition-colors duration-base ease-out",
                    "group-hover/checkbox:bg-muted-foreground/40",
                    "group-aria-[invalid=true]/checkbox:bg-destructive",
                    "group-data-[state=checked]/checkbox:bg-primary group-data-[state=indeterminate]/checkbox:bg-primary",
                    "group-hover/checkbox:group-data-[state=checked]/checkbox:bg-primary-hover group-hover/checkbox:group-data-[state=indeterminate]/checkbox:bg-primary-hover",
                    "group-disabled/checkbox:bg-muted group-disabled/checkbox:group-data-[state=checked]/checkbox:bg-muted group-disabled/checkbox:group-data-[state=indeterminate]/checkbox:bg-muted"
                )}
            />
            {/* The surface sits 1.5px inside the plate (concentric corners), lifted by the design system's regular shadow. */}
            <span
                aria-hidden="true"
                data-slot="surface"
                className={cn(
                    layer,
                    "size-[13px] rounded-[2.5px] bg-background shadow-regular transition-opacity duration-base ease-out",
                    "group-data-[state=checked]/checkbox:opacity-0 group-data-[state=indeterminate]/checkbox:opacity-0 group-disabled/checkbox:hidden"
                )}
            />
            <CheckboxPrimitive.Indicator forceMount className={cn(layer, "grid size-4 place-items-center")}>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" data-slot="check" className={cn(layer, "size-4 opacity-0 group-data-[state=checked]/checkbox:opacity-100")}>
                    <path
                        d="M4.25 8 6.75 10.5 11.75 5.5"
                        pathLength={1}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                            "stroke-primary-foreground ck-dark:stroke-background",
                            "[stroke-dasharray:1] [stroke-dashoffset:1] group-data-[state=checked]/checkbox:[stroke-dashoffset:0]",
                            "transition-[stroke-dashoffset] duration-slow ease-out motion-reduce:transition-none"
                        )}
                    />
                </svg>
                <span
                    aria-hidden="true"
                    data-slot="dash"
                    className={cn(
                        layer,
                        "h-[1.5px] w-2 origin-left scale-x-0 rounded-full bg-primary-foreground ck-dark:bg-background",
                        "transition-transform duration-slow ease-out motion-reduce:transition-none group-data-[state=indeterminate]/checkbox:scale-x-100"
                    )}
                />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
});
Root.displayName = "Checkbox.Root";

export { Root };
