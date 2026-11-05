"use client";

import * as React from "react";
import { RiInformationFill, RiCloseCircleFill, RiCheckboxCircleFill, RiErrorWarningFill } from "react-icons/ri";
import { cn } from "./lib/utils";
import { useField } from "./Field";

type Variant = "default" | "info" | "error" | "success" | "warning";

interface HintContextValue {
    variant: Variant;
    disabled: boolean;
}

const HintContext = React.createContext<HintContextValue>({ variant: "default", disabled: false });

const variants = {
    default: { textClass: "text-muted-foreground", icon: RiInformationFill },
    info: { textClass: "text-info-strong", icon: RiInformationFill },
    error: { textClass: "text-destructive-strong", icon: RiCloseCircleFill },
    success: { textClass: "text-success-strong", icon: RiCheckboxCircleFill },
    // -strong, like the other intents: the yellow fill colour is 1.9:1 on white.
    warning: { textClass: "text-warning-strong", icon: RiErrorWarningFill },
} as const;

export interface HintRootProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: Variant;
    disabled?: boolean;
}

/*
 * Inside Field.Root, Hint.Root takes the field's description id (or message id for
 * variant="error") so the control's aria-describedby points at it automatically.
 */
const Root = React.forwardRef<HTMLDivElement, HintRootProps>(({ variant = "default", disabled = false, className, children, id, ...props }, ref) => {
    const field = useField();
    const setRegistered = variant === "error" ? field?.setHasMessage : field?.setHasDescription;
    const fieldId = variant === "error" ? field?.messageId : field?.descriptionId;

    React.useEffect(() => {
        if (!setRegistered || id) return;
        setRegistered(true);
        return () => setRegistered(false);
    }, [setRegistered, id]);

    return (
        <HintContext.Provider value={{ variant, disabled }}>
            <div
                ref={ref}
                id={id ?? fieldId}
                aria-live={variant === "error" ? "polite" : undefined}
                data-disabled={disabled || undefined}
                className={cn("flex items-center gap-1", variants[variant].textClass, "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50", className)}
                {...props}
            >
                {children}
            </div>
        </HintContext.Provider>
    );
});
Root.displayName = "Hint.Root";

export interface HintIconProps extends React.SVGAttributes<SVGElement> {
    /** Icon component; defaults to the variant's icon. */
    as?: React.ElementType;
}

function Icon({ as, className, ...props }: HintIconProps) {
    const { variant } = React.useContext(HintContext);
    const IconComponent = as || variants[variant].icon;

    return <IconComponent aria-hidden="true" className={cn("size-3.5 shrink-0", className)} {...props} />;
}
Icon.displayName = "Hint.Icon";

const Text = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("m-0 size-p-xs", className)} {...props} />
));
Text.displayName = "Hint.Text";

export { Root, Icon, Text };
