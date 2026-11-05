"use client";

import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "./lib/utils";
import { RiArrowUpSLine } from "react-icons/ri";

// Variant styles. Structure uses semantic tokens; the dark hover/open fill uses a muted-foreground tint
// because the dark --muted and --surface tokens are the same colour.
const variantStyles = {
    default: {
        root: "flex flex-col",
        item: cn(
            "group/accordion peer w-full rounded-xl overflow-hidden transition-colors duration-base",
            "border border-muted ck-dark:border-border hover:border-transparent data-[state=open]:border-transparent",
            "bg-surface hover:bg-muted/50 data-[state=open]:bg-muted/50",
            "ck-dark:hover:bg-muted-foreground/10 ck-dark:data-[state=open]:bg-muted-foreground/10"
        ),
        trigger: cn(
            "w-full p-3.5",
            "text-foreground",
            // The item clips its children (overflow-hidden), so the ring is drawn inside the trigger.
            "focus-ring-inset",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "flex items-center text-left",
            "size-label-sm"
        ),
        arrow: {
            left: "flex relative mr-2",
            right: "flex relative ml-auto",
        },
        content: "overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        contentInner: "px-3.5 pb-3.5 pt-0 text-muted-foreground size-p-sm",
        icon: "inline-flex items-center justify-center mr-2 size-5",
    },
    ghost: {
        root: "flex flex-col",
        item: "group/accordion peer w-full",
        trigger: cn("w-full", "text-foreground", "focus-ring", "disabled:cursor-not-allowed disabled:opacity-50", "flex items-center text-left", "size-label-sm"),
        arrow: {
            left: "flex relative mr-2",
            right: "flex relative ml-auto",
        },
        content: "overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        contentInner: "py-3.5 text-muted-foreground size-p-sm",
        icon: "inline-flex items-center justify-center mr-2 size-5",
    },
    // Unstyled adds no colours or focus styles; the browser's default focus outline is kept.
    unstyled: {
        root: "flex flex-col",
        item: "group/accordion peer w-full",
        trigger: "w-full flex items-center text-left size-label-sm",
        arrow: {
            left: "flex relative mr-2",
            right: "flex relative ml-auto",
        },
        content: "overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        contentInner: "",
        icon: "inline-flex items-center justify-center mr-2 size-5",
    },
};

export type AccordionVariant = keyof typeof variantStyles;
export type AccordionHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface AccordionContextValue {
    variant: AccordionVariant;
    /** `false` renders triggers without a heading wrapper. */
    headingLevel: AccordionHeadingLevel | false;
    /** Values of the open items (mirrors Radix state so parts can render open/closed without observing the DOM). */
    openValues: readonly string[];
}

const AccordionContext = React.createContext<AccordionContextValue>({ variant: "default", headingLevel: 3, openValues: [] });
const AccordionItemValueContext = React.createContext<string | null>(null);

const toValues = (value: string | string[] | undefined): string[] => (Array.isArray(value) ? value : value ? [value] : []);

// =========== Root ===========
export type AccordionRootProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
    variant?: AccordionVariant;
    /**
     * Heading level that wraps every trigger (WAI-ARIA accordion pattern). Defaults to 3.
     * Pass `false` when the accordion is not a set of content sections, e.g. a disclosure menu inside navigation.
     */
    headingLevel?: AccordionHeadingLevel | false;
};

const Root = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Root>, AccordionRootProps>((props, ref) => {
    const { className, variant = "default", headingLevel = 3, ...rootProps } = props;
    const [uncontrolledValues, setUncontrolledValues] = React.useState<string[]>(() => toValues(rootProps.defaultValue));
    const openValues = rootProps.value !== undefined ? toValues(rootProps.value) : uncontrolledValues;

    const primitiveProps: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> =
        rootProps.type === "multiple"
            ? {
                  ...rootProps,
                  onValueChange: (value: string[]) => {
                      setUncontrolledValues(value);
                      rootProps.onValueChange?.(value);
                  },
              }
            : {
                  ...rootProps,
                  onValueChange: (value: string) => {
                      setUncontrolledValues(toValues(value));
                      rootProps.onValueChange?.(value);
                  },
              };

    const contextValue = React.useMemo<AccordionContextValue>(() => ({ variant, headingLevel, openValues }), [variant, headingLevel, openValues]);

    return (
        <AccordionContext.Provider value={contextValue}>
            <AccordionPrimitive.Root ref={ref} className={cn(variantStyles[variant].root, className)} {...primitiveProps} />
        </AccordionContext.Provider>
    );
});
Root.displayName = "Accordion.Root";

const useAccordionContext = () => React.useContext(AccordionContext);

// =========== Item ===========
export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
    variant?: AccordionVariant;
};

const Item = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Item>, AccordionItemProps>(({ className, variant: itemVariant, value, ...props }, ref) => {
    const { variant: contextVariant } = useAccordionContext();
    const variant = itemVariant || contextVariant;

    return (
        <AccordionItemValueContext.Provider value={value}>
            <AccordionPrimitive.Item ref={ref} value={value} className={cn(variantStyles[variant].item, className)} {...props} />
        </AccordionItemValueContext.Provider>
    );
});
Item.displayName = "Accordion.Item";

// =========== Trigger ===========
export type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    variant?: AccordionVariant;
    /** Overrides the heading level set on Root for this trigger. `false` renders no heading. */
    headingLevel?: AccordionHeadingLevel | false;
};

// Resets heading typography/margins so the heading wrapper does not change the trigger's appearance.
const headingClassName = "m-0 flex w-full [font:inherit] [letter-spacing:inherit] text-inherit";

const Trigger = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Trigger>, AccordionTriggerProps>(
    ({ className, children, variant: triggerVariant, headingLevel: triggerHeadingLevel, asChild = false, ...props }, ref) => {
        const context = useAccordionContext();
        const variant = triggerVariant || context.variant;
        const headingLevel = triggerHeadingLevel ?? context.headingLevel;

        const trigger = (
            <AccordionPrimitive.Trigger ref={ref} className={cn(variantStyles[variant].trigger, className)} asChild={asChild} {...props}>
                {children}
            </AccordionPrimitive.Trigger>
        );

        if (headingLevel === false) return trigger;

        const Heading = `h${headingLevel}` as const;
        return (
            <AccordionPrimitive.Header asChild>
                <Heading className={headingClassName}>{trigger}</Heading>
            </AccordionPrimitive.Header>
        );
    }
);
Trigger.displayName = "Accordion.Trigger";

// =========== Arrow ===========
export interface AccordionArrowProps extends React.HTMLAttributes<HTMLSpanElement> {
    position?: "left" | "right";
    variant?: AccordionVariant;
    /** Icon shown while the item is open (use together with `closeIcon`). */
    openIcon?: React.ReactNode;
    /** Icon shown while the item is closed (use together with `openIcon`). */
    closeIcon?: React.ReactNode;
}

// Renders a <span> so it is valid phrasing content inside the trigger <button>.
const Arrow = React.forwardRef<HTMLSpanElement, AccordionArrowProps>(({ className, position = "right", variant: arrowVariant, openIcon, closeIcon, ...props }, ref) => {
    const context = useAccordionContext();
    const itemValue = React.useContext(AccordionItemValueContext);
    const variant = arrowVariant || context.variant;
    const open = itemValue !== null && context.openValues.includes(itemValue);

    return (
        <span ref={ref} aria-hidden="true" data-state={open ? "open" : "closed"} className={cn(variantStyles[variant].arrow[position], className)} {...props}>
            {openIcon && closeIcon ? (
                open ? (
                    openIcon
                ) : (
                    closeIcon
                )
            ) : (
                <RiArrowUpSLine className={cn("size-5 transition-transform duration-base text-muted-foreground", open ? "rotate-0" : "rotate-180")} />
            )}
        </span>
    );
});
Arrow.displayName = "Accordion.Arrow";

// =========== Content ===========
export type AccordionContentProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
    variant?: AccordionVariant;
};

const Content = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Content>, AccordionContentProps>(({ className, children, variant: contentVariant, ...props }, ref) => {
    const { variant: contextVariant } = useAccordionContext();
    const variant = contentVariant || contextVariant;

    return (
        <AccordionPrimitive.Content ref={ref} className={cn(variantStyles[variant].content, className)} {...props}>
            <div className={cn(variantStyles[variant].contentInner)}>{children}</div>
        </AccordionPrimitive.Content>
    );
});
Content.displayName = "Accordion.Content";

// =========== Icon ===========
type IconElementProps = { className?: string; "aria-hidden"?: boolean | "true" | "false" };

export interface AccordionIconProps {
    /** Icon element to render, e.g. `as={<RiLockLine />}`. `children` is used when `as` is not set. */
    as?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    variant?: AccordionVariant;
    /** @deprecated Pass colour classes through `className`. */
    color?: string;
    /** @deprecated Pass size classes through `className`. */
    size?: string;
}

const Icon = ({ as, children, className, variant: iconVariant, color, size }: AccordionIconProps) => {
    const { variant: contextVariant } = useAccordionContext();
    const variant = iconVariant || contextVariant;
    const iconContent = as ?? children;

    if (React.isValidElement<IconElementProps>(iconContent)) {
        return React.cloneElement(iconContent, {
            "aria-hidden": true,
            className: cn(variantStyles[variant].icon, size, color, className, iconContent.props.className),
        });
    }

    // Non-element content (text, fragments) is rendered as-is.
    return <>{iconContent}</>;
};
Icon.displayName = "Accordion.Icon";

const Accordion = { Root, Item, Trigger, Content, Arrow, Icon };

export { Accordion, Root, Item, Trigger, Content, Arrow, Icon };
