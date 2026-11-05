import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// CK-UI typography utilities (tailwind.config.ts plugin). Registered as one class group so a
// consumer's `size-h1` replaces a component's `size-h4` instead of both being kept.
const TYPOGRAPHY_STEPS = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p-xl",
    "p-lg",
    "p-md",
    "p-sm",
    "p-xs",
    "label-xl",
    "label-lg",
    "label-md",
    "label-sm",
    "label-xs",
    "subheading-xl",
    "subheading-lg",
    "subheading-md",
    "subheading-sm",
    "subheading-xs",
    "subheading-2xs",
    "docs-label",
    "docs-p",
];

const twMerge = extendTailwindMerge<"ck-typography">({
    extend: {
        // rounded-10 / rounded-20 (tailwind.config.ts) are radii, so a later rounded-lg replaces them and vice versa.
        theme: { radius: ["10", "20"] },
        classGroups: {
            "ck-typography": [{ size: TYPOGRAPHY_STEPS }],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
