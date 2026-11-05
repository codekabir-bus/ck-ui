import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so Navbar can be rendered from server components.

export type NavbarItemVariant = "default" | "stroke" | "ghost";

export interface NavbarRootProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

export interface NavbarMenuProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

type AnchorOnlyProps = Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel" | "download" | "hrefLang" | "ping" | "referrerPolicy">;

export interface NavbarItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">, AnchorOnlyProps {
    children: React.ReactNode;
    /** Marks the item as the current page: active styling plus `aria-current` ("page" for links, "true" otherwise). */
    active?: boolean;
    /** Render the single child element (e.g. a Next.js `<Link>`) instead of the default element, merging Navbar.Item's props, classes and ref onto it. */
    asChild?: boolean;
    /** Renders an `<a href>`; without it the item is a `<button type="button">`. */
    href?: string;
    className?: string;
    variant?: NavbarItemVariant;
}

export interface ItemIconProps {
    as?: React.ReactElement<{ className?: string }>;
    className?: string;
}

// Define the extended type for NavbarItem with Icon
export type NavbarItemType = React.ForwardRefExoticComponent<NavbarItemProps & React.RefAttributes<HTMLButtonElement | HTMLAnchorElement>> & {
    Icon: React.FC<ItemIconProps>;
};

const navbarStyles = {
    default: "flex items-center gap-4 px-4 sm:px-6 lg:px-11 py-5 bg-surface border border-border",
};

const menuStyles = {
    default: "flex gap-1",
};

const itemStyles = {
    base: "group flex items-center no-underline gap-2 w-fit rounded-lg px-3 py-2 h-9 size-label-sm cursor-pointer transition-colors duration-base focus-ring disabled:cursor-not-allowed disabled:opacity-50",
    default: {
        normal: "text-muted-foreground hover:text-foreground",
        active: "bg-muted text-foreground",
    },
    stroke: {
        normal: "text-muted-foreground hover:text-foreground ring-1 ring-transparent",
        active: "ring-1 ring-border text-foreground",
    },
    ghost: {
        normal: "text-muted-foreground hover:text-foreground",
        active: "text-foreground",
    },
};

const iconStyles = "size-5 group-data-[state=active]:text-primary-strong";

/** The navigation landmark. Give it an `aria-label` when the page has more than one navigation. */
const Root = React.forwardRef<HTMLElement, NavbarRootProps>(({ className, children, ...props }, ref) => {
    return (
        <nav ref={ref} className={cn(navbarStyles.default, className)} {...props}>
            {children}
        </nav>
    );
});
Root.displayName = "Navbar.Root";

const Menu = React.forwardRef<HTMLDivElement, NavbarMenuProps>(({ className, children, ...props }, ref) => {
    return (
        <div ref={ref} className={cn(menuStyles.default, className)} {...props}>
            {children}
        </div>
    );
});
Menu.displayName = "Navbar.Menu";

const Icon: React.FC<ItemIconProps> = ({ as, className }) => {
    if (!as) return null;

    return React.cloneElement<{ className?: string; "aria-hidden"?: boolean }>(as, {
        "aria-hidden": true,
        className: cn(iconStyles, as.props.className, className),
    });
};
Icon.displayName = "Navbar.Icon";

const Item = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, NavbarItemProps>(({ className, active = false, children, asChild = false, href, variant = "default", type, ...props }, ref) => {
    const variantStyles = itemStyles[variant] || itemStyles.default;
    const itemClasses = cn(itemStyles.base, variantStyles.normal, active && variantStyles.active, className);
    const state = active ? "active" : "inactive";

    if (asChild) {
        return (
            <Slot
                ref={ref}
                className={itemClasses}
                data-state={state}
                aria-current={active ? "page" : undefined}
                {...(href !== undefined ? { href } : {})}
                {...(type !== undefined ? { type } : {})}
                {...props}
            >
                {children}
            </Slot>
        );
    }

    if (href !== undefined) {
        return (
            <a
                ref={ref as React.Ref<HTMLAnchorElement>}
                href={href}
                className={itemClasses}
                data-state={state}
                aria-current={active ? "page" : undefined}
                {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
            >
                {children}
            </a>
        );
    }

    return (
        <button ref={ref as React.Ref<HTMLButtonElement>} type={type ?? "button"} className={itemClasses} data-state={state} aria-current={active ? "true" : undefined} {...props}>
            {children}
        </button>
    );
}) as NavbarItemType;

// Attach the Icon component to Item
Item.Icon = Icon;
Item.displayName = "Navbar.Item";

// Create and export the Navbar namespace with properly typed components
const Navbar = {
    Root,
    Menu,
    Item,
    Icon,
};

export default Navbar;
export { Navbar, Root, Menu, Item, Icon };
