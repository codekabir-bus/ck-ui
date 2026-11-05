"use client";

import * as React from "react";
import { cn } from "./lib/utils";

/*
 * Progress.Root is the progressbar (role="progressbar") and wraps everything the user sees:
 *   <Progress.Root value={40}>
 *     <Progress.Label>Uploading</Progress.Label>   → names the progressbar (aria-labelledby)
 *     <Progress.Value />                           → "40%" (visual; the value is exposed through aria-value*)
 *     <Progress.Track><Progress.Indicator /></Progress.Track>
 *   </Progress.Root>
 * Without children Root renders the track and indicator; then name it with aria-label.
 * value null/undefined → indeterminate (no aria-valuenow). Values are clamped to [min, max].
 */

export type ProgressColor = "primary" | "success" | "warning" | "destructive";
export type ProgressSize = "sm" | "md" | "lg";

type ProgressContextValue = {
    value: number | null;
    min: number;
    max: number;
    percentage: number;
    valueLabel: string | undefined;
    color: ProgressColor;
    size: ProgressSize;
    labelId: string;
    setHasLabel: (value: boolean) => void;
};

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

function useProgress(part: string) {
    const context = React.useContext(ProgressContext);
    if (!context) throw new Error(`<Progress.${part}> must be rendered inside <Progress.Root>.`);
    return context;
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const fillClasses: Record<ProgressColor, string> = {
    primary: "bg-primary-strong",
    success: "bg-success-strong",
    warning: "bg-warning-strong",
    destructive: "bg-destructive-strong",
};

const trackSizes: Record<ProgressSize, string> = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
};

export type ProgressValueLabel = (value: number, details: { min: number; max: number; percentage: number }) => string;

const defaultValueLabel: ProgressValueLabel = (_value, { percentage }) => `${Math.round(percentage)}%`;

export interface ProgressRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
    /** Current value. `null` or `undefined` shows an indeterminate bar. */
    value?: number | null;
    min?: number;
    max?: number;
    /** Text for aria-valuetext and Progress.Value. Default: the rounded percentage ("40%"). */
    getValueLabel?: ProgressValueLabel;
    color?: ProgressColor;
    size?: ProgressSize;
}

const Root = React.forwardRef<HTMLDivElement, ProgressRootProps>(
    ({ value: valueProp, min: minProp = 0, max: maxProp = 100, getValueLabel = defaultValueLabel, color = "primary", size = "md", className, children, ...props }, ref) => {
        const generatedId = React.useId();
        const labelId = `progress-${generatedId}-label`;
        const [hasLabel, setHasLabel] = React.useState(false);

        const min = Number.isFinite(minProp) ? minProp : 0;
        const max = Number.isFinite(maxProp) && maxProp > min ? maxProp : min + 100;
        const value = valueProp === null || valueProp === undefined || !Number.isFinite(valueProp) ? null : Math.min(max, Math.max(min, valueProp));
        const percentage = value === null ? 0 : ((value - min) / (max - min)) * 100;
        const valueLabel = value === null ? undefined : getValueLabel(value, { min, max, percentage });
        const state = value === null ? "indeterminate" : value === max ? "complete" : "loading";

        const context = React.useMemo(
            () => ({ value, min, max, percentage, valueLabel, color, size, labelId, setHasLabel }),
            [value, min, max, percentage, valueLabel, color, size, labelId]
        );

        const labelledBy = props["aria-labelledby"] ?? (hasLabel && !props["aria-label"] ? labelId : undefined);

        return (
            <ProgressContext.Provider value={context}>
                <div
                    ref={ref}
                    role="progressbar"
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value ?? undefined}
                    aria-valuetext={valueLabel}
                    data-state={state}
                    data-value={value ?? undefined}
                    data-max={max}
                    className={cn("flex w-full flex-col gap-2", className)}
                    {...props}
                    aria-labelledby={labelledBy}
                >
                    {children ?? (
                        <Track>
                            <Indicator />
                        </Track>
                    )}
                </div>
            </ProgressContext.Provider>
        );
    }
);
Root.displayName = "Progress.Root";

/** Names the progressbar. */
const Label = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => {
    const { labelId, setHasLabel } = useProgress("Label");

    useIsomorphicLayoutEffect(() => {
        setHasLabel(true);
        return () => setHasLabel(false);
    }, [setHasLabel]);

    return <span ref={ref} id={labelId} className={cn("size-label-sm text-foreground", className)} {...props} />;
});
Label.displayName = "Progress.Label";

/** The visible value text. Renders nothing while indeterminate unless you pass children. */
const Value = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, children, ...props }, ref) => {
    const { valueLabel } = useProgress("Value");
    const content = children ?? valueLabel;
    if (content === undefined || content === null) return null;

    return (
        // Hidden from assistive tech: the progressbar already exposes this value through aria-valuetext.
        <span ref={ref} aria-hidden="true" className={cn("size-label-sm tabular-nums text-muted-foreground", className)} {...props}>
            {content}
        </span>
    );
});
Value.displayName = "Progress.Value";

const Track = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const { size } = useProgress("Track");
    // 8% foreground keeps every fill well above 3:1 against the track in both themes (all fills use -strong tokens).
    return <div ref={ref} className={cn("relative w-full overflow-hidden rounded-full bg-foreground/[0.08]", trackSizes[size], className)} {...props} />;
});
Track.displayName = "Progress.Track";

const Indicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, style, ...props }, ref) => {
    const { value, percentage, color } = useProgress("Indicator");

    if (value === null) {
        return (
            <div
                ref={ref}
                data-state="indeterminate"
                className={cn(
                    "absolute inset-y-0 left-0 w-2/5 rounded-full animate-progress-indeterminate rtl:[animation-direction:reverse]",
                    // Reduced motion: a still segment in the middle of the track.
                    "motion-reduce:left-[30%] motion-reduce:animate-none",
                    fillClasses[color],
                    className
                )}
                style={style}
                {...props}
            />
        );
    }

    return (
        <div
            ref={ref}
            data-state={percentage >= 100 ? "complete" : "loading"}
            // Width (not a transform) so the bar grows from the inline start in both LTR and RTL.
            className={cn("h-full rounded-full transition-[width] duration-slow ease-standard", fillClasses[color], className)}
            style={{ width: `${percentage}%`, ...style }}
            {...props}
        />
    );
});
Indicator.displayName = "Progress.Indicator";

export { Root, Label, Value, Track, Indicator };
