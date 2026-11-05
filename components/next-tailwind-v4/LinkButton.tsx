import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so LinkButton can be rendered from server components.

export type LinkButtonColor = "primary" | "neutral" | "destructive" | "success";
export type LinkButtonSize = "sm" | "md";

/** @deprecated Use `destructive`. */
type LegacyLinkButtonColor = "danger";
/** @deprecated Use `sm` / `md`. */
type LegacyLinkButtonSize = "small" | "medium";

const LEGACY_COLORS: Record<LegacyLinkButtonColor, LinkButtonColor> = { danger: "destructive" };
const LEGACY_SIZES: Record<LegacyLinkButtonSize, LinkButtonSize> = { small: "sm", medium: "md" };

export function resolveLinkButtonColor(color?: LinkButtonColor | LegacyLinkButtonColor | null): LinkButtonColor {
    if (!color) return "primary";
    return color in LEGACY_COLORS ? LEGACY_COLORS[color as LegacyLinkButtonColor] : (color as LinkButtonColor);
}

export function resolveLinkButtonSize(size?: LinkButtonSize | LegacyLinkButtonSize | null): LinkButtonSize {
    if (!size) return "md";
    return size in LEGACY_SIZES ? LEGACY_SIZES[size as LegacyLinkButtonSize] : (size as LinkButtonSize);
}

const linkButtonRootVariants = cva(
    [
        "group/link-button inline-flex items-center justify-center whitespace-nowrap rounded-xs",
        "transition-colors duration-base ease-standard",
        "underline decoration-transparent underline-offset-[3px]",
        "hover:decoration-current focus-visible:decoration-current",
        "focus-ring",
        "disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline ck-dark:disabled:text-muted-foreground",
        "aria-disabled:pointer-events-none aria-disabled:text-muted-foreground aria-disabled:no-underline ck-dark:aria-disabled:text-muted-foreground",
    ],
    {
        variants: {
            // Link text uses the -strong shades: at least 4.5:1 on the page background in both themes.
            color: {
                primary: "text-primary-strong hover:text-primary-hover focus-visible:text-primary-hover ck-dark:hover:text-blue-400 ck-dark:focus-visible:text-blue-400",
                neutral:
                    "text-neutral-700 hover:text-neutral-900 focus-visible:text-neutral-900 ck-dark:text-neutral-300 ck-dark:hover:text-white ck-dark:focus-visible:text-white",
                destructive: "text-destructive-strong hover:text-red-800 focus-visible:text-red-800 ck-dark:hover:text-red-400 ck-dark:focus-visible:text-red-400",
                success: "text-success-strong hover:text-success-hover focus-visible:text-success-hover ck-dark:hover:text-green-400 ck-dark:focus-visible:text-green-400",
            },
            size: {
                md: "h-5 gap-1 size-label-sm",
                sm: "h-4 gap-1 size-label-xs",
            },
            underline: {
                true: "decoration-current",
                false: "",
            },
        },
        defaultVariants: {
            color: "primary",
            size: "md",
            underline: false,
        },
    }
);

// Without an explicit size, LinkButton.Icon follows the parent LinkButton's data-size (pure CSS, works with asChild).
const linkButtonIconVariants = cva("flex shrink-0 items-center justify-center", {
    variants: {
        size: {
            inherit: "size-5 group-data-[size=sm]/link-button:size-4",
            md: "size-5",
            sm: "size-4",
        },
    },
    defaultVariants: {
        size: "inherit",
    },
});

export interface LinkButtonRootProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
    /** Render the single child element (e.g. a router link) instead of a <button>, merging LinkButton's props onto it. */
    asChild?: boolean;
    /** Render a Next.js link. Without `href` (and without `asChild`) a <button type="button"> is rendered. */
    href?: string;
    color?: LinkButtonColor | LegacyLinkButtonColor;
    /** @deprecated Use `color`. Kept for existing call sites; `color` wins when both are set. */
    variant?: LinkButtonColor | LegacyLinkButtonColor;
    size?: LinkButtonSize | LegacyLinkButtonSize;
    /** Show the underline permanently instead of only on hover and keyboard focus. */
    underline?: boolean;
}

const LinkButtonRoot = React.forwardRef<HTMLButtonElement, LinkButtonRootProps>(
    ({ className, color, variant, size, underline = false, asChild = false, href, disabled, type, children, ...props }, ref) => {
        const resolvedSize = resolveLinkButtonSize(size);
        const classes = cn(linkButtonRootVariants({ color: resolveLinkButtonColor(color ?? variant), size: resolvedSize, underline }), className);

        if (asChild) {
            return (
                <Slot ref={ref} className={classes} data-size={resolvedSize} aria-disabled={disabled || undefined} {...props}>
                    {children}
                </Slot>
            );
        }

        if (href !== undefined) {
            const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
            const anchorRef = ref as unknown as React.Ref<HTMLAnchorElement>;

            // A disabled link has no href, so it cannot be followed or focused.
            if (disabled) {
                return (
                    <a ref={anchorRef} className={classes} data-size={resolvedSize} aria-disabled="true" {...anchorProps}>
                        {children}
                    </a>
                );
            }

            return (
                <Link ref={anchorRef} href={href} className={classes} data-size={resolvedSize} {...anchorProps}>
                    {children}
                </Link>
            );
        }

        return (
            <button ref={ref} type={type ?? "button"} className={classes} data-size={resolvedSize} disabled={disabled} {...props}>
                {children}
            </button>
        );
    }
);
LinkButtonRoot.displayName = "LinkButton.Root";

export interface LinkButtonIconProps extends React.HTMLAttributes<HTMLElement> {
    /** Overrides the size inherited from LinkButton.Root. */
    size?: LinkButtonSize | LegacyLinkButtonSize;
    /** Element or icon component to render, e.g. `as={RiArrowRightSLine}`. Defaults to a <span>. */
    as?: React.ElementType;
}

const LinkButtonIcon = React.forwardRef<HTMLElement, LinkButtonIconProps>(({ as: Component = "span", className, size, ...props }, ref) => {
    return (
        <Component
            ref={ref}
            aria-hidden="true"
            className={cn(linkButtonIconVariants({ size: size ? resolveLinkButtonSize(size) : "inherit" }), className)}
            {...props}
        />
    );
});
LinkButtonIcon.displayName = "LinkButton.Icon";

const LinkButton = {
    Root: LinkButtonRoot,
    Icon: LinkButtonIcon,
};

export { LinkButton, LinkButtonRoot as Root, LinkButtonIcon as Icon, linkButtonRootVariants, linkButtonIconVariants };
export default LinkButton;
