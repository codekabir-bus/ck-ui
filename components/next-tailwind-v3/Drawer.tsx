"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { RiCloseLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import { usePortalContainer } from "./ThemeScope";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export type DrawerPosition = "left" | "right" | "top" | "bottom";
export type DrawerSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

interface DrawerContextValue {
    showCloseButton: boolean;
    registerDescription: () => () => void;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

// Size classes for different positions
const sizeClasses: Record<DrawerSize, Record<DrawerPosition, string>> = {
    xs: { left: "w-64", right: "w-64", top: "min-h-64", bottom: "min-h-64" },
    sm: { left: "w-80", right: "w-80", top: "min-h-80", bottom: "min-h-80" },
    md: { left: "w-96", right: "w-96", top: "min-h-96", bottom: "min-h-96" },
    lg: { left: "w-1/3", right: "w-1/3", top: "h-1/2", bottom: "h-1/2" },
    xl: { left: "w-1/2", right: "w-1/2", top: "h-2/3", bottom: "h-2/3" },
    full: { left: "w-full", right: "w-full", top: "h-full", bottom: "h-full" },
};

const positionClasses: Record<DrawerPosition, string> = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
};

const animationClasses: Record<DrawerPosition, string> = {
    left: "data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full",
    right: "data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full",
    top: "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full",
    bottom: "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full",
};

/** Radix Dialog root: controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`, `Drawer.Trigger`). */
const DrawerRoot = (props: DialogPrimitive.DialogProps) => <DialogPrimitive.Root {...props} />;
DrawerRoot.displayName = "Drawer.Root";

const DrawerTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>>((props, ref) => (
    <DialogPrimitive.Trigger ref={ref} {...props} />
));
DrawerTrigger.displayName = "Drawer.Trigger";

const DrawerClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>>((props, ref) => <DialogPrimitive.Close ref={ref} {...props} />);
DrawerClose.displayName = "Drawer.Close";

const DrawerOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-drawer bg-overlay backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
));
DrawerOverlay.displayName = "Drawer.Overlay";

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
    position?: DrawerPosition;
    size?: DrawerSize;
    /** Renders an icon button labelled "Close" in `Drawer.Header`. */
    showCloseButton?: boolean;
}

/**
 * The drawer panel (`role="dialog"`); `className` goes on it. Render a `Drawer.Title` inside
 * (visually hidden with `className="sr-only"` if needed); `Drawer.Description` is optional.
 */
const DrawerContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DrawerContentProps>(
    ({ children, position = "right", size = "md", showCloseButton = false, className, ...props }, ref) => {
        // Only point aria-describedby at Drawer.Description when one is rendered (avoids a dangling reference and Radix's warning).
        const [descriptionCount, setDescriptionCount] = React.useState(0);
        const registerDescription = React.useCallback(() => {
            setDescriptionCount((count) => count + 1);
            return () => setDescriptionCount((count) => count - 1);
        }, []);
        const context = React.useMemo(() => ({ showCloseButton, registerDescription }), [showCloseButton, registerDescription]);
        const describedByProps = descriptionCount > 0 ? {} : { "aria-describedby": undefined };
        const container = usePortalContainer();

        return (
            <DialogPrimitive.Portal container={container}>
                <DrawerOverlay />
                <DialogPrimitive.Content
                    ref={ref}
                    {...describedByProps}
                    className={cn(
                        "fixed z-drawer max-w-full bg-background",
                        positionClasses[position],
                        sizeClasses[size][position],
                        "data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-out",
                        "data-[state=closed]:animate-out data-[state=closed]:duration-base data-[state=closed]:ease-in",
                        animationClasses[position],
                        className
                    )}
                    {...props}
                >
                    <DrawerContext.Provider value={context}>
                        <div className="flex h-full w-full flex-col overflow-hidden">{children}</div>
                    </DrawerContext.Provider>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        );
    }
);
DrawerContent.displayName = "Drawer.Content";

const DrawerTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn("size-label-sm", className)} {...props} />
));
DrawerTitle.displayName = "Drawer.Title";

const DrawerDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(
    ({ className, ...props }, ref) => {
        const register = React.useContext(DrawerContext)?.registerDescription;
        useIsomorphicLayoutEffect(() => register?.(), [register]);

        return <DialogPrimitive.Description ref={ref} className={cn("size-p-xs text-muted-foreground", className)} {...props} />;
    }
);
DrawerDescription.displayName = "Drawer.Description";

export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Overrides `showCloseButton` from `Drawer.Content` for this header. */
    showCloseButton?: boolean;
}

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(({ className, children, showCloseButton: showCloseButtonProp, ...props }, ref) => {
    const context = React.useContext(DrawerContext);
    const showCloseButton = showCloseButtonProp ?? context?.showCloseButton ?? false;

    return (
        <div ref={ref} className={cn("flex items-center gap-3 border-b border-border p-5", className)} {...props}>
            <div className="flex-1">{children}</div>

            {showCloseButton && (
                <DialogPrimitive.Close
                    aria-label="Close"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-muted hover:text-foreground focus-ring"
                >
                    <RiCloseLine aria-hidden="true" className="size-5" />
                </DialogPrimitive.Close>
            )}
        </div>
    );
});
DrawerHeader.displayName = "Drawer.Header";

const DrawerBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto p-5", className)} {...props} />
));
DrawerBody.displayName = "Drawer.Body";

const DrawerFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-4 border-t border-border p-5", className)} {...props} />
));
DrawerFooter.displayName = "Drawer.Footer";

interface DrawerIconProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    children: React.ReactNode;
}

const DrawerIcon = React.forwardRef<HTMLDivElement, DrawerIconProps>(({ className, children, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-strong", className)} {...props}>
        {children}
    </div>
));
DrawerIcon.displayName = "Drawer.Icon";

export {
    DrawerRoot as Root,
    DrawerTrigger as Trigger,
    DrawerClose as Close,
    DrawerContent as Content,
    DrawerHeader as Header,
    DrawerFooter as Footer,
    DrawerTitle as Title,
    DrawerDescription as Description,
    DrawerBody as Body,
    DrawerIcon as Icon,
};

export const Drawer = {
    Root: DrawerRoot,
    Trigger: DrawerTrigger,
    Close: DrawerClose,
    Content: DrawerContent,
    Header: DrawerHeader,
    Footer: DrawerFooter,
    Title: DrawerTitle,
    Description: DrawerDescription,
    Body: DrawerBody,
    Icon: DrawerIcon,
};

export default Drawer;
