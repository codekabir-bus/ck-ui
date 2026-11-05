"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "./lib/utils";
import { useFieldControlProps } from "./Field";

const rootSizes = {
    sm: "h-5 w-8",
    md: "h-6 w-10",
    lg: "h-7 w-12",
} as const;

const trackSizes = {
    sm: "h-4 w-7",
    md: "h-5 w-9",
    lg: "h-6 w-11",
} as const;

const thumbSizes = {
    sm: "size-3 border-[4px]",
    md: "size-4 border-[5px]",
    lg: "size-5 border-[6px]",
} as const;

type SizeVariant = keyof typeof rootSizes;

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
    size?: SizeVariant;
    /** Error state (aria-invalid). Also taken from Field.Root. */
    invalid?: boolean;
}

const Root = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(({ className, size = "sm", invalid, ...props }, ref) => {
    const controlProps = useFieldControlProps(props, { invalid });

    return (
        <SwitchPrimitives.Root
            ref={ref}
            className={cn("group inline-flex shrink-0 items-center justify-center rounded-full focus-ring disabled:cursor-not-allowed", rootSizes[size], className)}
            {...controlProps}
        >
            <span
                className={cn(
                    "relative flex items-center rounded-full p-0.5 transition-colors duration-base ease-in-out",
                    trackSizes[size],
                    "bg-input group-hover:bg-muted-foreground/40",
                    "group-data-[state=checked]:bg-primary group-hover:group-data-[state=checked]:bg-primary-hover",
                    "group-aria-[invalid=true]:ring-1 group-aria-[invalid=true]:ring-destructive",
                    "group-disabled:bg-transparent group-disabled:ring-1 group-disabled:ring-input group-disabled:group-data-[state=checked]:bg-muted group-disabled:group-data-[state=checked]:ring-transparent"
                )}
            >
                <SwitchPrimitives.Thumb
                    className={cn(
                        "inline-block translate-x-0 rounded-full border-white bg-transparent shadow transition duration-base ease-in-out data-[state=checked]:translate-x-full",
                        thumbSizes[size],
                        "group-active:scale-[0.833] group-disabled:scale-100 group-disabled:border-input group-disabled:shadow-none"
                    )}
                />
            </span>
        </SwitchPrimitives.Root>
    );
});
Root.displayName = "Switch.Root";

export { Root };
