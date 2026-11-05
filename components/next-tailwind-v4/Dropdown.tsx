"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "./lib/utils";
import { RiArrowDownSLine } from "react-icons/ri";
import { usePortalContainer } from "./ThemeScope";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Open state that works both controlled (`open` + `onOpenChange`) and uncontrolled (`defaultOpen`). */
function useControllableOpen(open: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
    const isControlled = open !== undefined;
    const value = isControlled ? open : uncontrolledOpen;

    const latest = React.useRef({ value, isControlled, onOpenChange });
    useIsomorphicLayoutEffect(() => {
        latest.current = { value, isControlled, onOpenChange };
    });

    const setOpen = React.useCallback((next: boolean) => {
        const current = latest.current;
        if (next === current.value) return;
        if (!current.isControlled) setUncontrolledOpen(next);
        current.onOpenChange?.(next);
    }, []);

    return [value, setOpen] as const;
}

// Animation variants
export const animationVariants = {
    scaleUp: {
        hidden: {
            opacity: 0,
            scale: 0.95,
            transformOrigin: "top right",
        },
        visible: {
            opacity: 1,
            scale: 1,
            transformOrigin: "top right",
        },
    },
    slideDown: {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 },
    },
    slideUp: {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    },
    slideLeft: {
        hidden: { opacity: 0, x: 10 },
        visible: { opacity: 1, x: 0 },
    },
    slideRight: {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
} satisfies Record<string, Variants>;

export type AnimationVariant = keyof typeof animationVariants;
export type Position = "top" | "bottom" | "left" | "right";
type Side = Position;
type Align = "start" | "center" | "end";

const ANIMATION_BY_SIDE: Record<Side, AnimationVariant> = {
    top: "slideUp",
    bottom: "slideDown",
    left: "slideLeft",
    right: "slideRight",
};

const MOTION_TRANSITION = { duration: 0.2, ease: "easeOut" } as const;

// Shared panel and item styles.
const panelClasses = "z-dropdown overflow-hidden rounded-2xl border border-border bg-surface p-2 text-surface-foreground shadow-medium";

const itemBaseClasses = cn(
    "relative flex cursor-pointer select-none items-center gap-2 rounded-lg p-2 size-p-sm text-muted-foreground outline-hidden",
    "transition-colors duration-fast ease-standard",
    // Highlight = hover and keyboard focus (Radix moves focus to the highlighted item). The highlight colour alone is too
    // faint to see the keyboard position (1.1:1), so keyboard focus also shows the inset focus ring.
    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground focus-ring-inset",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
);

// Context for sharing position and animation between components
interface DropdownContextType {
    position: Position;
    animationVariant?: AnimationVariant;
    open: boolean;
}

const DropdownContext = React.createContext<DropdownContextType>({
    position: "bottom",
    open: false,
});

// Context for submenus
interface SubMenuContextType {
    animationVariant?: AnimationVariant;
    open: boolean;
}

const SubMenuContext = React.createContext<SubMenuContextType>({
    open: false,
});

// Size variants - exported for documentation and consistency
export const DROPDOWN_SIZES = {
    sm: "min-w-[6rem]", // 96px
    md: "min-w-[8rem]", // 128px - default
    lg: "min-w-[12rem]", // 192px
    xl: "min-w-[20rem]", // 320px
    auto: "w-max", // fits content
} as const;

export type DropdownSize = keyof typeof DROPDOWN_SIZES;

// ---------------------------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------------------------

export interface RootProps extends Omit<DropdownMenuPrimitive.DropdownMenuProps, "modal">, Omit<React.HTMLAttributes<HTMLDivElement>, "dir" | "children"> {
    /** Side of the trigger the menu opens on. @default "bottom" */
    position?: Position;
    /** Open/close animation. Defaults to a slide that matches `position`. */
    animationVariant?: AnimationVariant;
    children: React.ReactNode;
    /** Applied to the wrapper element around the trigger. */
    className?: string;
}

/** Works controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`). Renders a wrapper `div` around its children. */
const Root = React.forwardRef<HTMLDivElement, RootProps>(
    ({ children, position = "bottom", animationVariant, className, open: openProp, defaultOpen, onOpenChange, dir, ...props }, ref) => {
        const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
        const context = React.useMemo(() => ({ position, animationVariant, open }), [position, animationVariant, open]);

        return (
            <DropdownContext.Provider value={context}>
                <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen} dir={dir}>
                    <div ref={ref} className={cn("relative", className)} {...props}>
                        {children}
                    </div>
                </DropdownMenuPrimitive.Root>
            </DropdownContext.Provider>
        );
    }
);
Root.displayName = "Dropdown.Root";

// ---------------------------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------------------------

export interface TriggerProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
    /** @deprecated Has no effect. Render your own indicator icon inside the trigger. */
    showArrow?: boolean;
}

/**
 * Renders a `<button type="button">`. With `asChild`, the child must be focusable (a button or link);
 * a plain `div` child is not reachable or operable from the keyboard.
 */
const Trigger = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Trigger>, TriggerProps>(({ className, children, asChild, showArrow, ...props }, ref) => {
    void showArrow; // Deprecated no-op; destructured so it never reaches the DOM.
    return (
        <DropdownMenuPrimitive.Trigger ref={ref} asChild={asChild} className={cn("inline-flex items-center gap-2 focus-ring", !asChild && "rounded-lg", className)} {...props}>
            {children}
        </DropdownMenuPrimitive.Trigger>
    );
});
Trigger.displayName = "Dropdown.Trigger";

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

const PLACEMENT_BY_POSITION: Record<Position, { side: Side; align: Align }> = {
    top: { side: "top", align: "start" },
    bottom: { side: "bottom", align: "start" },
    left: { side: "left", align: "start" },
    right: { side: "right", align: "start" },
};

export interface ContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
    /** Has no effect: the content is always mounted while open and during its exit animation. */
    forceMount?: true;
    /**
     * Controls the minimum width of the dropdown content
     * @default "md"
     */
    size?: DropdownSize;
}

/** The menu panel (`role="menu"`); `className` goes on it. `side`/`align` override the Root `position`. */
const Content = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>, ContentProps>(
    ({ className, sideOffset = 4, size = "md", side: sideProp, align: alignProp, children, ...props }, ref) => {
        const { position, animationVariant, open } = React.useContext(DropdownContext);
        const placement = PLACEMENT_BY_POSITION[position];
        const side = sideProp ?? placement.side;
        const align = alignProp ?? placement.align;
        const currentAnimation = animationVariant ?? ANIMATION_BY_SIDE[side];
        const container = usePortalContainer();

        return (
            <AnimatePresence>
                {open && (
                    <DropdownMenuPrimitive.Portal forceMount container={container}>
                        <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} side={side} align={align} asChild forceMount {...props}>
                            <motion.div
                                className={cn(panelClasses, DROPDOWN_SIZES[size], className)}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={animationVariants[currentAnimation]}
                                transition={MOTION_TRANSITION}
                            >
                                {children}
                            </motion.div>
                        </DropdownMenuPrimitive.Content>
                    </DropdownMenuPrimitive.Portal>
                )}
            </AnimatePresence>
        );
    }
);
Content.displayName = "Dropdown.Content";

// ---------------------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------------------

export interface ItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
    /** Renders the item as a link (`<a href>`); the ref then points at the anchor. */
    href?: string;
}

const Item = React.forwardRef<HTMLElement, ItemProps>(({ className, children, href, ...props }, ref) => {
    const itemRef = ref as React.Ref<HTMLDivElement>;

    if (href) {
        return (
            <DropdownMenuPrimitive.Item ref={itemRef} asChild className={cn(itemBaseClasses, "w-full", className)} {...props}>
                <a href={href}>{children}</a>
            </DropdownMenuPrimitive.Item>
        );
    }

    return (
        <DropdownMenuPrimitive.Item ref={itemRef} className={cn(itemBaseClasses, className)} {...props}>
            {children}
        </DropdownMenuPrimitive.Item>
    );
});
Item.displayName = "Dropdown.Item";

const indicatorClasses = "absolute left-2 flex size-4 items-center justify-center text-foreground";

const CheckboxItem = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>>(
    ({ className, children, ...props }, ref) => (
        <DropdownMenuPrimitive.CheckboxItem ref={ref} className={cn(itemBaseClasses, "pl-8", className)} {...props}>
            <span className={indicatorClasses} aria-hidden="true">
                <DropdownMenuPrimitive.ItemIndicator>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path
                            d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    )
);
CheckboxItem.displayName = "Dropdown.CheckboxItem";

const RadioItem = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>>(
    ({ className, children, ...props }, ref) => (
        <DropdownMenuPrimitive.RadioItem ref={ref} className={cn(itemBaseClasses, "pl-8", className)} {...props}>
            <span className={indicatorClasses} aria-hidden="true">
                <DropdownMenuPrimitive.ItemIndicator>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M7.5 10C8.88071 10 10 8.88071 10 7.5C10 6.11929 8.88071 5 7.5 5C6.11929 5 5 6.11929 5 7.5C5 8.88071 6.11929 10 7.5 10Z" fill="currentColor"></path>
                    </svg>
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    )
);
RadioItem.displayName = "Dropdown.RadioItem";

const Label = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => <DropdownMenuPrimitive.Label ref={ref} className={cn("px-2 py-1.5 size-label-sm text-foreground", inset && "pl-8", className)} {...props} />);
Label.displayName = "Dropdown.Label";

const Separator = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
Separator.displayName = "Dropdown.Separator";

const Shortcut = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
    <span ref={ref} className={cn("ml-auto size-p-xs tracking-widest opacity-60", className)} {...props} />
));
Shortcut.displayName = "Dropdown.Shortcut";

const Group = DropdownMenuPrimitive.Group;
const RadioGroup = DropdownMenuPrimitive.RadioGroup;

// ---------------------------------------------------------------------------------------------
// Sub menus
// ---------------------------------------------------------------------------------------------

export interface SubProps extends DropdownMenuPrimitive.DropdownMenuSubProps {
    /**
     * @deprecated Has no effect. Radix always opens sub-menus beside their trigger on the inline-end side
     * (right in LTR) and flips them to the other side when there is no room.
     */
    position?: Position;
    /** Open/close animation of the sub-menu. @default "slideRight" */
    animationVariant?: AnimationVariant;
    children: React.ReactNode;
}

/** Works controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`). */
const Sub = ({ children, animationVariant, open: openProp, defaultOpen, onOpenChange }: SubProps) => {
    const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
    const context = React.useMemo(() => ({ animationVariant, open }), [animationVariant, open]);

    return (
        <SubMenuContext.Provider value={context}>
            <DropdownMenuPrimitive.Sub open={open} onOpenChange={setOpen}>
                {children}
            </DropdownMenuPrimitive.Sub>
        </SubMenuContext.Provider>
    );
};
Sub.displayName = "Dropdown.Sub";

const SubTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
        inset?: boolean;
    }
>(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger ref={ref} className={cn(itemBaseClasses, "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", inset && "pl-8", className)} {...props}>
        {children}
        {/* Sub-menus open on the inline-end side, so the chevron points that way. */}
        <RiArrowDownSLine aria-hidden="true" className="ml-auto size-4 -rotate-90 rtl:rotate-90" />
    </DropdownMenuPrimitive.SubTrigger>
));
SubTrigger.displayName = "Dropdown.SubTrigger";

const SubContent = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>>(
    ({ className, sideOffset = 8, children, ...props }, ref) => {
        const { animationVariant, open } = React.useContext(SubMenuContext);
        const currentAnimation = animationVariant ?? "slideRight";
        const container = usePortalContainer();

        return (
            <AnimatePresence>
                {open && (
                    <DropdownMenuPrimitive.Portal forceMount container={container}>
                        <DropdownMenuPrimitive.SubContent ref={ref} sideOffset={sideOffset} asChild forceMount {...props}>
                            <motion.div
                                className={cn(panelClasses, "min-w-[8rem]", className)}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={animationVariants[currentAnimation]}
                                transition={MOTION_TRANSITION}
                            >
                                {children}
                            </motion.div>
                        </DropdownMenuPrimitive.SubContent>
                    </DropdownMenuPrimitive.Portal>
                )}
            </AnimatePresence>
        );
    }
);
SubContent.displayName = "Dropdown.SubContent";

// ---------------------------------------------------------------------------------------------
// Button (simple trigger button kept for existing consumers; prefer Button.Root with Trigger asChild)
// ---------------------------------------------------------------------------------------------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "neutral-stroke" | string;
    children: React.ReactNode;
    className?: string;
}

const DropdownButtonRoot = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant, className, type, ...props }, ref) => (
    <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 focus-ring",
            variant === "neutral-stroke" && "border border-border hover:bg-muted",
            // Rotate the icon while the menu is open
            "[&_svg]:transition-transform [&_svg]:duration-base data-[state=open]:[&_svg]:rotate-180",
            className
        )}
        {...props}
    >
        {children}
    </button>
));
DropdownButtonRoot.displayName = "Dropdown.Button";

const Button = {
    Root: DropdownButtonRoot,
};

export { Root, Trigger, Content, Item, CheckboxItem, RadioItem, Label, Separator, Shortcut, Group, RadioGroup, Sub, SubTrigger, SubContent, Button };
