"use client";

import * as React from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import { useField } from "./Field";
import * as Input from "./Input";

/*
 * A password field built on Input. It stays a real <input type="password"> until the user presses the toggle
 * (aria-pressed, fixed label "Show password"), so browsers and password managers treat it as a password.
 * It is hidden again when its form is submitted. Pass autoComplete="new-password" for sign-up / change forms.
 */

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    size?: "sm" | "md" | "lg";
    invalid?: boolean;
    /** Password shown as text (controlled). */
    visible?: boolean;
    defaultVisible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    /** Accessible name of the toggle. It does not change with the state (aria-pressed carries that). */
    toggleLabel?: string;
    /** Classes for the outer Input.Root. */
    className?: string;
    inputClassName?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    (
        {
            size = "md",
            invalid,
            visible: visibleProp,
            defaultVisible = false,
            onVisibleChange,
            toggleLabel = "Show password",
            className,
            inputClassName,
            id,
            autoComplete = "current-password",
            disabled,
            ...props
        },
        forwardedRef
    ) => {
        const field = useField();
        const generatedId = React.useId();
        const inputId = id ?? field?.controlId ?? `password-${generatedId}`;
        const [uncontrolled, setUncontrolled] = React.useState(defaultVisible);
        const visible = visibleProp ?? uncontrolled;
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        const isDisabled = disabled ?? field?.disabled ?? false;

        const setVisible = React.useCallback(
            (next: boolean) => {
                if (visibleProp === undefined) setUncontrolled(next);
                onVisibleChange?.(next);
            },
            [visibleProp, onVisibleChange]
        );

        // Hide again before the form submits, so the value is never left on screen and managers see a password field.
        React.useEffect(() => {
            const form = inputRef.current?.form;
            if (!form) return;
            const onSubmit = () => setVisible(false);
            form.addEventListener("submit", onSubmit);
            return () => form.removeEventListener("submit", onSubmit);
        }, [setVisible]);

        return (
            <Input.Root size={size} invalid={invalid} className={className}>
                <Input.Wrapper className="pr-1">
                    <Input.Input
                        ref={(node) => {
                            inputRef.current = node;
                            if (typeof forwardedRef === "function") forwardedRef(node);
                            else if (forwardedRef) forwardedRef.current = node;
                        }}
                        id={inputId}
                        type={visible ? "text" : "password"}
                        autoComplete={autoComplete}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={disabled}
                        className={inputClassName}
                        {...props}
                    />
                    <button
                        type="button"
                        aria-label={toggleLabel}
                        aria-pressed={visible}
                        aria-controls={inputId}
                        disabled={isDisabled}
                        onClick={() => setVisible(!visible)}
                        className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard",
                            "hover:bg-muted hover:text-foreground focus-ring disabled:pointer-events-none disabled:opacity-50"
                        )}
                    >
                        {visible ? <RiEyeOffLine aria-hidden="true" className="size-4" /> : <RiEyeLine aria-hidden="true" className="size-4" />}
                    </button>
                </Input.Wrapper>
            </Input.Root>
        );
    }
);
PasswordInput.displayName = "PasswordInput.Root";

export { PasswordInput as Root };
