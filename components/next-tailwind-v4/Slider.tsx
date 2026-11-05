"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./lib/utils";
import { useField, useFieldControlProps } from "./Field";

/*
 * Built on Radix Slider: each thumb is role="slider" with aria-valuenow/min/max and keyboard support
 * (arrows by `step`, PageUp/PageDown by 10 steps, Home/End to min/max). Pass two values for a range.
 * Naming: inside Field.Root the thumb is labelled by Field.Label; range thumbs need `thumbLabels`.
 * Use `getValueLabel` when the number alone is not meaningful ("$40", "40%").
 */

export interface SliderRootProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "asChild"> {
    /** Text read for each thumb's value (aria-valuetext). */
    getValueLabel?: (value: number, index: number) => string;
    /** Accessible name per thumb, e.g. ["Minimum price", "Maximum price"]. */
    thumbLabels?: string[];
    invalid?: boolean;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
}

const Root = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderRootProps>(
    (
        {
            className,
            value: valueProp,
            defaultValue,
            onValueChange,
            min = 0,
            max = 100,
            getValueLabel,
            thumbLabels,
            invalid,
            disabled,
            id,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
            ...props
        },
        ref
    ) => {
        const field = useField();
        const controlProps = useFieldControlProps({ id, "aria-describedby": ariaDescribedBy, disabled }, { invalid });
        // Mirror the values so the right number of thumbs (and their value text) is rendered.
        const [uncontrolled, setUncontrolled] = React.useState<number[]>(defaultValue ?? [min]);
        const values = valueProp ?? uncontrolled;
        const isInvalid = Boolean(controlProps["aria-invalid"]);

        return (
            <SliderPrimitive.Root
                ref={ref}
                value={valueProp}
                defaultValue={defaultValue ?? (valueProp ? undefined : [min])}
                onValueChange={(next) => {
                    if (valueProp === undefined) setUncontrolled(next);
                    onValueChange?.(next);
                }}
                min={min}
                max={max}
                disabled={Boolean(controlProps.disabled)}
                data-invalid={isInvalid || undefined}
                className={cn(
                    "relative flex w-full touch-none select-none items-center py-2",
                    "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2 data-[orientation=vertical]:py-0",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                    className
                )}
                {...props}
            >
                <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-foreground/[0.08] data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
                    <SliderPrimitive.Range
                        className={cn("absolute rounded-full data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full", isInvalid ? "bg-destructive-strong" : "bg-primary-strong")}
                    />
                </SliderPrimitive.Track>
                {values.map((value, index) => {
                    const thumbLabel = thumbLabels?.[index];
                    // A thumb without its own label takes the slider's: aria-label, aria-labelledby or Field.Label.
                    const labelledBy = thumbLabel ? undefined : (ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId));
                    return (
                        <SliderPrimitive.Thumb
                            key={index}
                            id={index === 0 ? controlProps.id : undefined}
                            aria-label={thumbLabel ?? (labelledBy ? undefined : ariaLabel)}
                            aria-labelledby={labelledBy}
                            aria-describedby={controlProps["aria-describedby"]}
                            aria-valuetext={getValueLabel?.(value, index)}
                            aria-invalid={isInvalid || undefined}
                            className={cn(
                                "block size-5 rounded-full border-2 bg-background shadow-regular transition-[box-shadow,transform] duration-fast ease-standard focus-ring",
                                "hover:scale-110 motion-reduce:hover:scale-100 data-[disabled]:pointer-events-none",
                                isInvalid ? "border-destructive-strong" : "border-primary-strong"
                            )}
                        />
                    );
                })}
            </SliderPrimitive.Root>
        );
    }
);
Root.displayName = "Slider.Root";

export { Root };
