import * as React from "react";
import { cn } from "./lib/utils";

/*
 * Placeholder shapes shown while content loads. Skeletons are decorative (aria-hidden): announce the
 * loading state on the container instead, e.g. aria-busy="true" plus visually hidden "Loading…" text.
 * Server-compatible. The pulse stops under prefers-reduced-motion.
 */

export type SkeletonShape = "text" | "circle" | "rect";

const shapeClasses: Record<SkeletonShape, string> = {
    text: "h-4 w-full rounded-md",
    circle: "size-10 shrink-0 rounded-full",
    rect: "h-32 w-full rounded-2xl",
};

// foreground/10 stays visible on background, surface and muted in both themes.
const base = "block animate-pulse bg-foreground/10 motion-reduce:animate-none";

export interface SkeletonRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Default size and rounding. Size anything with `className` (e.g. `h-6 w-24`). */
    shape?: SkeletonShape;
}

const Root = React.forwardRef<HTMLDivElement, SkeletonRootProps>(({ shape = "text", className, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" data-shape={shape} className={cn(base, shapeClasses[shape], className)} {...props} />
));
Root.displayName = "Skeleton.Root";

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Number of lines. The last one is shorter, like the end of a paragraph. */
    lines?: number;
    /** Classes for every line. */
    lineClassName?: string;
}

const Text = React.forwardRef<HTMLDivElement, SkeletonTextProps>(({ lines = 3, lineClassName, className, ...props }, ref) => {
    const count = Math.max(1, Math.floor(lines));

    return (
        <div ref={ref} aria-hidden="true" className={cn("flex w-full flex-col gap-2", className)} {...props}>
            {Array.from({ length: count }, (_, index) => (
                <div key={index} data-shape="text" className={cn(base, shapeClasses.text, count > 1 && index === count - 1 && "w-4/5", lineClassName)} />
            ))}
        </div>
    );
});
Text.displayName = "Skeleton.Text";

export { Root, Text };
