import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RiArrowRightSLine, RiMoreLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/*
 * <nav aria-label="Breadcrumb"><ol>…</ol></nav>, with the current page marked aria-current="page".
 * Separators are hidden from assistive tech. Links render plain <a> elements; use `asChild` for a
 * router link (e.g. Next.js Link). Server-compatible, no router dependency.
 */

const Root = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ "aria-label": ariaLabel = "Breadcrumb", ...props }, ref) => (
    <nav ref={ref} aria-label={ariaLabel} {...props} />
));
Root.displayName = "Breadcrumb.Root";

/** The ordered list. Wraps onto several lines when there is not enough room. */
const List = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(({ className, ...props }, ref) => (
    <ol ref={ref} className={cn("flex flex-wrap items-center gap-1.5 break-words size-p-sm text-muted-foreground sm:gap-2", className)} {...props} />
));
List.displayName = "Breadcrumb.List";

const Item = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex min-w-0 max-w-full items-center gap-1.5", className)} {...props} />
));
Item.displayName = "Breadcrumb.Item";

export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Render the single child (e.g. a Next.js <Link>) with the link styles. */
    asChild?: boolean;
}

const linkClasses = "inline-flex min-w-0 items-center gap-1.5 rounded-xs transition-colors duration-base ease-standard hover:text-foreground focus-ring [&>svg]:size-4 [&>svg]:shrink-0";

const Link = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return <Comp ref={ref} className={cn(linkClasses, className)} {...props} />;
});
Link.displayName = "Breadcrumb.Link";

export interface BreadcrumbCurrentProps extends React.HTMLAttributes<HTMLSpanElement> {
    asChild?: boolean;
}

/** The current page: not a link, marked aria-current="page". */
const Current = React.forwardRef<HTMLSpanElement, BreadcrumbCurrentProps>(({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
        <Comp
            ref={ref}
            aria-current="page"
            className={cn("inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground [&>svg]:size-4 [&>svg]:shrink-0", className)}
            {...props}
        />
    );
});
Current.displayName = "Breadcrumb.Current";

/** Decorative separator between items (defaults to a chevron). */
const Separator = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(({ className, children, ...props }, ref) => (
    <li ref={ref} role="presentation" aria-hidden="true" className={cn("flex items-center text-muted-foreground [&>svg]:size-4", className)} {...props}>
        {children ?? <RiArrowRightSLine />}
    </li>
));
Separator.displayName = "Breadcrumb.Separator";

export interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Text for screen readers (default "More pages"). */
    label?: string;
}

/** Stands in for collapsed items. Put it inside a button (e.g. a Dropdown trigger) to reveal them. */
const Ellipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(({ label = "More pages", className, ...props }, ref) => (
    <span ref={ref} className={cn("flex size-6 items-center justify-center", className)} {...props}>
        <RiMoreLine aria-hidden="true" className="size-4" />
        <span className="sr-only">{label}</span>
    </span>
));
Ellipsis.displayName = "Breadcrumb.Ellipsis";

export { Root, List, Item, Link, Current, Separator, Ellipsis };
