"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

/*
 * A two-state button (aria-pressed). Built on Radix Toggle.
 * Sizes match Button. Pressed adds a strong border (≥3:1 against the surface and the fill), a fill and the
 * foreground text colour; icon toggles should still swap their icon (e.g. outline → filled star) for important states.
 */

export const toggleVariants = cva(
    [
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border size-label-sm",
        "transition-colors duration-base ease-standard focus-ring",
        "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        "data-[state=on]:border-foreground/60 data-[state=on]:bg-foreground/10 data-[state=on]:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:shrink-0",
    ],
    {
        variants: {
            variant: {
                ghost: "border-transparent bg-transparent",
                stroke: "border-border bg-transparent",
            },
            size: {
                xs: "h-7 min-w-7 px-1.5 [&_svg]:size-4",
                sm: "h-8 min-w-8 px-2 [&_svg]:size-4",
                md: "h-9 min-w-9 px-2.5 [&_svg]:size-5",
                lg: "h-10 min-w-10 px-3 [&_svg]:size-5",
            },
        },
        defaultVariants: { variant: "ghost", size: "md" },
    }
);

export type ToggleVariant = NonNullable<VariantProps<typeof toggleVariants>["variant"]>;
export type ToggleSize = NonNullable<VariantProps<typeof toggleVariants>["size"]>;

export interface ToggleRootProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
    variant?: ToggleVariant;
    size?: ToggleSize;
}

/** Icon-only toggles need an `aria-label` that names the action (e.g. "Bold"); it must not change with the state. */
const Root = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleRootProps>(({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size }), className)} {...props} />
));
Root.displayName = "Toggle.Root";

export { Root };
