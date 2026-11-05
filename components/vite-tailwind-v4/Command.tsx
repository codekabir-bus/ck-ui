"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { RiSearchLine } from "react-icons/ri";
import { cn } from "./lib/utils";

/*
 * A searchable list of actions or options, built on cmdk:
 *   Command.Input  → role="combobox" controlling the list (aria-activedescendant, aria-expanded)
 *   Command.List   → role="listbox"; Command.Item → role="option" (aria-selected marks the highlighted item)
 * Arrow keys move the highlight, Enter selects, Home/End jump. Filtering is built in (set shouldFilter={false}
 * to filter yourself). It is a generic primitive: it knows nothing about routing or CK-UI's docs.
 */

export type CommandRootProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;

/** `label` names the list for assistive technology. */
const Root = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, CommandRootProps>(({ className, ...props }, ref) => (
    <CommandPrimitive
        ref={ref}
        className={cn(
            "flex w-full flex-col overflow-hidden bg-surface text-surface-foreground",
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:size-subheading-2xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground",
            className
        )}
        {...props}
    />
));
Root.displayName = "Command.Root";

export interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
    /** Classes for the row around the input (icon + input + children). */
    wrapperClassName?: string;
    /** Hide the leading search icon. */
    hideIcon?: boolean;
    /** Rendered after the input, e.g. a keyboard hint. */
    children?: React.ReactNode;
}

const Input = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Input>, CommandInputProps>(({ className, wrapperClassName, hideIcon = false, children, ...props }, ref) => (
    <div className={cn("flex items-center gap-2 border-b border-border px-3", wrapperClassName)}>
        {!hideIcon && <RiSearchLine aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
        <CommandPrimitive.Input
            ref={ref}
            className={cn(
                "flex h-11 w-full border-none bg-transparent p-0 size-p-sm text-foreground outline-hidden placeholder:text-muted-foreground focus:ring-0",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
        {children}
    </div>
));
Input.displayName = "Command.Input";

const List = React.forwardRef<React.ElementRef<typeof CommandPrimitive.List>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(({ className, ...props }, ref) => (
    <CommandPrimitive.List ref={ref} className={cn("max-h-80 overflow-y-auto overflow-x-hidden p-1.5", className)} {...props} />
));
List.displayName = "Command.List";

const Empty = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Empty>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>(({ className, ...props }, ref) => (
    <CommandPrimitive.Empty ref={ref} className={cn("py-6 text-center size-p-sm text-muted-foreground", className)} {...props} />
));
Empty.displayName = "Command.Empty";

const Loading = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Loading>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>>(({ className, ...props }, ref) => (
    <CommandPrimitive.Loading ref={ref} className={cn("py-6 text-center size-p-sm text-muted-foreground", className)} {...props} />
));
Loading.displayName = "Command.Loading";

/** `heading` is shown above the group and names it for assistive technology. */
const Group = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Group>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(({ className, ...props }, ref) => (
    <CommandPrimitive.Group ref={ref} className={cn("overflow-hidden py-1", className)} {...props} />
));
Group.displayName = "Command.Group";

const Separator = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>>(({ className, ...props }, ref) => (
    // cmdk gives it role="separator", which a listbox may not contain; it is decorative (each group has a heading).
    <CommandPrimitive.Separator ref={ref} aria-hidden="true" className={cn("-mx-1.5 my-1 h-px bg-border", className)} {...props} />
));
Separator.displayName = "Command.Separator";

/**
 * An option. `onSelect` runs on Enter or click. `value` is the item's identity and is searched together with
 * `keywords`; give items with the same text a unique `value`.
 */
const Item = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Item>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(({ className, ...props }, ref) => (
    <CommandPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 size-p-sm text-foreground outline-hidden",
            "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
            "data-[disabled=true]:pointer-events-none data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-60",
            "[&>svg]:size-4 [&>svg]:shrink-0",
            className
        )}
        {...props}
    />
));
Item.displayName = "Command.Item";

/** Keyboard shortcut hint at the end of an item. Decorative: put the shortcut in `aria-keyshortcuts` if it is real. */
const Shortcut = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
    <span ref={ref} aria-hidden="true" className={cn("ml-auto font-mono size-p-xs tracking-wider text-muted-foreground", className)} {...props} />
));
Shortcut.displayName = "Command.Shortcut";

export { Root, Input, List, Empty, Loading, Group, Separator, Item, Shortcut };
