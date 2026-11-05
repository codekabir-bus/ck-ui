"use client";

import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { RiArrowDownSLine, RiArrowRightUpLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/*
 * Site or app navigation with links and panels, built on Radix NavigationMenu:
 *   <nav> landmark, triggers with aria-expanded, panels shown in a shared viewport,
 *   arrow keys move between top-level items, Tab moves into an open panel, Escape closes it and returns focus.
 * Links are plain links (not menu items). Mark the current page with `active` (aria-current="page").
 * Use `asChild` on Link for a router link. On narrow screens the panel is clamped to the viewport width;
 * for a full mobile menu, put the same links in a Drawer.
 */

export interface NavigationMenuRootProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> {
    /** Render panels in the shared, animated viewport (default). Set false to position each panel under its trigger. */
    viewport?: boolean;
}

/** Name it with `aria-label` when a page has more than one navigation landmark. */
const Root = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Root>, NavigationMenuRootProps>(({ className, children, viewport = true, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
        ref={ref}
        data-viewport={viewport}
        className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)}
        {...props}
    >
        {children}
        {viewport && <Viewport />}
    </NavigationMenuPrimitive.Root>
));
Root.displayName = "NavigationMenu.Root";

const List = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.List>, React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.List ref={ref} className={cn("flex flex-1 list-none flex-wrap items-center justify-center gap-1", className)} {...props} />
));
List.displayName = "NavigationMenu.List";

const Item = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Item ref={ref} className={cn("relative", className)} {...props} />
));
Item.displayName = "NavigationMenu.Item";

const topLevelClasses =
    "inline-flex h-9 w-max items-center justify-center gap-1 rounded-lg px-3 size-label-sm text-foreground transition-colors duration-base ease-standard hover:bg-muted focus-ring disabled:pointer-events-none disabled:opacity-50";

const Trigger = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>>(
    ({ className, children, ...props }, ref) => (
        <NavigationMenuPrimitive.Trigger ref={ref} className={cn("group", topLevelClasses, "data-[state=open]:bg-muted", className)} {...props}>
            {children}
            <RiArrowDownSLine aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-base group-data-[state=open]:rotate-180" />
        </NavigationMenuPrimitive.Trigger>
    )
);
Trigger.displayName = "NavigationMenu.Trigger";

const Content = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>>(
    ({ className, ...props }, ref) => (
        <NavigationMenuPrimitive.Content
            ref={ref}
            className={cn(
                "left-0 top-0 w-full p-2 sm:w-auto",
                "group-data-[viewport=true]/navigation-menu:data-[motion^=from-]:animate-in group-data-[viewport=true]/navigation-menu:data-[motion^=from-]:fade-in-0",
                "group-data-[viewport=true]/navigation-menu:data-[motion^=to-]:animate-out group-data-[viewport=true]/navigation-menu:data-[motion^=to-]:fade-out-0",
                "group-data-[viewport=true]/navigation-menu:data-[motion=from-end]:slide-in-from-right-8 group-data-[viewport=true]/navigation-menu:data-[motion=from-start]:slide-in-from-left-8",
                "group-data-[viewport=true]/navigation-menu:data-[motion=to-end]:slide-out-to-right-8 group-data-[viewport=true]/navigation-menu:data-[motion=to-start]:slide-out-to-left-8",
                "group-data-[viewport=true]/navigation-menu:sm:absolute",
                // Without the shared viewport each panel is its own popup under its trigger.
                "group-data-[viewport=false]/navigation-menu:absolute group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:z-dropdown group-data-[viewport=false]/navigation-menu:mt-2 group-data-[viewport=false]/navigation-menu:w-max group-data-[viewport=false]/navigation-menu:max-w-[calc(100vw-2rem)] group-data-[viewport=false]/navigation-menu:rounded-2xl group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:border-border group-data-[viewport=false]/navigation-menu:bg-surface group-data-[viewport=false]/navigation-menu:shadow-medium",
                className
            )}
            {...props}
        />
    )
);
Content.displayName = "NavigationMenu.Content";

/**
 * The shared panel container. Root renders it unless `viewport={false}`.
 * Below sm it spans the menu's own width (so it never overflows the screen); from sm it takes the open content's width.
 */
const Viewport = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Viewport>, React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>>(
    ({ className, ...props }, ref) => (
        <div className="absolute inset-x-0 top-full z-dropdown flex justify-center sm:right-auto">
            <NavigationMenuPrimitive.Viewport
                ref={ref}
                className={cn(
                    "relative mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-full max-w-[calc(100vw-2rem)] origin-top overflow-hidden rounded-2xl border border-border bg-surface text-surface-foreground shadow-medium sm:w-[var(--radix-navigation-menu-viewport-width)]",
                    "transition-[width,height] duration-base ease-standard",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    className
                )}
                {...props}
            />
        </div>
    )
);
Viewport.displayName = "NavigationMenu.Viewport";

export interface NavigationMenuLinkProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> {
    /** Opens in a new tab with rel="noopener noreferrer", an icon and screen-reader text. */
    external?: boolean;
    /** Text appended for screen readers on external links. */
    externalLabel?: string;
    /** Top-level styling (in NavigationMenu.List). Panel links use the block style. */
    variant?: "top" | "panel";
}

/** A navigation link. `active` marks the current page (aria-current="page"). Selecting a link closes the menu. */
const Link = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Link>, NavigationMenuLinkProps>(
    ({ className, external = false, externalLabel = "(opens in a new tab)", variant = "panel", asChild, children, target, rel, ...props }, ref) => {
        const classes = cn(
            variant === "top"
                ? [topLevelClasses, "data-[active]:bg-muted"]
                : "flex flex-col gap-1 rounded-xl p-3 size-p-sm text-foreground transition-colors duration-base ease-standard hover:bg-muted focus-ring data-[active]:bg-muted",
            className
        );

        if (asChild) {
            return (
                <NavigationMenuPrimitive.Link ref={ref} asChild className={classes} {...props}>
                    {children}
                </NavigationMenuPrimitive.Link>
            );
        }

        return (
            <NavigationMenuPrimitive.Link
                ref={ref}
                className={classes}
                target={external ? (target ?? "_blank") : target}
                rel={external ? (rel ?? "noopener noreferrer") : rel}
                {...props}
            >
                {children}
                {external && (
                    <>
                        <RiArrowRightUpLine aria-hidden="true" className="inline size-3.5 shrink-0 text-muted-foreground" />{" "}
                        <span className="sr-only">{externalLabel}</span>
                    </>
                )}
            </NavigationMenuPrimitive.Link>
        );
    }
);
Link.displayName = "NavigationMenu.Link";

const Indicator = React.forwardRef<React.ElementRef<typeof NavigationMenuPrimitive.Indicator>, React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>>(
    ({ className, ...props }, ref) => (
        <NavigationMenuPrimitive.Indicator
            ref={ref}
            className={cn(
                "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=visible]:fade-in-0 data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0",
                className
            )}
            {...props}
        >
            <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-border" />
        </NavigationMenuPrimitive.Indicator>
    )
);
Indicator.displayName = "NavigationMenu.Indicator";

export { Root, List, Item, Trigger, Content, Viewport, Link, Indicator };
