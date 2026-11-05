"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "./lib/utils";
import { useField, useFieldControlProps } from "./Field";

const sizes = {
    sm: "size-4 border-[1.5px] data-[state=checked]:border-4",
    md: "size-5 border-2 data-[state=checked]:border-[5px]",
    lg: "size-6 border-2 data-[state=checked]:border-[6px]",
} as const;

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
    /** Error state (aria-invalid). Also taken from Field.Root. */
    invalid?: boolean;
};

// Inside Field.Root the group is labelled by Field.Label (aria-labelledby) and described by its description/message.
const Group = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(({ invalid, ...props }, ref) => {
    const field = useField();
    const controlProps = useFieldControlProps(props, { invalid });

    // A radiogroup is not a labelable element: it is named through aria-labelledby, not the Field control id.
    return <RadioGroupPrimitive.Root ref={ref} {...controlProps} id={props.id} aria-labelledby={props["aria-labelledby"] ?? field?.labelId} />;
});
Group.displayName = "Radio.Group";

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
    size?: keyof typeof sizes;
}

const Item = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(({ className, size = "sm", ...props }, ref) => (
    <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
            "relative shrink-0 rounded-full border-input bg-transparent shadow-xs transition-[border-color,border-width] duration-fast ease-in-out focus-ring",
            "hover:border-muted-foreground/50",
            "data-[state=checked]:border-primary hover:data-[state=checked]:border-primary-hover",
            "aria-[invalid=true]:border-destructive",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted disabled:shadow-none disabled:data-[state=checked]:border-input disabled:data-[state=checked]:bg-transparent",
            sizes[size],
            className
        )}
        {...props}
    />
));
Item.displayName = "Radio.Item";

export { Group, Item };
