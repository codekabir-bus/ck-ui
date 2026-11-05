import * as React from "react";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so Divider can be rendered from server components.

export type DividerVariant = "line" | "line-text" | "text" | "solid-text" | "content";
export type DividerOrientation = "horizontal" | "vertical";

export interface DividerRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * - `line`: a plain rule (role="separator").
     * - `line-text` / `content`: children centred between two rules; the rules are decorative and the children stay readable.
     * - `text` / `solid-text`: a label row (no separator role), plain or on a solid background.
     */
    variant?: DividerVariant;
    /** Position of the children for `line-text` / `content`. */
    align?: "left" | "center" | "right";
    /** `vertical` always renders a plain rule (children are not rendered); give it a height, e.g. `className="h-6"`. */
    orientation?: DividerOrientation;
    /** For rules only: hide a purely visual rule from assistive technology instead of exposing it as a separator. */
    decorative?: boolean;
}

const RULE = "bg-border";
// Label text uses muted-foreground (≥4.5:1 in both themes); the old neutral-400/600 measured about 2.5:1.
const LABEL_TEXT = "uppercase size-subheading-xs";

const DividerRoot = React.forwardRef<HTMLDivElement, DividerRootProps>(
    ({ variant = "line", align = "center", orientation = "horizontal", decorative = false, className, children, ...props }, ref) => {
        if (orientation === "vertical" || variant === "line") {
            const semantics: React.HTMLAttributes<HTMLDivElement> = decorative ? { "aria-hidden": true } : { role: "separator", "aria-orientation": orientation };
            return <div ref={ref} {...semantics} className={cn(orientation === "vertical" ? "h-full w-px" : "h-px w-full", RULE, className)} {...props} />;
        }

        if (variant === "line-text" || variant === "content") {
            return (
                <div ref={ref} className={cn("flex w-full items-center gap-2.5", className)} {...props}>
                    {(align === "center" || align === "right") && <div aria-hidden="true" className={cn("h-px flex-1", RULE)} />}
                    <div className={cn("flex-shrink-0 text-muted-foreground", LABEL_TEXT)}>{children}</div>
                    {(align === "center" || align === "left") && <div aria-hidden="true" className={cn("h-px flex-1", RULE)} />}
                </div>
            );
        }

        if (variant === "solid-text") {
            return (
                <div
                    ref={ref}
                    className={cn("flex w-full items-center gap-6 bg-neutral-100 px-5 py-1.5 text-muted-foreground ck-dark:bg-neutral-800", LABEL_TEXT, className)}
                    {...props}
                >
                    {children}
                </div>
            );
        }

        // variant === "text"
        return (
            <div ref={ref} className={cn("flex w-full items-center gap-2 px-2 py-1 text-muted-foreground", LABEL_TEXT, className)} {...props}>
                {children}
            </div>
        );
    }
);
DividerRoot.displayName = "Divider.Root";

export { DividerRoot as Root };
