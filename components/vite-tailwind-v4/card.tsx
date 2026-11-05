import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

// Server-compatible: no hooks or context, so Card can be rendered from server components.
// Card.Root is a padded container; the optional parts (Header, Title, Description, Content, Footer)
// space themselves with --card-spacing, which Root sets per size. Plain children are left untouched.

const cardRootVariants = cva("rounded-xl", {
    variants: {
        variant: {
            default: "border border-border",
            // No token matches neutral-800 in dark mode, so the palette classes stay.
            ghost: "hover:bg-neutral-100 ck-dark:hover:bg-neutral-800",
        },
        size: {
            sm: "p-3 size-p-sm [--card-spacing:0.75rem]",
            md: "p-4 size-p-md [--card-spacing:1rem]",
            lg: "p-6 size-p-lg [--card-spacing:1.5rem]",
        },
        width: {
            auto: "w-auto",
            full: "w-full",
            fit: "w-fit",
            /** @deprecated Same as `auto`. */
            constrained: "w-auto",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "md",
    },
});

// Every part after the first is separated from the previous one by the Root's spacing.
const partSpacing = "[&:not(:first-child)]:mt-[var(--card-spacing,1rem)]";

export interface CardRootProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardRootVariants> {
    /** Render the single child element instead of a <div>, merging Card's props onto it. */
    asChild?: boolean;
}

const CardRoot = React.forwardRef<HTMLDivElement, CardRootProps>(({ className, variant, size, width, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "div";
    return <Component ref={ref} className={cn(cardRootVariants({ variant, size, width }), className)} {...props} />;
});
CardRoot.displayName = "Card.Root";

interface CardPartProps extends React.HTMLAttributes<HTMLElement> {
    /** Render the single child element instead of the default element, merging the part's props onto it. */
    asChild?: boolean;
}

export type CardHeaderProps = CardPartProps;

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "div";
    return <Component ref={ref} className={cn("flex flex-col gap-1", partSpacing, className)} {...props} />;
});
CardHeader.displayName = "Card.Header";

export type CardTitleProps = CardPartProps;

/** Renders an <h3> by default; use `asChild` to pick the heading level that fits the page outline. */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "h3";
    return <Component ref={ref} className={cn("size-label-lg text-foreground", className)} {...props} />;
});
CardTitle.displayName = "Card.Title";

export type CardDescriptionProps = CardPartProps;

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "p";
    return <Component ref={ref} className={cn("size-p-sm text-muted-foreground", className)} {...props} />;
});
CardDescription.displayName = "Card.Description";

export type CardContentProps = CardPartProps;

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "div";
    return <Component ref={ref} className={cn(partSpacing, className)} {...props} />;
});
CardContent.displayName = "Card.Content";

export type CardFooterProps = CardPartProps;

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "div";
    return <Component ref={ref} className={cn("flex items-center gap-2", partSpacing, className)} {...props} />;
});
CardFooter.displayName = "Card.Footer";

export {
    CardRoot as Root,
    CardHeader as Header,
    CardTitle as Title,
    CardDescription as Description,
    CardContent as Content,
    CardFooter as Footer,
    cardRootVariants,
};
