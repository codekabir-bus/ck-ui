"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RiArrowRightSLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/** Assigns a node to several refs (object or callback). */
function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
        }
    };
}

// Types for the component props
export type NavsHorizontalRootProps = React.HTMLAttributes<HTMLDivElement>;

export interface NavsHorizontalListProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Classes for the `<nav>` landmark that wraps and horizontally scrolls the list. `aria-label` / `aria-labelledby` are applied to it too. */
    wrapperClassName?: string;
}

export interface NavsHorizontalItemProps extends React.HTMLAttributes<HTMLAnchorElement | HTMLButtonElement> {
    /** Renders an `<a href>`; without it the item is a `<button type="button">`. */
    href?: string;
    /** Marks the item as current: active styling, the underline indicator and `aria-current` ("page" for links, "true" otherwise). */
    active?: boolean;
    /** Render the single child element (e.g. a Next.js `<Link>`) with the item's props, classes and ref. `arrow` is ignored. */
    asChild?: boolean;
    /** Appends `NavsHorizontal.ArrowIcon` after the label. */
    arrow?: boolean;
    target?: string;
    rel?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
}

const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Custom hook for active indicator animation
const useActiveIndicator = () => {
    const [lineStyle, setLineStyle] = React.useState({ width: 0, left: 0 });
    const [mounted, setMounted] = React.useState(false);
    const listRef = React.useRef<HTMLDivElement | null>(null);
    const listWrapperRef = React.useRef<HTMLElement | null>(null);
    const scrollTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const updateIndicator = React.useCallback(() => {
        const list = listRef.current;
        if (!list) return;

        const activeItem = list.querySelector<HTMLElement>('[data-active="true"]');
        if (!activeItem) return;

        const { offsetWidth: width, offsetLeft: left } = activeItem;
        setLineStyle((previous) => (previous.width === width && previous.left === left ? previous : { width, left }));

        const listWrapper = listWrapperRef.current;
        if (!listWrapper) return;

        // Debounce scroll to prevent unnecessary animations
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            const containerWidth = listWrapper.clientWidth;
            const scrollPosition = left - containerWidth / 2 + width / 2;

            // Only scroll if the active item is not fully visible
            const isItemVisible = left >= listWrapper.scrollLeft && left + width <= listWrapper.scrollLeft + containerWidth;
            if (!isItemVisible && typeof listWrapper.scrollTo === "function") {
                listWrapper.scrollTo({ left: scrollPosition, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            }
        }, 100);
    }, []);

    React.useEffect(() => {
        setMounted(true);
        updateIndicator();

        // Resize: window and the list itself
        window.addEventListener("resize", updateIndicator);
        const list = listRef.current;
        const resizeObserver = list && typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateIndicator) : null;
        if (list && resizeObserver) resizeObserver.observe(list);

        // DOM changes that might affect the active item
        const mutationObserver = list ? new MutationObserver(updateIndicator) : null;
        if (list && mutationObserver) {
            mutationObserver.observe(list, { subtree: true, childList: true, attributeFilter: ["data-active"] });
        }

        // Always clean up every listener, observer and pending timer.
        return () => {
            window.removeEventListener("resize", updateIndicator);
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
                scrollTimeout.current = undefined;
            }
        };
    }, [updateIndicator]);

    return { mounted, listRef, listWrapperRef, lineStyle, updateIndicator };
};

// Root component
const NavsHorizontalRoot = React.forwardRef<HTMLDivElement, NavsHorizontalRootProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("w-full", className)} {...props} />;
});
NavsHorizontalRoot.displayName = "NavsHorizontal.Root";

// List component with optimized scroll behavior
const NavsHorizontalList = React.forwardRef<HTMLDivElement, NavsHorizontalListProps>(
    ({ children, className, wrapperClassName, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, forwardedRef) => {
        const { mounted, listRef, listWrapperRef, lineStyle } = useActiveIndicator();
        const combinedRef = React.useMemo(() => composeRefs(forwardedRef, listRef), [forwardedRef, listRef]);

        return (
            <nav
                ref={listWrapperRef}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                className={cn("relative grid overflow-x-auto overflow-y-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", wrapperClassName)}
            >
                <div ref={combinedRef} className={cn("group/nav-list h-12 relative flex items-center gap-6 whitespace-nowrap border-y border-border", className)} {...props}>
                    {children}
                    {/* Animated underline indicator */}
                    <div
                        className={cn(
                            "absolute -bottom-px left-0 h-0.5 bg-primary",
                            // Tailwind 3.4 skips group-has with a nested attribute=value selector plus a /name modifier, hence :is().
                            "opacity-0 transition-all duration-slow ease-out group-has-[:is([data-active=true])]/nav-list:opacity-100",
                            {
                                hidden: !mounted,
                            }
                        )}
                        style={{
                            transform: `translate3d(${lineStyle.left}px, 0, 0)`,
                            width: `${lineStyle.width}px`,
                        }}
                        aria-hidden="true"
                        data-slot="indicator"
                    />
                </div>
            </nav>
        );
    }
);
NavsHorizontalList.displayName = "NavsHorizontal.List";

// =========== Icon rendering ===========
type IconElementProps = React.HTMLAttributes<Element> & { ref?: React.Ref<Element> };

const isComponentType = (value: unknown): value is React.ElementType =>
    typeof value === "function" || (typeof value === "object" && value !== null && "$$typeof" in value && !React.isValidElement(value));

/** Renders an icon passed as an element (`as={<Icon />}`), a component (`as={Icon}`) or as children, merging classes and the ref. */
function renderIcon(source: React.ReactNode | React.ElementType, iconClassName: string, ref: React.ForwardedRef<Element>, props: React.HTMLAttributes<Element>) {
    if (React.isValidElement<IconElementProps>(source)) {
        return React.cloneElement(source, {
            "aria-hidden": true,
            ...props,
            className: cn(iconClassName, source.props.className),
            ref: composeRefs(source.props.ref, ref),
        });
    }
    if (isComponentType(source)) {
        const Component = source;
        return <Component ref={ref} aria-hidden="true" {...props} className={iconClassName} />;
    }
    return source ?? null;
}

// Interface for the icon components
export interface NavsHorizontalIconProps extends React.HTMLAttributes<HTMLElement> {
    /** Icon element (`as={<RiUserLine />}`) or component (`as={RiUserLine}`). Falls back to `children`. */
    as?: React.ElementType | React.ReactNode;
}

const iconClassName = cn(
    "size-5 text-muted-foreground transition duration-base ease-out",
    "group-data-[active=true]/nav-item:text-primary-strong group-hover/nav-item:text-primary-strong group-focus/nav-item:text-primary-strong group-active/nav-item:text-primary-strong"
);

// Icon wrapper for navigation icons
const NavsHorizontalIcon = React.forwardRef<Element, NavsHorizontalIconProps>(({ className, as, children, ...props }, ref) => {
    return renderIcon(as ?? children, cn(iconClassName, className), ref, props);
});
NavsHorizontalIcon.displayName = "NavsHorizontal.Icon";

// Arrow icon wrapper
const NavsHorizontalArrowIcon = React.forwardRef<Element, NavsHorizontalIconProps>(({ className, as, children, ...props }, ref) => {
    const source = as ?? children ?? <RiArrowRightSLine />;
    return renderIcon(source, cn("size-5 text-muted-foreground group-hover/nav-item:text-primary-strong", className), ref, props);
});
NavsHorizontalArrowIcon.displayName = "NavsHorizontal.ArrowIcon";

// Item component that can act as a link or a button
const NavsHorizontalItem = React.forwardRef<HTMLAnchorElement | HTMLButtonElement, NavsHorizontalItemProps>(({ className, children, href, active, asChild = false, arrow = false, type, ...props }, ref) => {
    const classes = cn(
        // base
        "group/nav-item py-3.5 size-label-sm font-medium text-muted-foreground",
        "flex items-center justify-center gap-1.5",
        "transition duration-base ease-out",
        // hover, focus, active states
        "hover:text-foreground focus:text-foreground active:text-foreground",
        // focus: the scroll wrapper clips overflow, so the ring is drawn inside the item
        "focus-ring-inset rounded-md",
        "no-underline",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // active
        active && "text-foreground",
        className
    );

    if (asChild) {
        return (
            <Slot ref={ref} className={classes} data-active={active} aria-current={active ? "page" : undefined} {...(href !== undefined ? { href } : {})} {...props}>
                {children}
            </Slot>
        );
    }

    const hasArrowIcon = React.Children.toArray(children).some((child) => React.isValidElement(child) && child.type === NavsHorizontalArrowIcon);
    const content = (
        <>
            {children}
            {arrow && !hasArrowIcon && <NavsHorizontalArrowIcon />}
        </>
    );

    if (href !== undefined) {
        return (
            <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={classes} data-active={active} aria-current={active ? "page" : undefined} {...props}>
                {content}
            </a>
        );
    }

    return (
        <button ref={ref as React.Ref<HTMLButtonElement>} type={type ?? "button"} className={classes} data-active={active} aria-current={active ? "true" : undefined} {...props}>
            {content}
        </button>
    );
});
NavsHorizontalItem.displayName = "NavsHorizontal.Item";

const NavsHorizontal = {
    Root: NavsHorizontalRoot,
    List: NavsHorizontalList,
    Item: NavsHorizontalItem,
    Icon: NavsHorizontalIcon,
    ArrowIcon: NavsHorizontalArrowIcon,
    Arrow: NavsHorizontalArrowIcon,
};

export {
    NavsHorizontal,
    NavsHorizontalRoot as Root,
    NavsHorizontalList as List,
    NavsHorizontalItem as Item,
    NavsHorizontalIcon as Icon,
    NavsHorizontalArrowIcon as ArrowIcon,
    NavsHorizontalArrowIcon as Arrow, // Alias for ArrowIcon
};
