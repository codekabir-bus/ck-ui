"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "./lib/utils";

export interface LabelRootProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
    /** Dims the label. The control itself must also be disabled. */
    disabled?: boolean;
}

const Root = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelRootProps>(({ className, disabled, ...props }, ref) => {
    return (
        <LabelPrimitive.Root
            ref={ref}
            data-disabled={disabled || undefined}
            className={cn(
                "group flex cursor-pointer items-center gap-px size-p-sm text-foreground",
                "data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground/60",
                className
            )}
            {...props}
        />
    );
});
Root.displayName = "Label.Root";

// Visual required marker. Screen readers get "required" from the control (required / aria-required).
const Asterisk = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, children, ...props }, ref) => (
    <span ref={ref} aria-hidden="true" className={cn("text-primary-strong group-data-[disabled]:text-muted-foreground/60", className)} {...props}>
        {children || "*"}
    </span>
));
Asterisk.displayName = "Label.Asterisk";

const Sub = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
    <span ref={ref} className={cn("size-p-xs text-muted-foreground group-data-[disabled]:text-muted-foreground/60", className)} {...props} />
));
Sub.displayName = "Label.Sub";

export { Root, Asterisk, Sub };
