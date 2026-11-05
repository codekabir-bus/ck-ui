import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "./lib/utils";

// Server-compatible: this file uses no hooks. Image loading state lives in the Radix Avatar
// primitives (client components), so Avatar can be rendered from server components.

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "rounded" | "square";

const SIZE_CLASSES: Record<AvatarSize, string> = {
    xs: "size-6",
    sm: "size-8",
    md: "size-10",
    lg: "size-14",
    xl: "size-20",
};

/** Canonical sizes map to Tailwind size classes; any other string is used as class names (e.g. `"size-12"`). */
export function resolveAvatarSize(size?: AvatarSize | (string & {}) | null): string {
    if (!size) return SIZE_CLASSES.lg;
    return Object.prototype.hasOwnProperty.call(SIZE_CLASSES, size) ? SIZE_CLASSES[size as AvatarSize] : size;
}

// Clipped with CSS (clip-path) instead of an SVG <clipPath>, so no element ids are needed.
const UserPlaceholder = () => (
    <svg aria-hidden="true" focusable="false" fill="none" viewBox="0 0 80 80" className="size-full text-neutral-300 [clip-path:circle(50%)] ck-dark:text-neutral-600">
        <g fill="currentColor">
            <ellipse cx="40" cy="78" fillOpacity="0.72" rx="32" ry="24" />
            <circle cx="40" cy="32" r="16" opacity="0.9" />
        </g>
    </svg>
);

const UserIcon = () => (
    <svg aria-hidden="true" focusable="false" className="size-full text-gray-300 ck-dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="0.62854" y="0.359985" width="15" height="15" rx="7.5" fill="white" />
        <path
            d="M8.12421 7.20374C9.21151 7.20374 10.093 6.32229 10.093 5.23499C10.093 4.14767 9.21151 3.26624 8.12421 3.26624C7.0369 3.26624 6.15546 4.14767 6.15546 5.23499C6.15546 6.32229 7.0369 7.20374 8.12421 7.20374Z"
            fill="currentColor"
        />
        <path
            d="M11.818 10.5975C10.2992 12.6412 7.42106 13.0631 5.37731 11.5537C5.01171 11.2818 4.69296 10.9631 4.42107 10.5975C4.28982 10.4006 4.27107 10.1475 4.37419 9.94123L4.51482 9.65059C4.84296 8.95684 5.53671 8.51624 6.30546 8.51624H9.95231C10.7023 8.51624 11.3867 8.94749 11.7242 9.62249L11.8742 9.93184C11.968 10.1475 11.9586 10.4006 11.818 10.5975Z"
            fill="currentColor"
        />
    </svg>
);

export interface AvatarRootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** `xs` (24px) · `sm` (32px) · `md` (40px) · `lg` (56px, default) · `xl` (80px), or Tailwind size classes such as `"size-12"`. */
    size?: AvatarSize | (string & {});
    /** Placeholder shown when the avatar has no children: a person silhouette (`image`) or a user icon (`text`). */
    type?: "image" | "text";
    /** Adds a 1px border in the `border` token colour. */
    border?: boolean;
    /** Background classes, e.g. `"bg-muted"`. */
    background?: string;
    /** `rounded` (circle) or `square` (rounded-md). Avatar.Image follows the Root's corner radius. */
    shape?: AvatarShape;
}

const AvatarRoot = React.forwardRef<HTMLDivElement, AvatarRootProps>(
    ({ className, size, type = "image", border = false, background = "bg-transparent", shape = "rounded", children, ...props }, ref) => {
        const hasChildren = React.Children.count(children) > 0;

        return (
            <AvatarPrimitive.Root asChild>
                <div
                    ref={ref}
                    data-shape={shape}
                    className={cn(
                        "relative inline-flex shrink-0 items-center justify-center [&_img]:my-0 [&_img]:max-w-none",
                        resolveAvatarSize(size),
                        shape === "square" ? "rounded-md" : "rounded-full",
                        background,
                        border && "border border-border",
                        className
                    )}
                    {...props}
                >
                    {hasChildren ? children : type === "image" ? <UserPlaceholder /> : <UserIcon />}
                </div>
            </AvatarPrimitive.Root>
        );
    }
);
AvatarRoot.displayName = "Avatar.Root";

export interface AvatarImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
    src?: string;
    /**
     * Alternative text. Defaults to `""` (decorative), which is right when the person's name is shown next to
     * the avatar. Pass a name (e.g. `alt="Jane Doe"`) when the avatar is the only identification.
     */
    alt?: string;
    /** Sets `loading="lazy"` on the rendered <img>. */
    lazy?: boolean;
    /**
     * Shown while the image loads, when it fails to load, or when `src` is empty.
     * Defaults to a user icon; pass `null` to render nothing.
     */
    fallback?: React.ReactNode;
}

/** Must be rendered inside Avatar.Root. The <img> is rendered once the image has loaded. */
const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ src, alt = "", lazy = false, className, fallback, ...props }, ref) => {
    return (
        <>
            <AvatarPrimitive.Image
                ref={ref}
                src={src}
                alt={alt}
                loading={lazy ? "lazy" : "eager"}
                // Inherit the Root's radius so shape="square" (or a custom rounded-* class on Root) applies to the image.
                className={cn("size-full rounded-[inherit] object-cover", className)}
                {...props}
            />
            {fallback !== null && (
                <AvatarPrimitive.Fallback className="flex size-full items-center justify-center rounded-[inherit]">{fallback === undefined ? <UserIcon /> : fallback}</AvatarPrimitive.Fallback>
            )}
        </>
    );
});
AvatarImage.displayName = "Avatar.Image";

export interface AvatarTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Text to show, typically initials. Falls back to `children`. */
    text?: string;
}

const AvatarText = React.forwardRef<HTMLSpanElement, AvatarTextProps>(({ text, className, children, ...props }, ref) => {
    return (
        <span ref={ref} className={cn("flex h-full w-full items-center justify-center text-gray-600 size-label-md ck-dark:text-neutral-400", className)} {...props}>
            {text ?? children}
        </span>
    );
});
AvatarText.displayName = "Avatar.Text";

export interface AvatarStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Background class for the dot, e.g. `"bg-green-500"`. */
    color?: string;
    position?: "top" | "bottom";
}

/** Status dot. Decorative (`aria-hidden`) unless it gets an accessible name via `aria-label`, e.g. `aria-label="Online"`. */
const AvatarStatus = React.forwardRef<HTMLSpanElement, AvatarStatusProps>(({ color = "bg-green-500", position = "bottom", className, style, ...props }, ref) => {
    const labelled = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
    return (
        <span
            ref={ref}
            role={labelled ? "img" : undefined}
            aria-hidden={labelled ? undefined : true}
            className={cn("absolute right-0 block h-3 w-3 rounded-full ring-2 ring-white ck-dark:ring-gray-900", color, position === "top" ? "top-0" : "bottom-0", className)}
            style={{ transform: position === "top" ? "translate(-20%, 20%)" : "translate(-20%, -20%)", ...style }}
            {...props}
        />
    );
});
AvatarStatus.displayName = "Avatar.Status";

export interface AvatarIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: "top" | "bottom";
}

/** Positions custom content (e.g. a LegendIndicator) at the avatar's top-right or bottom-right corner. */
const AvatarIndicator = React.forwardRef<HTMLDivElement, AvatarIndicatorProps>(({ position = "bottom", className, ...props }, ref) => {
    return <div ref={ref} className={cn("absolute right-0 block", position === "top" ? "top-0" : "bottom-0", className)} {...props} />;
});
AvatarIndicator.displayName = "Avatar.Indicator";

export { AvatarRoot as Root, AvatarImage as Image, AvatarText as Text, AvatarStatus as Status, AvatarIndicator as Indicator };
