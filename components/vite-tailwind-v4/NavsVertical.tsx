import * as React from "react";
// React + Vite: a plain <a> stands in for Next.js' <Link> (same props, full-page navigation). For client-side
// routing, render your router's link through `asChild`.
const Link = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Link(props, ref) {
    return <a ref={ref} {...props} />;
});
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

// Server-compatible: no hooks or context, so NavsVertical can be rendered from server components.

// =========== Root ===========
export interface NavsVerticalRootProps extends React.HTMLAttributes<HTMLElement> {
    /** @deprecated Has no effect — mark the current item with `active` instead. */
    defaultValue?: string;
}

/** The navigation landmark. Give it an `aria-label` when the page has more than one navigation. */
const NavsVerticalRoot = React.forwardRef<HTMLElement, NavsVerticalRootProps>(
    // `defaultValue` is accepted for backward compatibility but must not reach the DOM.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ className, children, defaultValue: _defaultValue, ...props }, ref) => {
        return (
            <nav ref={ref} className={cn("w-full", className)} {...props}>
                {children}
            </nav>
        );
    }
);
NavsVerticalRoot.displayName = "NavsVertical.Root";

// =========== List ===========
const NavsVerticalList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("space-y-2 w-full", className)} {...props} />;
});
NavsVerticalList.displayName = "NavsVertical.List";

// =========== Icon rendering ===========
type IconElementProps = React.HTMLAttributes<Element> & { ref?: React.Ref<Element> };

const isComponentType = (value: unknown): value is React.ElementType =>
    typeof value === "function" || (typeof value === "object" && value !== null && "$$typeof" in value && !React.isValidElement(value));

/** Renders an icon passed as an element (`as={<Icon />}`), a component (`as={Icon}`) or as children, merging classes and the ref. */
function renderIcon(source: React.ReactNode | React.ElementType, iconClassName: string, ref: React.ForwardedRef<Element> | undefined, props: React.HTMLAttributes<Element>) {
    if (React.isValidElement<IconElementProps>(source)) {
        return React.cloneElement(source, {
            "aria-hidden": true,
            ...props,
            className: cn(iconClassName, source.props.className),
            ref: composeRefs(source.props.ref, ref ?? undefined),
        });
    }
    if (isComponentType(source)) {
        const Component = source;
        return <Component ref={ref} aria-hidden="true" {...props} className={iconClassName} />;
    }
    return source ?? null;
}

export interface NavsVerticalIconProps extends React.HTMLAttributes<HTMLElement> {
    /** Icon element (`as={<RiUserLine />}`) or component (`as={RiUserLine}`). Falls back to `children`. */
    as?: React.ElementType | React.ReactNode;
}

// =========== Icon ===========
const NavsVerticalIcon = React.forwardRef<Element, NavsVerticalIconProps>(({ className, as, children, ...props }, ref) => {
    return renderIcon(as ?? children, cn("size-5 text-muted-foreground transition duration-base ease-out group-data-[active=true]/nav-item:text-primary-strong", className), ref, props);
});
NavsVerticalIcon.displayName = "NavsVertical.Icon";

// =========== Arrow ===========
// A <span> (phrasing content) so it is valid inside the item's <a> or <button>.
const NavsVerticalArrow = React.forwardRef<HTMLSpanElement, NavsVerticalIconProps>(({ className, as, children, ...props }, ref) => {
    const icon = renderIcon(as ?? children ?? <RiArrowRightSLine />, "size-5 text-muted-foreground", undefined, {});

    return (
        <span
            ref={ref}
            aria-hidden="true"
            className={cn(
                "ml-auto p-px text-muted-foreground rounded-full bg-surface ck-dark:bg-border opacity-0 shadow-regular scale-75 transition ease-out",
                "group-data-[active=true]/nav-item:scale-100 group-data-[active=true]/nav-item:opacity-100",
                "group-focus/nav-item:scale-100 group-focus/nav-item:opacity-100",
                "group-active/nav-item:scale-100 group-active/nav-item:opacity-100",
                className
            )}
            {...props}
        >
            {icon}
        </span>
    );
});
NavsVerticalArrow.displayName = "NavsVertical.Arrow";

// =========== Item ===========
export interface NavsVerticalItemProps extends React.HTMLAttributes<HTMLElement> {
    /** Renders a Next.js `<Link>`; without it the item is a `<button type="button">`. */
    href?: string;
    /** Marks the item as current: active styling plus `aria-current` ("page" for links, "true" otherwise). */
    active?: boolean;
    /** Appends `NavsVertical.Arrow` after the label. */
    arrow?: boolean;
}

const itemFocusClasses = "focus-ring-inset focus:bg-muted focus:text-foreground";

const NavsVerticalItem = React.forwardRef<HTMLElement, NavsVerticalItemProps>(({ className, children, href, active = false, arrow = false, ...props }, ref) => {
    const hasArrow = React.Children.toArray(children).some((child) => React.isValidElement(child) && child.type === NavsVerticalArrow);

    const classes = cn(
        // base
        "group/nav-item w-full rounded-lg p-2 text-left size-label-sm font-medium text-muted-foreground",
        "transition duration-base ease-out",
        "no-underline",
        "grid auto-cols-auto grid-flow-col grid-cols-[auto,minmax(0,1fr)] items-center gap-1.5",
        // hover
        "hover:bg-muted",
        // focus: keyboard ring plus the existing focus background
        itemFocusClasses,
        // active (pressed)
        "active:bg-muted active:text-foreground",
        // active (current item)
        active && "bg-muted text-foreground",
        className
    );

    const content = (
        <>
            {children}
            {arrow && !hasArrow && <NavsVerticalArrow />}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={classes} data-active={active} aria-current={active ? "page" : undefined} ref={ref as React.Ref<HTMLAnchorElement>} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} data-active={active} aria-current={active ? "true" : undefined} ref={ref as React.Ref<HTMLButtonElement>} {...props}>
            {content}
        </button>
    );
});
NavsVerticalItem.displayName = "NavsVertical.Item";

// =========== SubList ===========
const NavsVerticalSubList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "pl-4 mt-1 space-y-0.5", // Add padding to create hierarchy and spacing
                className
            )}
            {...props}
        />
    );
});
NavsVerticalSubList.displayName = "NavsVertical.SubList";

// =========== SubItem ===========
export interface NavsVerticalSubItemProps extends React.HTMLAttributes<HTMLElement> {
    /** Renders a Next.js `<Link>`; without it the sub-item is a `<button type="button">`. */
    href?: string;
    /** Marks the sub-item as current: active styling plus `aria-current` ("page" for links, "true" otherwise). */
    active?: boolean;
}

const NavsVerticalSubItem = React.forwardRef<HTMLElement, NavsVerticalSubItemProps>(({ className, children, href, active = false, ...props }, ref) => {
    const classes = cn(
        // base
        "w-full rounded-lg py-1.5 px-3 text-left size-label-sm font-medium text-muted-foreground",
        "transition duration-base ease-out",
        "flex items-center",
        "no-underline",
        // hover
        "hover:bg-muted",
        // focus: keyboard ring plus the existing focus background
        itemFocusClasses,
        // active (pressed)
        "active:bg-muted active:text-foreground",
        // active (current item)
        active && "bg-muted text-foreground",
        className
    );

    if (href) {
        return (
            <Link href={href} className={classes} data-active={active} aria-current={active ? "page" : undefined} ref={ref as React.Ref<HTMLAnchorElement>} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} data-active={active} aria-current={active ? "true" : undefined} ref={ref as React.Ref<HTMLButtonElement>} {...props}>
            {children}
        </button>
    );
});
NavsVerticalSubItem.displayName = "NavsVertical.SubItem";

const NavsVertical = {
    Root: NavsVerticalRoot,
    List: NavsVerticalList,
    Item: NavsVerticalItem,
    SubItem: NavsVerticalSubItem,
    SubList: NavsVerticalSubList,
    Icon: NavsVerticalIcon,
    Arrow: NavsVerticalArrow,
};

export {
    NavsVertical,
    NavsVerticalRoot as Root,
    NavsVerticalList as List,
    NavsVerticalItem as Item,
    NavsVerticalSubItem as SubItem,
    NavsVerticalSubList as SubList,
    NavsVerticalIcon as Icon,
    NavsVerticalArrow as Arrow,
};
