"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import { useField, useFieldControlProps } from "./Field";

type InputSize = "sm" | "md" | "lg";

const sizes = {
    root: { sm: "h-8", md: "h-9", lg: "h-10" },
    wrapper: { sm: "gap-1.5 px-2", md: "gap-2 px-2.5", lg: "gap-2 px-3" },
    icon: { sm: "size-3.5", md: "size-4", lg: "size-[18px]" },
    affix: { sm: "px-2", md: "px-2.5", lg: "px-3" },
} as const;

interface InputContextValue {
    size: InputSize;
    invalid: boolean;
}

const InputContext = React.createContext<InputContextValue>({ size: "md", invalid: false });

export interface InputRootProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: InputSize;
    /** Error state: red border and aria-invalid on the input. Also taken from Field.Root. */
    invalid?: boolean;
    /** @deprecated Use `invalid`. */
    error?: boolean;
    asChild?: boolean;
}

const Root = React.forwardRef<HTMLDivElement, InputRootProps>(({ className, children, size = "md", invalid, error, asChild = false, ...props }, ref) => {
    const field = useField();
    const isInvalid = Boolean(invalid ?? error ?? field?.invalid);
    const Component = asChild ? Slot : "div";

    return (
        <InputContext.Provider value={{ size, invalid: isInvalid }}>
            <Component
                ref={ref}
                data-invalid={isInvalid || undefined}
                className={cn(
                    "group/input relative flex w-full overflow-hidden rounded-lg border shadow-x-small transition duration-base ease-standard",
                    sizes.root[size],
                    // Focus: strong border plus a soft halo outside it (field-focus-within), as in CK-UI's original design.
                    isInvalid
                        ? "border-destructive outline-destructive/25 focus-within:border-destructive hover:bg-destructive-subtle focus-within:hover:bg-transparent"
                        : "border-input outline-accent focus-within:border-foreground hover:bg-muted focus-within:hover:bg-transparent",
                    "field-focus-within",
                    "has-[input:disabled]:pointer-events-none has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-muted has-[input:disabled]:shadow-none",
                    className
                )}
                {...props}
            >
                {children}
            </Component>
        </InputContext.Provider>
    );
});
Root.displayName = "Input.Root";

export interface InputWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}

// A <div>, not a <label>: affix text must not become part of the input's accessible name.
// Clicking anywhere in the wrapper still focuses the input.
const Wrapper = React.forwardRef<HTMLDivElement, InputWrapperProps>(({ className, asChild = false, onMouseDown, ...props }, ref) => {
    const { size } = React.useContext(InputContext);
    const Component = asChild ? Slot : "div";

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        onMouseDown?.(event);
        if (event.defaultPrevented) return;
        const target = event.target as HTMLElement;
        if (target.closest("input, button, a, select, textarea")) return;
        const input = event.currentTarget.querySelector("input");
        if (input && !input.disabled) {
            event.preventDefault();
            input.focus();
        }
    };

    return (
        <Component
            ref={ref}
            onMouseDown={handleMouseDown}
            className={cn("flex w-full cursor-text items-center transition-colors duration-base", sizes.wrapper[size], className)}
            {...props}
        />
    );
});
Wrapper.displayName = "Input.Wrapper";

export interface InputIconProps extends React.SVGAttributes<SVGElement> {
    /** Icon component, e.g. `as={RiSearchLine}`. */
    as?: React.ElementType;
}

const Icon = React.forwardRef<SVGElement, InputIconProps>(({ as: Component, className, ...props }, ref) => {
    const { size, invalid } = React.useContext(InputContext);

    if (!Component) return null;

    return (
        <Component
            ref={ref}
            aria-hidden="true"
            className={cn(
                "flex shrink-0 select-none items-center justify-center transition duration-base",
                invalid ? "text-destructive" : "text-muted-foreground group-focus-within/input:text-foreground group-has-[input:not(:placeholder-shown)]/input:text-foreground",
                "group-has-[input:disabled]/input:text-muted-foreground/60",
                sizes.icon[size],
                className
            )}
            {...props}
        />
    );
});
Icon.displayName = "Input.Icon";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type = "text", ...props }, ref) => {
    const { invalid } = React.useContext(InputContext);
    const controlProps = useFieldControlProps(props, { invalid });

    return (
        <input
            ref={ref}
            type={type}
            className={cn(
                "w-full border-none bg-transparent p-0 size-p-sm text-foreground",
                // The wrapper (Input.Root) shows focus; suppress the element's own outline and the forms-plugin ring.
                "outline-none focus:outline-none focus:ring-0",
                "placeholder:text-muted-foreground placeholder:transition-colors",
                "disabled:cursor-not-allowed disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/60",
                className
            )}
            {...controlProps}
        />
    );
});
Input.displayName = "Input.Input";

export interface InputAffixProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: "start" | "end";
}

const Affix = React.forwardRef<HTMLDivElement, InputAffixProps>(({ className, children, position = "start", ...props }, ref) => {
    const { size, invalid } = React.useContext(InputContext);

    return (
        <div
            ref={ref}
            className={cn(
                "flex shrink-0 select-none items-center justify-center size-p-sm transition duration-base",
                invalid ? "text-destructive" : "text-muted-foreground group-has-[input:not(:placeholder-shown)]/input:text-foreground",
                position === "start" ? "border-r border-input" : "border-l border-input",
                sizes.affix[size],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
Affix.displayName = "Input.Affix";

export { Root, Wrapper, Icon, Input, Affix };
