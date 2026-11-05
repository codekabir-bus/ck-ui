"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RiAlertLine, RiCheckboxCircleLine, RiErrorWarningLine, RiInformationLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/*
 * A static message block. It is not a live region by default: pass role="alert" only when the alert is
 * inserted in response to something the user did and must interrupt, or role="status" for polite news.
 * Parts: Root, Icon, Title, Description, Actions.
 */

export type AlertColor = "neutral" | "info" | "success" | "warning" | "destructive";

const AlertContext = React.createContext<AlertColor>("neutral");

const colorClasses: Record<AlertColor, string> = {
    neutral: "border-border bg-surface",
    info: "border-info-border bg-info-subtle",
    success: "border-success-border bg-success-subtle",
    warning: "border-warning-border bg-warning-subtle",
    destructive: "border-destructive-border bg-destructive-subtle",
};

const iconColorClasses: Record<AlertColor, string> = {
    neutral: "text-muted-foreground",
    info: "text-info-strong",
    success: "text-success-strong",
    warning: "text-warning-strong",
    destructive: "text-destructive-strong",
};

const defaultIcons: Record<AlertColor, React.ElementType> = {
    neutral: RiInformationLine,
    info: RiInformationLine,
    success: RiCheckboxCircleLine,
    warning: RiAlertLine,
    destructive: RiErrorWarningLine,
};

export interface AlertRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
    /** Intent. Sets the surface, border and icon colour. */
    color?: AlertColor;
}

const Root = React.forwardRef<HTMLDivElement, AlertRootProps>(({ color = "neutral", className, ...props }, ref) => (
    <AlertContext.Provider value={color}>
        <div
            ref={ref}
            data-color={color}
            className={cn(
                // Two columns when an Alert.Icon is present; the text parts sit in the second column.
                "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-2xl border p-4 text-foreground",
                "has-[>[data-slot=alert-icon]]:grid-cols-[auto_1fr] has-[>[data-slot=alert-icon]]:gap-x-3",
                colorClasses[color],
                className
            )}
            {...props}
        />
    </AlertContext.Provider>
));
Root.displayName = "Alert.Root";

export interface AlertIconProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Icon component to render instead of the colour's default icon. */
    as?: React.ElementType;
}

/** Decorative icon. Without `as` or children it shows the default icon for the alert's colour. */
const Icon = React.forwardRef<HTMLSpanElement, AlertIconProps>(({ as, className, children, ...props }, ref) => {
    const color = React.useContext(AlertContext);
    const Glyph = as ?? defaultIcons[color];

    return (
        <span
            ref={ref}
            data-slot="alert-icon"
            aria-hidden="true"
            className={cn("col-start-1 row-start-1 flex size-5 shrink-0 items-center justify-center [&>svg]:size-5", iconColorClasses[color], className)}
            {...props}
        >
            {children ?? <Glyph />}
        </span>
    );
});
Icon.displayName = "Alert.Icon";

export interface AlertTextProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Render the single child (e.g. an <h3>) instead of a <div>. */
    asChild?: boolean;
}

const Title = React.forwardRef<HTMLDivElement, AlertTextProps>(({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp ref={ref} className={cn("col-start-2 size-label-sm text-foreground", className)} {...props} />;
});
Title.displayName = "Alert.Title";

const Description = React.forwardRef<HTMLDivElement, AlertTextProps>(({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp ref={ref} className={cn("col-start-2 size-p-sm text-muted-foreground [&_p]:leading-relaxed", className)} {...props} />;
});
Description.displayName = "Alert.Description";

const Actions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("col-start-2 mt-2 flex flex-wrap items-center gap-2", className)} {...props} />
));
Actions.displayName = "Alert.Actions";

export { Root, Icon, Title, Description, Actions };
