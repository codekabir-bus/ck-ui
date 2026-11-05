"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";
import { cn } from "./lib/utils";
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

// Animation variants (framer-motion). Reduced motion is handled globally via MotionConfig.
const modalVariants: Record<ModalAnimation, Variants> = {
    scale: {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    },
    slideDown: {
        hidden: { opacity: 0, y: "-10%" },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: "-10%", transition: { duration: 0.2 } },
    },
    slideUp: {
        hidden: { opacity: 0, y: "10%" },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: "10%", transition: { duration: 0.2 } },
    },
    fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
    },
};

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

export type ModalAnimation = "scale" | "slideDown" | "slideUp" | "fade";
export type ModalSize = "xs" | "sm" | "md" | "lg" | "full";
export type ModalPosition = "top" | "center" | "bottom";

// Every size fills the available width on small screens and is capped from there.
const sizeClasses: Record<ModalSize, string> = {
    xs: "w-full max-w-[440px]",
    sm: "w-full max-w-lg",
    md: "w-full max-w-2xl",
    lg: "w-full lg:max-w-4xl",
    full: "w-full h-full",
};

// Vertical placement uses auto margins, so tall content still scrolls from its top edge.
const positionClasses: Record<ModalPosition, string> = {
    top: "mb-auto",
    center: "my-auto",
    bottom: "mt-auto",
};

// ---------------------------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------------------------

interface ModalStateContextValue {
    open: boolean;
    modal: boolean;
}

const ModalStateContext = React.createContext<ModalStateContextValue>({ open: false, modal: true });

interface ModalPartsContextValue {
    showCloseButton: boolean;
    registerDescription: () => () => void;
}

const ModalPartsContext = React.createContext<ModalPartsContextValue | null>(null);

// ---------------------------------------------------------------------------------------------
// Root / Trigger / Close
// ---------------------------------------------------------------------------------------------

export type ModalRootProps = DialogPrimitive.DialogProps;

/** Works controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`, `Modal.Trigger`). */
const ModalRoot = ({ open: openProp, defaultOpen, onOpenChange, modal = true, children }: ModalRootProps) => {
    const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
    const state = React.useMemo(() => ({ open, modal }), [open, modal]);

    return (
        <ModalStateContext.Provider value={state}>
            <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={modal}>
                {children}
            </DialogPrimitive.Root>
        </ModalStateContext.Provider>
    );
};
ModalRoot.displayName = "Modal.Root";

const ModalTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>>((props, ref) => (
    <DialogPrimitive.Trigger ref={ref} {...props} />
));
ModalTrigger.displayName = "Modal.Trigger";

const ModalClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>>((props, ref) => <DialogPrimitive.Close ref={ref} {...props} />);
ModalClose.displayName = "Modal.Close";

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

export interface ModalContentProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "asChild" | "forceMount"> {
    /**
     * @deprecated The open state comes from `Modal.Root` (controlled or uncontrolled). When passed, it still overrides
     * the Root state for rendering.
     */
    open?: boolean;
    animation?: ModalAnimation;
    size?: ModalSize;
    position?: ModalPosition;
    /** Renders an icon button labelled "Close" in the top-right corner. */
    showCloseButton?: boolean;
}

/**
 * The dialog panel. `className` and DOM props go on the panel (the element with `role="dialog"`).
 * Render a `Modal.Title` inside it (visually hidden with `className="sr-only"` if needed); `Modal.Description` is optional.
 */
const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
    ({ children, open: openProp, animation = "scale", size = "md", position = "center", showCloseButton = false, className, ...props }, forwardedRef) => {
        const state = React.useContext(ModalStateContext);
        const open = openProp ?? state.open;

        // Only point aria-describedby at Modal.Description when one is rendered (avoids a dangling reference and Radix's warning).
        const [descriptionCount, setDescriptionCount] = React.useState(0);
        const registerDescription = React.useCallback(() => {
            setDescriptionCount((count) => count + 1);
            return () => setDescriptionCount((count) => count - 1);
        }, []);
        const parts = React.useMemo(() => ({ showCloseButton, registerDescription }), [showCloseButton, registerDescription]);
        const describedByProps = descriptionCount > 0 ? {} : { "aria-describedby": undefined };
        const container = usePortalContainer();

        const panel = (
            <DialogPrimitive.Content ref={forwardedRef} asChild forceMount {...describedByProps} {...props}>
                <motion.div
                    className={cn(
                        "relative bg-background pointer-events-auto",
                        sizeClasses[size],
                        positionClasses[position],
                        size === "full" ? "" : "rounded-20",
                        className
                    )}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants[animation]}
                >
                    <ModalPartsContext.Provider value={parts}>{children}</ModalPartsContext.Provider>
                    {showCloseButton && (
                        <DialogPrimitive.Close
                            aria-label="Close"
                            className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-muted hover:text-foreground focus-ring"
                        >
                            <RiCloseLine aria-hidden="true" className="size-5" />
                        </DialogPrimitive.Close>
                    )}
                </motion.div>
            </DialogPrimitive.Content>
        );

        // The scroll container doubles as the click-outside area; the panel is a child so tall dialogs can scroll.
        const containerClasses = cn("fixed inset-0 z-modal flex justify-center overflow-y-auto", size === "full" ? "" : "p-4", position !== "center" && "py-8");

        return (
            <AnimatePresence>
                {open && (
                    <DialogPrimitive.Portal forceMount container={container}>
                        {state.modal ? (
                            <DialogPrimitive.Overlay forceMount className={containerClasses}>
                                <motion.div
                                    aria-hidden="true"
                                    className="fixed inset-0 bg-overlay backdrop-blur-sm"
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={backdropVariants}
                                />
                                {panel}
                            </DialogPrimitive.Overlay>
                        ) : (
                            <div className={cn(containerClasses, "pointer-events-none")}>{panel}</div>
                        )}
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        );
    }
);
ModalContent.displayName = "Modal.Content";

// ---------------------------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------------------------

const ModalTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn("size-label-sm", className)} {...props} />
));
ModalTitle.displayName = "Modal.Title";

const ModalDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(({ className, ...props }, ref) => {
    const register = React.useContext(ModalPartsContext)?.registerDescription;
    useIsomorphicLayoutEffect(() => register?.(), [register]);

    return <DialogPrimitive.Description ref={ref} className={cn("size-p-xs text-muted-foreground", className)} {...props} />;
});
ModalDescription.displayName = "Modal.Description";

const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    // Leave room for the close button when Content renders one.
    const showCloseButton = React.useContext(ModalPartsContext)?.showCloseButton ?? false;

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex items-start gap-3.5 py-4 before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-border",
                showCloseButton ? "pl-5 pr-14" : "px-5",
                className
            )}
            {...props}
        />
    );
});
ModalHeader.displayName = "Modal.Header";

const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-grow overflow-auto p-5 size-p-sm", className)} {...props} />
));
ModalBody.displayName = "Modal.Body";

const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-auto flex items-center justify-between gap-3 border-border px-5 py-4", className)} {...props} />
));
ModalFooter.displayName = "Modal.Footer";

interface ModalIconProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    children: React.ReactNode;
}

const ModalIcon = React.forwardRef<HTMLDivElement, ModalIconProps>(({ className, children, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-strong", className)} {...props}>
        {children}
    </div>
));
ModalIcon.displayName = "Modal.Icon";

export {
    ModalRoot as Root,
    ModalTrigger as Trigger,
    ModalClose as Close,
    ModalContent as Content,
    ModalHeader as Header,
    ModalFooter as Footer,
    ModalTitle as Title,
    ModalDescription as Description,
    ModalBody as Body,
    ModalIcon as Icon,
};

export const Modal = {
    Root: ModalRoot,
    Trigger: ModalTrigger,
    Close: ModalClose,
    Content: ModalContent,
    Header: ModalHeader,
    Footer: ModalFooter,
    Title: ModalTitle,
    Description: ModalDescription,
    Body: ModalBody,
    Icon: ModalIcon,
};

export default Modal;
