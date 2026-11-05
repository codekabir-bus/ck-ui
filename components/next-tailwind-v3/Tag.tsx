"use client";

// Client component: Tag.DismissButton reads the Root's `disabled` state from context so the
// dismiss button is really disabled (not only styled) inside a disabled tag.

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./lib/utils";
import { RiCloseLine } from "react-icons/ri";

export type TagVariant = "default" | "stroke";
export type TagPartSize = "sm" | "md";

/** @deprecated Use `md` / `sm`. */
type LegacyTagPartSize = "default" | "small";

const LEGACY_PART_SIZES: Record<LegacyTagPartSize, TagPartSize> = { default: "md", small: "sm" };

function resolveTagPartSize(size?: TagPartSize | LegacyTagPartSize | null): TagPartSize {
    if (!size) return "md";
    return size in LEGACY_PART_SIZES ? LEGACY_PART_SIZES[size as LegacyTagPartSize] : (size as TagPartSize);
}

const tagVariants = cva(["group/tag inline-flex h-6 items-center gap-2 rounded-md px-2 size-label-xs", "ring-1 ring-inset transition-colors duration-base ease-standard"], {
    variants: {
        variant: {
            default: "bg-muted ring-muted text-neutral-600 hover:bg-transparent ck-dark:text-neutral-400 ck-dark:hover:ring-neutral-800",
            stroke: "bg-transparent ring-muted text-neutral-600 hover:bg-muted ck-dark:text-neutral-400",
        },
        disabled: {
            true: "pointer-events-none bg-neutral-50 text-neutral-300 ring-neutral-50 ck-dark:bg-neutral-900 ck-dark:text-neutral-600 ck-dark:ring-neutral-900",
            false: "",
        },
    },
    defaultVariants: {
        variant: "default",
        disabled: false,
    },
});

const tagIconVariants = cva(
    [
        "-mx-1 flex shrink-0 items-center justify-center text-neutral-400 transition-colors duration-base ease-standard ck-dark:text-neutral-600",
        "group-hover/tag:text-neutral-600 ck-dark:group-hover/tag:text-neutral-400",
        "group-data-[disabled]/tag:text-neutral-300 ck-dark:group-data-[disabled]/tag:text-neutral-700",
    ],
    {
        variants: {
            size: {
                md: "size-4",
                sm: "size-3",
            },
        },
        defaultVariants: {
            size: "md",
        },
    }
);

const tagDismissButtonVariants = cva(
    [
        "-mr-1 ml-1 inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-base ease-standard",
        "hover:bg-neutral-200 ck-dark:hover:bg-neutral-800",
        "focus-ring",
        "disabled:pointer-events-none disabled:text-neutral-300 ck-dark:disabled:text-neutral-700",
        "aria-disabled:pointer-events-none aria-disabled:text-neutral-300 ck-dark:aria-disabled:text-neutral-700",
    ],
    {
        variants: {
            size: {
                md: "size-4",
                sm: "size-3",
            },
        },
        defaultVariants: {
            size: "md",
        },
    }
);

const TagContext = React.createContext<{ disabled: boolean }>({ disabled: false });

export interface TagRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Render the single child element instead of a <div>, merging Tag's props onto it. */
    asChild?: boolean;
    variant?: TagVariant;
    /** Mutes the tag and disables its DismissButton. */
    disabled?: boolean;
}

const TagRoot = React.forwardRef<HTMLDivElement, TagRootProps>(({ className, variant = "default", disabled = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    const contextValue = React.useMemo(() => ({ disabled }), [disabled]);

    return (
        <TagContext.Provider value={contextValue}>
            <Comp ref={ref} data-disabled={disabled ? "" : undefined} className={cn(tagVariants({ variant, disabled }), className)} {...props} />
        </TagContext.Provider>
    );
});
TagRoot.displayName = "Tag.Root";

export interface TagIconProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
    /**
     * The icon: a component (`as={RiPushpinFill}`) or an element (`as={<RiPushpinFill />}`).
     * An element receives the icon classes and ref; a component is rendered with them.
     * Tag is a client component: from a Server Component pass an element, since component references
     * cannot cross the server/client boundary.
     */
    as?: React.ElementType | React.ReactElement;
    /** Alternative to `as`: an icon element, or any content to wrap in the icon box. */
    children?: React.ReactNode;
    size?: TagPartSize | LegacyTagPartSize;
}

const TagIcon = React.forwardRef<HTMLElement, TagIconProps>(({ as, children, className, size, ...props }, ref) => {
    const classes = cn(tagIconVariants({ size: resolveTagPartSize(size) }), className);
    const content = as ?? children;

    // A single element (passed as `as` or as the only child) becomes the icon itself. Its own className is
    // merged with cn() first so it wins over the defaults (Slot alone would only concatenate them).
    if (React.isValidElement<{ className?: string }>(content)) {
        return (
            <Slot ref={ref} aria-hidden="true" className={cn(classes, content.props.className)} {...props}>
                {content}
            </Slot>
        );
    }

    // An icon component.
    if (as !== undefined && as !== null) {
        const Component = as as React.ElementType;
        return <Component ref={ref} aria-hidden="true" className={classes} {...props} />;
    }

    return (
        <span ref={ref} aria-hidden="true" className={classes} {...props}>
            {children}
        </span>
    );
});
TagIcon.displayName = "Tag.Icon";

export interface TagDismissButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Render the single child element instead of a <button>; the child provides its own content and accessible name. */
    asChild?: boolean;
    size?: TagPartSize | LegacyTagPartSize;
}

const TagDismissButton = React.forwardRef<HTMLButtonElement, TagDismissButtonProps>(
    ({ className, size, asChild = false, disabled: disabledProp, type, children, ...props }, ref) => {
        const context = React.useContext(TagContext);
        const disabled = Boolean(disabledProp || context.disabled);
        const classes = cn(tagDismissButtonVariants({ size: resolveTagPartSize(size) }), className);

        if (asChild) {
            return (
                <Slot ref={ref} className={classes} aria-disabled={disabled || undefined} {...props}>
                    {children}
                </Slot>
            );
        }

        // The built-in icon-only button gets a default accessible name; custom children must provide their own.
        const hasCustomContent = children !== undefined && children !== null;
        const ariaLabel = props["aria-label"] ?? (hasCustomContent || props["aria-labelledby"] ? undefined : "Remove");

        return (
            <button ref={ref} type={type ?? "button"} className={classes} disabled={disabled} {...props} aria-label={ariaLabel}>
                {hasCustomContent ? children : <RiCloseLine className="size-3" aria-hidden="true" />}
            </button>
        );
    }
);
TagDismissButton.displayName = "Tag.DismissButton";

const Tag = {
    Root: TagRoot,
    Icon: TagIcon,
    DismissButton: TagDismissButton,
};

export { Tag, TagRoot as Root, TagIcon as Icon, TagDismissButton as DismissButton, tagVariants, tagIconVariants, tagDismissButtonVariants };
export default Tag;
