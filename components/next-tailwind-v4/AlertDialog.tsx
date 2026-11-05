"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "./lib/utils";
import * as Button from "./Button";
import { usePortalContainer } from "./ThemeScope";

/*
 * A modal confirmation that interrupts the user and needs an explicit answer.
 * Built on the Radix Dialog primitive the same way Radix's own AlertDialog is:
 *   role="alertdialog", always modal (focus trap, scroll lock, inert background),
 *   no dismissal by clicking outside, Escape cancels, focus starts on AlertDialog.Cancel
 *   (the safe choice) and returns to the trigger on close.
 */

type AlertDialogContentContextValue = {
    cancelRef: React.MutableRefObject<HTMLButtonElement | null>;
};

const AlertDialogContentContext = React.createContext<AlertDialogContentContextValue | null>(null);

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (typeof ref === "function") ref(value);
    else if (ref) (ref as React.MutableRefObject<T>).current = value;
}

export type AlertDialogRootProps = Omit<DialogPrimitive.DialogProps, "modal">;

/** Works controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`, `AlertDialog.Trigger`). Always modal. */
const Root = (props: AlertDialogRootProps) => <DialogPrimitive.Root {...props} modal />;
Root.displayName = "AlertDialog.Root";

const Trigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>>((props, ref) => (
    <DialogPrimitive.Trigger ref={ref} {...props} />
));
Trigger.displayName = "AlertDialog.Trigger";

export type AlertDialogSize = "sm" | "md" | "lg";

const sizeClasses: Record<AlertDialogSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
};

export interface AlertDialogContentProps
    extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "onPointerDownOutside" | "onInteractOutside" | "forceMount" | "asChild"> {
    size?: AlertDialogSize;
}

/**
 * The dialog panel (role="alertdialog"), rendered in a portal over a backdrop.
 * Needs an AlertDialog.Title and an AlertDialog.Description.
 */
const Content = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(({ size = "md", className, children, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
    const cancelRef = React.useRef<HTMLButtonElement | null>(null);
    const openerRef = React.useRef<HTMLElement | null>(null);
    const context = React.useMemo(() => ({ cancelRef }), []);
    const container = usePortalContainer();

    return (
        <DialogPrimitive.Portal container={container}>
            {/* The overlay doubles as the scroll container so tall content stays reachable on small screens. */}
            <DialogPrimitive.Overlay
                className={cn(
                    "fixed inset-0 z-modal grid place-items-center overflow-y-auto p-4",
                    "bg-overlay backdrop-blur-xs",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
                )}
            >
                <DialogPrimitive.Content
                    ref={ref}
                    {...props}
                    role="alertdialog"
                    onOpenAutoFocus={(event) => {
                        // Remember what had focus so closing returns there, also when the dialog is opened without an
                        // AlertDialog.Trigger (controlled `open`), where Radix has no trigger to return to.
                        const active = document.activeElement;
                        openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
                        onOpenAutoFocus?.(event);
                        if (event.defaultPrevented || !cancelRef.current) return;
                        // Start on the safe answer. Without a Cancel, Radix focuses the first focusable element.
                        event.preventDefault();
                        cancelRef.current.focus({ preventScroll: true });
                    }}
                    onCloseAutoFocus={(event) => {
                        onCloseAutoFocus?.(event);
                        const opener = openerRef.current;
                        if (event.defaultPrevented || !opener?.isConnected) return;
                        event.preventDefault();
                        opener.focus({ preventScroll: true });
                    }}
                    // An alert dialog needs an explicit answer: clicks outside do nothing.
                    onPointerDownOutside={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                    className={cn(
                        "relative w-full rounded-20 border border-border bg-background p-6 text-foreground shadow-medium",
                        "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95",
                        sizeClasses[size],
                        className
                    )}
                >
                    <AlertDialogContentContext.Provider value={context}>{children}</AlertDialogContentContext.Provider>
                </DialogPrimitive.Content>
            </DialogPrimitive.Overlay>
        </DialogPrimitive.Portal>
    );
});
Content.displayName = "AlertDialog.Content";

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
));
Header.displayName = "AlertDialog.Header";

/** Holds Cancel and Action. Stacks full-width on small screens (Action on top), right-aligned from `sm`. */
const Footer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto", className)} {...props} />
));
Footer.displayName = "AlertDialog.Footer";

const Title = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn("size-label-lg text-foreground", className)} {...props} />
));
Title.displayName = "AlertDialog.Title";

const Description = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn("size-p-sm text-muted-foreground", className)} {...props} />
));
Description.displayName = "AlertDialog.Description";

export interface AlertDialogCancelProps extends Omit<Button.ButtonRootProps, "href" | "variant" | "color"> {
    /** Render your own element (it receives the close behaviour and focus) instead of the default button. */
    asChild?: boolean;
}

/** Closes without acting. Receives initial focus. */
const Cancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(({ asChild = false, size, loading, children, ...props }, forwardedRef) => {
    const context = React.useContext(AlertDialogContentContext);
    const ref = React.useCallback(
        (node: HTMLButtonElement | null) => {
            if (context) context.cancelRef.current = node;
            setRef(forwardedRef, node);
        },
        [context, forwardedRef]
    );

    if (asChild) {
        return (
            <DialogPrimitive.Close ref={ref} asChild {...props}>
                {children}
            </DialogPrimitive.Close>
        );
    }

    return (
        <DialogPrimitive.Close asChild>
            <Button.Root ref={ref} variant="stroke" color="neutral" size={size} loading={loading} {...props}>
                {children}
            </Button.Root>
        </DialogPrimitive.Close>
    );
});
Cancel.displayName = "AlertDialog.Cancel";

export interface AlertDialogActionProps extends Omit<Button.ButtonRootProps, "href" | "variant" | "color"> {
    /** `destructive` for irreversible actions (delete, remove, revoke). */
    color?: "primary" | "destructive";
    asChild?: boolean;
}

/**
 * Confirms and closes. To keep the dialog open while an async action runs, call `event.preventDefault()`
 * in `onClick` and close it yourself through the controlled `open` prop.
 */
const Action = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(({ asChild = false, color = "primary", size, loading, children, ...props }, ref) => {
    if (asChild) {
        return (
            <DialogPrimitive.Close ref={ref} asChild {...props}>
                {children}
            </DialogPrimitive.Close>
        );
    }

    return (
        <DialogPrimitive.Close asChild>
            <Button.Root ref={ref} variant="default" color={color} data-color={color} size={size} loading={loading} {...props}>
                {children}
            </Button.Root>
        </DialogPrimitive.Close>
    );
});
Action.displayName = "AlertDialog.Action";

export { Root, Trigger, Content, Header, Footer, Title, Description, Cancel, Action };
