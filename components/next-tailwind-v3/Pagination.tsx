import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RiArrowLeftSLine, RiArrowRightSLine, RiMoreLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/*
 * Page navigation: <nav aria-label="Pagination"><ul>…</ul></nav>.
 * Pagination keeps no state. Each link is an <a> when given `href`, your own element with `asChild`
 * (e.g. Next.js Link), or a <button> otherwise (for state you manage with onClick).
 * getPaginationRange() computes which page numbers and ellipses to show. Server-compatible: no hooks, and no
 * event handlers are passed to your link elements unless you pass onClick yourself.
 */

export type PaginationSize = "sm" | "md";

const Root = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ "aria-label": ariaLabel = "Pagination", className, ...props }, ref) => (
    <nav ref={ref} aria-label={ariaLabel} className={cn("flex w-full justify-center", className)} {...props} />
));
Root.displayName = "Pagination.Root";

const Content = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-wrap items-center gap-0.5 sm:gap-1", className)} {...props} />
));
Content.displayName = "Pagination.Content";

const Item = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("flex", className)} {...props} />
));
Item.displayName = "Pagination.Item";

const sizeClasses: Record<PaginationSize, string> = {
    sm: "h-8 min-w-8 px-2",
    md: "h-9 min-w-9 px-2.5",
};

export interface PaginationLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type"> {
    /** Marks the current page (aria-current="page"). */
    isActive?: boolean;
    /** Not interactive: removed from the tab order and announced as unavailable. */
    disabled?: boolean;
    size?: PaginationSize;
    /** Render the single child (e.g. a Next.js <Link>) with the link styles and state. */
    asChild?: boolean;
}

const Link = React.forwardRef<HTMLElement, PaginationLinkProps>(
    ({ isActive = false, disabled = false, size = "md", asChild = false, href, className, children, onClick, "aria-label": ariaLabel, ...props }, ref) => {
        const classes = cn(
            "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border size-label-sm transition-colors duration-base ease-standard focus-ring [&>svg]:size-5 [&>svg]:shrink-0",
            sizeClasses[size],
            isActive ? "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover" : "border-transparent text-foreground hover:bg-muted",
            "aria-disabled:pointer-events-none aria-disabled:text-muted-foreground disabled:pointer-events-none disabled:text-muted-foreground",
            className
        );
        // "3" alone is ambiguous out of context; "Page 3" keeps the visible text in the name.
        // With asChild the number is the child's own text (e.g. <Link href="?page=3">3</Link>).
        const text = asChild && React.isValidElement<{ children?: React.ReactNode }>(children) ? children.props.children : children;
        const label = ariaLabel ?? (typeof text === "number" || typeof text === "string" ? `Page ${text}` : undefined);
        const shared = {
            className: classes,
            "aria-label": label,
            "aria-current": isActive ? ("page" as const) : undefined,
            "data-active": isActive ? "" : undefined,
        };

        if (asChild) {
            // A disabled step must not be followable, so the consumer's link is replaced by an inert anchor (no href)
            // with the same content. No event handler is added, which keeps asChild usable from Server Components.
            if (disabled) {
                const child = React.isValidElement<{ children?: React.ReactNode; className?: string }>(children) ? children : null;
                return (
                    <a ref={ref as React.Ref<HTMLAnchorElement>} {...shared} className={cn(classes, child?.props.className)} role="link" aria-disabled="true" {...props}>
                        {child ? child.props.children : children}
                    </a>
                );
            }

            return (
                <Slot ref={ref} {...shared} onClick={onClick} {...props}>
                    {children}
                </Slot>
            );
        }

        if (href !== undefined) {
            // A disabled link loses its href, so it cannot be focused or followed.
            return (
                <a
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    {...shared}
                    href={disabled ? undefined : href}
                    role={disabled ? "link" : undefined}
                    aria-disabled={disabled || undefined}
                    onClick={onClick}
                    {...props}
                >
                    {children}
                </a>
            );
        }

        return (
            <button
                ref={ref as React.Ref<HTMLButtonElement>}
                type="button"
                {...shared}
                disabled={disabled}
                onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>}
                {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            >
                {children}
            </button>
        );
    }
);
Link.displayName = "Pagination.Link";

export interface PaginationStepProps extends Omit<PaginationLinkProps, "isActive"> {
    /** Visible text, shown from the `sm` breakpoint (icon only below it). */
    label?: string;
}

const Previous = React.forwardRef<HTMLElement, PaginationStepProps>(({ label = "Previous", "aria-label": ariaLabel = "Go to previous page", asChild, children, className, ...props }, ref) => {
    if (asChild) {
        return (
            <Link ref={ref} asChild aria-label={ariaLabel} className={cn("px-2 sm:pl-2 sm:pr-3", className)} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <Link ref={ref} aria-label={ariaLabel} className={cn("px-2 sm:pl-2 sm:pr-3", className)} {...props}>
            <RiArrowLeftSLine aria-hidden="true" />
            <span className="hidden sm:inline">{children ?? label}</span>
        </Link>
    );
});
Previous.displayName = "Pagination.Previous";

const Next = React.forwardRef<HTMLElement, PaginationStepProps>(({ label = "Next", "aria-label": ariaLabel = "Go to next page", asChild, children, className, ...props }, ref) => {
    if (asChild) {
        return (
            <Link ref={ref} asChild aria-label={ariaLabel} className={cn("px-2 sm:pl-3 sm:pr-2", className)} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <Link ref={ref} aria-label={ariaLabel} className={cn("px-2 sm:pl-3 sm:pr-2", className)} {...props}>
            <span className="hidden sm:inline">{children ?? label}</span>
            <RiArrowRightSLine aria-hidden="true" />
        </Link>
    );
});
Next.displayName = "Pagination.Next";

export interface PaginationEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Text for screen readers (default "More pages"). */
    label?: string;
    size?: PaginationSize;
}

const Ellipsis = React.forwardRef<HTMLSpanElement, PaginationEllipsisProps>(({ label = "More pages", size = "md", className, ...props }, ref) => (
    <span ref={ref} className={cn("flex items-center justify-center text-muted-foreground", size === "sm" ? "size-8" : "size-9", className)} {...props}>
        <RiMoreLine aria-hidden="true" className="size-4" />
        <span className="sr-only">{label}</span>
    </span>
));
Ellipsis.displayName = "Pagination.Ellipsis";

export type PaginationRangeItem = number | "ellipsis";

export interface PaginationRangeOptions {
    /** Current page (1-based). */
    page: number;
    pageCount: number;
    /** Pages shown on each side of the current page (default 1). */
    siblingCount?: number;
    /** Pages always shown at the start and end (default 1). */
    boundaryCount?: number;
}

const range = (start: number, end: number) => (end < start ? [] : Array.from({ length: end - start + 1 }, (_, index) => start + index));

/**
 * The page numbers to render, with "ellipsis" where pages are skipped.
 * getPaginationRange({ page: 5, pageCount: 10 }) → [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 */
export function getPaginationRange({ page, pageCount, siblingCount = 1, boundaryCount = 1 }: PaginationRangeOptions): PaginationRangeItem[] {
    const count = Math.max(0, Math.floor(pageCount));
    if (count === 0) return [];
    const current = Math.min(count, Math.max(1, Math.floor(page)));
    const siblings = Math.max(0, Math.floor(siblingCount));
    const boundary = Math.max(1, Math.floor(boundaryCount));

    const startPages = range(1, Math.min(boundary, count));
    const endPages = range(Math.max(count - boundary + 1, boundary + 1), count);

    const siblingsStart = Math.max(Math.min(current - siblings, count - boundary - siblings * 2 - 1), boundary + 2);
    const siblingsEnd = Math.min(Math.max(current + siblings, boundary + siblings * 2 + 2), endPages.length > 0 ? endPages[0] - 2 : count - 1);

    const items: PaginationRangeItem[] = [...startPages];

    if (siblingsStart > boundary + 2) items.push("ellipsis");
    else if (boundary + 1 < count - boundary) items.push(boundary + 1);

    items.push(...range(siblingsStart, siblingsEnd));

    if (siblingsEnd < count - boundary - 1) items.push("ellipsis");
    else if (count - boundary > boundary) items.push(count - boundary);

    items.push(...endPages);

    // Small page counts can produce duplicates at the joins; keep the first of each.
    return items.filter((item, index) => item === "ellipsis" || items.indexOf(item) === index);
}

export { Root, Content, Item, Link, Previous, Next, Ellipsis };
