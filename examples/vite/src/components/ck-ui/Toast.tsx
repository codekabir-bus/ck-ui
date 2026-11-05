"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { RiAlertLine, RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from "react-icons/ri";
import { cn } from "./lib/utils";
import * as Button from "./Button";
import { usePortalContainer } from "./ThemeScope";

/*
 * Toasts: brief, non-blocking notifications.
 *   toast({ title, description, color, duration, action })  — call from anywhere (event handlers, effects)
 *   <Toaster />                                               — mount once, e.g. in the root layout
 * Accessibility:
 *   - Announced once through hidden live regions owned by the Toaster ("polite" by default, "assertive" for
 *     destructive). The visible toasts are not live regions, so nothing is read twice.
 *   - The toasts sit in a labelled region. F8 (configurable) moves focus there; Tab reaches the action and
 *     close buttons; Escape dismisses the focused toast.
 *   - Timers pause while the pointer is over the toasts, while focus is inside them and while the window
 *     is in the background. `duration: Infinity` keeps a toast until it is dismissed.
 * Swipe-to-dismiss is not implemented.
 */

export type ToastColor = "neutral" | "info" | "success" | "warning" | "destructive";
export type ToastPoliteness = "polite" | "assertive";

export interface ToastActionOptions {
    label: React.ReactNode;
    /** Called on click. The toast then closes unless you call `event.preventDefault()`. */
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
    /** Pass an existing id to update that toast in place. */
    id?: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    color?: ToastColor;
    /** Milliseconds before it closes. `Infinity` keeps it open. Defaults to the Toaster's `duration`. */
    duration?: number;
    action?: ToastActionOptions;
    /** Show the close button (default true). */
    dismissible?: boolean;
    /** Screen-reader urgency. Defaults to "assertive" for destructive toasts and "polite" for the rest. */
    politeness?: ToastPoliteness;
    /** Called when the toast starts closing (timeout, close button, Escape, action or `dismiss`). */
    onDismiss?: (id: string) => void;
}

export interface ToastRecord extends Omit<ToastOptions, "id"> {
    id: string;
    open: boolean;
    /** Increments on every update; restarts the timer and the announcement. */
    version: number;
}

// ---------------------------------------------------------------------------------------------
// Store (module level, shared by toast() and every Toaster)
// ---------------------------------------------------------------------------------------------

const EXIT_DURATION = 200;
const EMPTY: ToastRecord[] = [];

let records: ToastRecord[] = [];
let idCounter = 0;
const listeners = new Set<() => void>();
const removeTimers = new Map<string, ReturnType<typeof setTimeout>>();
// Toasts that have been on screen (only those animate out) and the version last announced.
const shownIds = new Set<string>();
const announcedVersions = new Map<string, number>();

function setRecords(next: ToastRecord[]) {
    records = next;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

const getSnapshot = () => records;
const getServerSnapshot = () => EMPTY;

// One Toaster renders at a time. Extra instances (e.g. one in a layout and one in a page) render nothing,
// so toasts are never shown or announced twice; the next instance takes over if the active one unmounts.
const toasterOwners: symbol[] = [];
const ownerListeners = new Set<() => void>();

function subscribeOwners(listener: () => void) {
    ownerListeners.add(listener);
    return () => {
        ownerListeners.delete(listener);
    };
}

const getOwner = () => toasterOwners[0] ?? null;
const getServerOwner = () => null;

function claimToaster(id: symbol) {
    toasterOwners.push(id);
    if (toasterOwners.length > 1 && import.meta.env.MODE !== "production") {
        console.warn("CK-UI: more than one <Toaster /> is mounted. Only the first one renders toasts; mount a single Toaster near the root.");
    }
    ownerListeners.forEach((listener) => listener());
    return () => {
        const index = toasterOwners.indexOf(id);
        if (index > -1) toasterOwners.splice(index, 1);
        ownerListeners.forEach((listener) => listener());
    };
}

function clearRemoveTimer(id: string) {
    const timer = removeTimers.get(id);
    if (timer) clearTimeout(timer);
    removeTimers.delete(id);
}

function upsert(options: ToastOptions): string {
    const id = options.id ?? `toast-${++idCounter}`;
    const existing = records.find((record) => record.id === id);

    if (existing) {
        clearRemoveTimer(id);
        setRecords(records.map((record) => (record.id === id ? { ...record, ...options, id, open: true, version: record.version + 1 } : record)));
    } else {
        setRecords([...records, { ...options, id, open: true, version: 0 }]);
    }

    return id;
}

/** Closes one toast, or every toast when called without an id. */
function dismiss(id?: string) {
    const closing = records.filter((record) => record.open && (id === undefined || record.id === id));
    if (closing.length === 0) return;

    const closingIds = new Set(closing.map((record) => record.id));
    setRecords(records.map((record) => (closingIds.has(record.id) ? { ...record, open: false } : record)));

    closing.forEach((record) => {
        record.onDismiss?.(record.id);
        clearRemoveTimer(record.id);
        removeTimers.set(
            record.id,
            setTimeout(() => {
                removeTimers.delete(record.id);
                shownIds.delete(record.id);
                announcedVersions.delete(record.id);
                setRecords(records.filter((entry) => entry.id !== record.id));
            }, EXIT_DURATION)
        );
    });
}

export interface ToastHandle {
    id: string;
    dismiss: () => void;
    update: (options: Omit<ToastOptions, "id">) => void;
}

function createToast(options: ToastOptions): ToastHandle {
    const id = upsert(options);
    return {
        id,
        dismiss: () => dismiss(id),
        update: (next) => {
            upsert({ ...next, id });
        },
    };
}

type ToastShortcut = (title: React.ReactNode, options?: Omit<ToastOptions, "title" | "color">) => ToastHandle;
const shortcut =
    (color: ToastColor): ToastShortcut =>
    (title, options) =>
        createToast({ ...options, title, color });

/** Shows a toast. Also: toast.success / toast.error / toast.warning / toast.info / toast.dismiss. */
export const toast = Object.assign(createToast, {
    success: shortcut("success"),
    error: shortcut("destructive"),
    warning: shortcut("warning"),
    info: shortcut("info"),
    dismiss,
});

/** The current toasts plus `toast` and `dismiss`. Re-renders when toasts change. */
export function useToast() {
    const toasts = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return { toasts, toast, dismiss };
}

// ---------------------------------------------------------------------------------------------
// Toaster
// ---------------------------------------------------------------------------------------------

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const positionClasses: Record<ToastPosition, string> = {
    "top-left": "top-0 left-0",
    "top-center": "top-0 left-0 sm:left-1/2 sm:-translate-x-1/2",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-center": "bottom-0 left-0 sm:left-1/2 sm:-translate-x-1/2",
    "bottom-right": "bottom-0 right-0",
};

const colorIcons: Record<Exclude<ToastColor, "neutral">, React.ElementType> = {
    info: RiInformationLine,
    success: RiCheckboxCircleLine,
    warning: RiAlertLine,
    destructive: RiErrorWarningLine,
};

const iconColorClasses: Record<Exclude<ToastColor, "neutral">, string> = {
    info: "text-info-strong",
    success: "text-success-strong",
    warning: "text-warning-strong",
    destructive: "text-destructive-strong",
};

const DEFAULT_HOTKEY = ["F8"];

export interface ToasterProps {
    position?: ToastPosition;
    /** Maximum toasts on screen. Newer toasts push older ones into a queue until there is room. */
    limit?: number;
    /** Default time on screen in milliseconds. */
    duration?: number;
    /** Accessible name of the notifications region. */
    label?: string;
    /** Keys that move focus to the toasts, matched against `event.code` or modifier flags (e.g. ["altKey", "KeyT"]). */
    hotkey?: string[];
    /** Accessible name of each close button. */
    closeLabel?: string;
    className?: string;
}

type Announcement = { key: string; politeness: ToastPoliteness; content: React.ReactNode };

/** Renders the toasts. Mount it once; `toast()` works anywhere after that. */
export function Toaster({
    position = "bottom-right",
    limit = 3,
    duration = 5000,
    label = "Notifications",
    hotkey = DEFAULT_HOTKEY,
    closeLabel = "Close notification",
    className,
}: ToasterProps) {
    const all = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [instanceId] = React.useState(() => Symbol("Toaster"));
    const owner = React.useSyncExternalStore(subscribeOwners, getOwner, getServerOwner);
    const [mounted, setMounted] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const [focusWithin, setFocusWithin] = React.useState(false);
    const [windowBlurred, setWindowBlurred] = React.useState(false);
    const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
    const viewportRef = React.useRef<HTMLElement>(null);
    const returnFocusRef = React.useRef<HTMLElement | null>(null);
    const announceTimers = React.useRef(new Set<ReturnType<typeof setTimeout>>());
    const container = usePortalContainer();

    React.useEffect(() => setMounted(true), []);
    React.useEffect(() => claimToaster(instanceId), [instanceId]);

    React.useEffect(() => {
        const timers = announceTimers.current;
        return () => timers.forEach(clearTimeout);
    }, []);

    // Pause while the window is in the background.
    React.useEffect(() => {
        const onBlur = () => setWindowBlurred(true);
        const onFocus = () => setWindowBlurred(false);
        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        return () => {
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    // Hotkey moves focus into the notifications region.
    const hotkeyKey = hotkey.join("+");
    React.useEffect(() => {
        const keys = hotkeyKey.split("+");
        const onKeyDown = (event: KeyboardEvent) => {
            const matches = keys.every((key) => (event as unknown as Record<string, unknown>)[key] === true || event.code === key);
            if (!matches || !viewportRef.current) return;
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            viewportRef.current.focus();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [hotkeyKey]);

    const announce = React.useCallback((record: ToastRecord) => {
        const politeness = record.politeness ?? (record.color === "destructive" ? "assertive" : "polite");
        const key = `${record.id}:${record.version}`;
        const content = (
            <>
                {record.title && <span>{record.title}</span>}
                {record.title && record.description ? <span>. </span> : null}
                {record.description && <span>{record.description}</span>}
            </>
        );
        setAnnouncements((current) => [...current, { key, politeness, content }]);
        // Removing the text afterwards is not announced; it only keeps the hidden region from duplicating
        // the visible toast for screen-reader users who browse the page.
        const timer = setTimeout(() => {
            announceTimers.current.delete(timer);
            setAnnouncements((current) => current.filter((entry) => entry.key !== key));
        }, 1000);
        announceTimers.current.add(timer);
    }, []);

    // When the focused toast closes, keep focus inside the region (next toast) or send it back.
    const moveFocusFrom = React.useCallback((item: HTMLElement) => {
        if (!item.contains(document.activeElement)) return;
        const items = Array.from(viewportRef.current?.querySelectorAll<HTMLElement>("[data-toast][data-state=open]") ?? []);
        const index = items.indexOf(item);
        const next = items[index + 1] ?? items[index - 1];

        if (next) next.focus();
        else if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        else viewportRef.current?.focus();
    }, []);

    const openRecords = all.filter((record) => record.open);
    const visibleOpenIds = new Set(openRecords.slice(-Math.max(1, limit)).map((record) => record.id));
    const rendered = all.filter((record) => visibleOpenIds.has(record.id) || (!record.open && shownIds.has(record.id)));
    const isTop = position.startsWith("top");
    // Newest toast sits closest to the screen edge.
    const ordered = isTop ? [...rendered].reverse() : rendered;
    const paused = hovered || focusWithin || windowBlurred;
    const hotkeyLabel = hotkey.map((key) => key.replace(/^(Key|Digit)/, "").replace(/Key$/, "")).join("+");

    const region = (
        <>
            <section
                ref={viewportRef}
                aria-label={`${label} (${hotkeyLabel})`}
                tabIndex={-1}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onFocus={() => setFocusWithin(true)}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
                }}
                className={cn("pointer-events-none fixed z-toast w-full p-4 outline-hidden sm:max-w-[420px]", positionClasses[position], className)}
            >
                <ol className="flex flex-col gap-2">
                    {ordered.map((record) => (
                        <ToastItem
                            key={record.id}
                            record={record}
                            defaultDuration={duration}
                            paused={paused}
                            fromTop={isTop}
                            closeLabel={closeLabel}
                            announce={announce}
                            moveFocusFrom={moveFocusFrom}
                        />
                    ))}
                </ol>
            </section>
            <div className="sr-only">
                <div aria-live="polite" aria-atomic="false" aria-relevant="additions" data-toast-announcer="polite">
                    {announcements
                        .filter((entry) => entry.politeness === "polite")
                        .map((entry) => (
                            <p key={entry.key}>{entry.content}</p>
                        ))}
                </div>
                <div aria-live="assertive" aria-atomic="false" aria-relevant="additions" data-toast-announcer="assertive">
                    {announcements
                        .filter((entry) => entry.politeness === "assertive")
                        .map((entry) => (
                            <p key={entry.key}>{entry.content}</p>
                        ))}
                </div>
            </div>
        </>
    );

    return mounted && owner === instanceId ? createPortal(region, container ?? document.body) : null;
}
Toaster.displayName = "Toast.Toaster";

interface ToastItemProps {
    record: ToastRecord;
    defaultDuration: number;
    paused: boolean;
    fromTop: boolean;
    closeLabel: string;
    announce: (record: ToastRecord) => void;
    moveFocusFrom: (item: HTMLElement) => void;
}

function ToastItem({ record, defaultDuration, paused, fromTop, closeLabel, announce, moveFocusFrom }: ToastItemProps) {
    const { id, open, version, title, description, color = "neutral", action, dismissible = true } = record;
    const duration = record.duration ?? defaultDuration;
    const itemRef = React.useRef<HTMLLIElement>(null);
    const remainingRef = React.useRef(duration);
    const Icon = color === "neutral" ? null : colorIcons[color];

    React.useEffect(() => {
        if (open) shownIds.add(id);
    }, [id, open]);

    // Announce once per version (StrictMode-safe: the map is checked before announcing).
    React.useEffect(() => {
        if (!open || announcedVersions.get(id) === version) return;
        announcedVersions.set(id, version);
        announce(record);
    }, [id, open, version, record, announce]);

    // A new version (update) restarts the timer.
    React.useEffect(() => {
        remainingRef.current = duration;
    }, [version, duration]);

    React.useEffect(() => {
        if (!open || paused || !Number.isFinite(duration)) return;
        const startedAt = Date.now();
        const timer = setTimeout(() => dismiss(id), Math.max(0, remainingRef.current));
        return () => {
            clearTimeout(timer);
            remainingRef.current -= Date.now() - startedAt;
        };
    }, [id, open, paused, duration, version]);

    const close = () => {
        if (itemRef.current) moveFocusFrom(itemRef.current);
        dismiss(id);
    };

    return (
        <li
            ref={itemRef}
            data-toast=""
            data-state={open ? "open" : "closed"}
            data-color={color}
            tabIndex={open ? 0 : -1}
            aria-hidden={open ? undefined : true}
            onKeyDown={(event) => {
                if (event.key !== "Escape" || !open) return;
                event.stopPropagation();
                close();
            }}
            className={cn(
                "pointer-events-auto relative flex w-full items-start gap-3 rounded-2xl border bg-surface p-4 text-surface-foreground shadow-medium focus-ring",
                color === "destructive" ? "border-destructive-border" : "border-border",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:pointer-events-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
                fromTop ? "data-[state=open]:slide-in-from-top-2" : "data-[state=open]:slide-in-from-bottom-2"
            )}
        >
            {Icon && <Icon aria-hidden="true" className={cn("mt-px size-5 shrink-0", iconColorClasses[color as Exclude<ToastColor, "neutral">])} />}
            <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", dismissible && "pr-6")}>
                {title && <div className="size-label-sm text-foreground">{title}</div>}
                {description && <div className="size-p-sm text-muted-foreground">{description}</div>}
                {action && (
                    <div className="mt-2.5">
                        <Button.Root
                            size="xs"
                            variant="stroke"
                            color="neutral"
                            className="text-foreground"
                            tabIndex={open ? undefined : -1}
                            onClick={(event) => {
                                action.onClick(event);
                                if (!event.defaultPrevented) close();
                            }}
                        >
                            {action.label}
                        </Button.Root>
                    </div>
                )}
            </div>
            {dismissible && (
                <button
                    type="button"
                    aria-label={closeLabel}
                    tabIndex={open ? undefined : -1}
                    onClick={close}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-muted hover:text-foreground focus-ring"
                >
                    <RiCloseLine aria-hidden="true" className="size-4" />
                </button>
            )}
        </li>
    );
}
