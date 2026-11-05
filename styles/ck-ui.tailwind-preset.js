// CK-UI design system for Tailwind CSS v3, added by ck-ui-cli. `npx ck-ui-cli init` regenerates this file.
import forms from "@tailwindcss/forms";
import animate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

// Colours are CSS variables holding RGB channels (see globals.css), so opacity modifiers such as bg-primary/10 work.
const token = (name) => `rgb(var(--ck-${name}) / <alpha-value>)`;

const preset = {
    theme: {
        extend: {
            colors: {
                background: token("background"),
                foreground: token("foreground"),
                surface: { DEFAULT: token("surface"), foreground: token("surface-foreground") },
                muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
                accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
                border: token("border"),
                input: token("input"),
                ring: token("ring"),
                overlay: "rgb(var(--ck-overlay) / var(--ck-overlay-opacity))",
                primary: {
                    DEFAULT: token("primary"),
                    hover: token("primary-hover"),
                    foreground: token("primary-foreground"),
                    subtle: token("primary-subtle"),
                    border: token("primary-border"),
                    strong: token("primary-strong"),
                },
                secondary: { DEFAULT: token("secondary"), hover: token("secondary-hover"), foreground: token("secondary-foreground") },
                destructive: {
                    DEFAULT: token("destructive"),
                    hover: token("destructive-hover"),
                    foreground: token("destructive-foreground"),
                    subtle: token("destructive-subtle"),
                    border: token("destructive-border"),
                    strong: token("destructive-strong"),
                },
                success: {
                    DEFAULT: token("success"),
                    hover: token("success-hover"),
                    foreground: token("success-foreground"),
                    subtle: token("success-subtle"),
                    border: token("success-border"),
                    strong: token("success-strong"),
                },
                warning: {
                    DEFAULT: token("warning"),
                    foreground: token("warning-foreground"),
                    subtle: token("warning-subtle"),
                    border: token("warning-border"),
                    strong: token("warning-strong"),
                },
                info: { DEFAULT: token("info"), foreground: token("info-foreground"), subtle: token("info-subtle"), border: token("info-border"), strong: token("info-strong") },
            },
            ringColor: { DEFAULT: token("ring") },
            ringOffsetColor: { DEFAULT: "rgb(var(--ck-background))" },
            zIndex: { sticky: "40", drawer: "50", modal: "50", command: "50", dropdown: "60", popover: "60", tooltip: "70", toast: "80" },
            transitionDuration: { fast: "150ms", base: "200ms", slow: "300ms" },
            transitionTimingFunction: { standard: "cubic-bezier(0.2, 0, 0, 1)" },
            borderRadius: { 10: "10px", 20: "20px" },
            boxShadow: {
                "x-small": "0px 1px 2px 0px rgba(10, 13, 20, 0.03)",
                regular: "0px 2px 4px 0px rgba(27, 28, 29, 0.04)",
                medium: "0px 16px 32px -12px rgba(14, 18, 27, 0.10)",
            },
            keyframes: {
                "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
                "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
                "progress-indeterminate": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(250%)" } },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "progress-indeterminate": "progress-indeterminate 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
            },
            padding: { 2.5: "10px" },
        },
    },
    plugins: [
        forms,
        animate,
        // CK-UI type scale: size-h1 … size-h6, size-p-*, size-label-*, size-subheading-*.
        plugin(({ addUtilities, addVariant }) => {
            // CK-UI's dark mode: `ck-dark:` applies under a `.dark` ancestor unless a `.light` boundary (ThemeScope) sits in between.
            addVariant("ck-dark", ":is(.dark &):not(:where(.dark .light *))");
            addUtilities({
                ".size-h1": { fontSize: "56px", lineHeight: "64px", letterSpacing: "-0.01em", fontWeight: "600" },
                ".size-h2": { fontSize: "48px", lineHeight: "56px", letterSpacing: "-0.01em", fontWeight: "500" },
                ".size-h3": { fontSize: "40px", lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "500" },
                ".size-h4": { fontSize: "32px", lineHeight: "40px", letterSpacing: "-0.005em", fontWeight: "500" },
                ".size-h5": { fontSize: "24px", lineHeight: "32px", letterSpacing: "0", fontWeight: "500" },
                ".size-h6": { fontSize: "20px", lineHeight: "28px", letterSpacing: "-0.005em", fontWeight: "500" },
                ".size-p-xl": { fontSize: "24px", lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "400" },
                ".size-p-lg": { fontSize: "18px", lineHeight: "24px", letterSpacing: "-0.015em", fontWeight: "400" },
                ".size-p-md": { fontSize: "16px", lineHeight: "24px", letterSpacing: "-0.011em", fontWeight: "400" },
                ".size-p-sm": { fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.006em", fontWeight: "400" },
                ".size-p-xs": { fontSize: "12px", lineHeight: "16px", letterSpacing: "0", fontWeight: "400" },
                ".size-label-xl": { fontSize: "24px", lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "500" },
                ".size-label-lg": { fontSize: "18px", lineHeight: "24px", letterSpacing: "-0.015em", fontWeight: "500" },
                ".size-label-md": { fontSize: "16px", lineHeight: "24px", letterSpacing: "-0.011em", fontWeight: "500" },
                ".size-label-sm": { fontSize: "14px", lineHeight: "20px", letterSpacing: "-0.006em", fontWeight: "500" },
                ".size-label-xs": { fontSize: "12px", lineHeight: "16px", letterSpacing: "0", fontWeight: "500" },
                ".size-subheading-xl": { fontSize: "16px", lineHeight: "24px", letterSpacing: "0.06em", fontWeight: "500" },
                ".size-subheading-lg": { fontSize: "14px", lineHeight: "20px", letterSpacing: "0.06em", fontWeight: "500" },
                ".size-subheading-md": { fontSize: "14px", lineHeight: "20px", letterSpacing: "0.06em", fontWeight: "500" },
                ".size-subheading-sm": { fontSize: "12px", lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "500" },
                ".size-subheading-xs": { fontSize: "12px", lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "500" },
                ".size-subheading-2xs": { fontSize: "11px", lineHeight: "12px", letterSpacing: "0.02em", fontWeight: "500" },
                ".size-docs-label": { fontSize: "18px", lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "500" },
                ".size-docs-p": { fontSize: "18px", lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "400" },
            });
        }),
    ],
};

export default preset;
