"use client";

import * as React from "react";
import { cn } from "./lib/utils";

/*
 * A local light/dark boundary. Everything inside renders in `theme`, whatever the site theme is: the semantic tokens
 * (`bg-background`, `text-foreground`, …) and every `dark:` utility resolve to the nearest boundary, not to <html>.
 * Overlays that portal out of the tree (Select, Popover, Tooltip, Dropdown, Modal, AlertDialog, Drawer, Toast) render
 * into a layer that carries the same theme, so a menu opened inside a dark scope is dark too.
 *
 * It never touches <html>, the site's theme state or its storage. Without `theme` it renders no theme class and
 * follows the surrounding theme. Nest at most one scope below the site theme (see `darkMode` in tailwind.config.ts).
 */

export type ScopeTheme = "light" | "dark";

const PortalContainerContext = React.createContext<HTMLElement | null>(null);

/** Where overlays portal to: the nearest themed ThemeScope's layer, or null for the default (document.body). */
export function usePortalContainer() {
    return React.useContext(PortalContainerContext);
}

// A themed layer at the end of <body> for portalled overlays. Only created while the scope sets a theme, so a scope
// that follows the site leaves the document exactly as it was.
function usePortalLayer(theme: ScopeTheme | undefined) {
    const [layer, setLayer] = React.useState<HTMLElement | null>(null);
    const themed = theme !== undefined;

    React.useEffect(() => {
        if (!themed) return;
        const element = document.createElement("div");
        element.setAttribute("data-theme-scope-layer", "");
        document.body.appendChild(element);
        setLayer(element);
        return () => {
            element.remove();
            setLayer(null);
        };
    }, [themed]);

    React.useEffect(() => {
        if (!layer || !theme) return;
        // text-foreground: portalled text that sets no colour of its own resolves against the layer's tokens.
        layer.className = `${theme} text-foreground`;
    }, [layer, theme]);

    return layer;
}

export interface RootProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Theme for this subtree. Leave undefined to follow the surrounding (site) theme. */
    theme?: ScopeTheme;
}

const Root = React.forwardRef<HTMLDivElement, RootProps>(({ theme, className, children, ...props }, ref) => {
    const layer = usePortalLayer(theme);
    // A scope that follows its surroundings keeps the surrounding scope's layer.
    const outerLayer = usePortalContainer();

    return (
        <div ref={ref} data-theme-scope={theme} className={cn(theme && [theme, "text-foreground"], className)} {...props}>
            <PortalContainerContext.Provider value={theme ? layer : outerLayer}>{children}</PortalContainerContext.Provider>
        </div>
    );
});
Root.displayName = "ThemeScope.Root";

export { Root };
