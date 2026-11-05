"use client";

import * as React from "react";
import { RiCloseLine, RiFileLine, RiUploadCloud2Line } from "react-icons/ri";
import { cn } from "./lib/utils";
import { useFieldControlProps } from "./Field";

/*
 * Client-side file selection (no uploading, no reading file contents).
 *   FileUpload.Dropzone holds a real, focusable <input type="file">: Tab to it and press Enter/Space, or click
 *   anywhere in the zone, to open the system picker. Dropping files is an extra, never the only way.
 *   Files are checked against `accept`, `maxSize` and `maxFiles`; rejected files are listed by FileUpload.Errors.
 *   Additions, removals and rejections are announced once through a polite status region.
 * Read the selection from `onValueChange` and upload it yourself. With `name`, the browser also submits the
 * selected files with a native form where it supports setting them (DataTransfer).
 */

export type FileRejectionReason = "file-type" | "file-too-large" | "too-many-files";
export interface FileRejection {
    file: File;
    reasons: FileRejectionReason[];
}

/** "1.2 MB" style sizes (base 1024). */
export function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes < 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let size = bytes / 1024;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    return `${size >= 10 ? Math.round(size) : Math.round(size * 10) / 10} ${units[unit]}`;
}

/** Same rules as the native `accept` attribute: ".pdf", "image/*", "application/pdf". */
export function isFileAccepted(file: File, accept: string | undefined) {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || "").toLowerCase();
    return accept
        .split(",")
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean)
        .some((token) => {
            if (token.startsWith(".")) return name.endsWith(token);
            if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
            return type === token;
        });
}

const REASON_TEXT: Record<FileRejectionReason, string> = {
    "file-type": "file type not allowed",
    "file-too-large": "file is too large",
    "too-many-files": "too many files",
};

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

type FileUploadContextValue = {
    files: File[];
    rejections: FileRejection[];
    inputId: string;
    hintId: string;
    errorsId: string;
    accept?: string;
    multiple: boolean;
    maxSize?: number;
    disabled: boolean;
    invalid: boolean;
    required: boolean;
    name?: string;
    form?: string;
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
    addFiles: (incoming: File[]) => void;
    removeFile: (file: File) => void;
};

const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

function useFileUpload(part: string) {
    const context = React.useContext(FileUploadContext);
    if (!context) throw new Error(`<FileUpload.${part}> must be rendered inside <FileUpload.Root>.`);
    return context;
}

export interface FileUploadRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    /** Selected files (controlled). */
    value?: File[];
    defaultValue?: File[];
    onValueChange?: (files: File[]) => void;
    /** Called with the files that failed validation in the latest selection. */
    onReject?: (rejections: FileRejection[]) => void;
    /** Allowed types, as in the native attribute: "image/*,.pdf". */
    accept?: string;
    multiple?: boolean;
    /** Maximum size per file, in bytes. */
    maxSize?: number;
    /** Maximum number of files in total. */
    maxFiles?: number;
    disabled?: boolean;
    invalid?: boolean;
    /** At least one file must be selected before the form submits. */
    required?: boolean;
    name?: string;
    form?: string;
    /** Id of the file input (Field.Root provides one). */
    inputId?: string;
}

const Root = React.forwardRef<HTMLDivElement, FileUploadRootProps>(
    (
        { value, defaultValue, onValueChange, onReject, accept, multiple = false, maxSize, maxFiles, disabled, invalid, required, name, form, inputId, className, children, ...props },
        ref
    ) => {
        const [uncontrolled, setUncontrolled] = React.useState<File[]>(defaultValue ?? []);
        const isControlled = value !== undefined;
        const files = isControlled ? value : uncontrolled;
        const [rejections, setRejections] = React.useState<FileRejection[]>([]);
        const [announcement, setAnnouncement] = React.useState("");
        const [missingRequired, setMissingRequired] = React.useState(false);
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        const baseId = React.useId();

        const field = useFieldControlProps({ id: inputId, disabled, required }, { invalid: invalid || (missingRequired && files.length === 0) });
        const resolvedInputId = field.id ?? `${baseId}-input`;

        const commit = React.useCallback(
            (next: File[], message: string) => {
                if (!isControlled) setUncontrolled(next);
                onValueChange?.(next);
                setAnnouncement(message);
                if (next.length > 0) setMissingRequired(false);
            },
            [isControlled, onValueChange]
        );

        const addFiles = React.useCallback(
            (incoming: File[]) => {
                const accepted: File[] = [];
                const rejected: FileRejection[] = [];
                const base = multiple ? files : [];
                const limit = multiple ? (maxFiles ?? Infinity) : 1;

                for (const file of incoming) {
                    if (base.some((existing) => sameFile(existing, file)) || accepted.some((existing) => sameFile(existing, file))) continue;
                    const reasons: FileRejectionReason[] = [];
                    if (!isFileAccepted(file, accept)) reasons.push("file-type");
                    if (maxSize !== undefined && file.size > maxSize) reasons.push("file-too-large");
                    if (reasons.length === 0 && base.length + accepted.length >= limit) reasons.push("too-many-files");
                    if (reasons.length) rejected.push({ file, reasons });
                    else accepted.push(file);
                }

                setRejections(rejected);
                if (rejected.length) onReject?.(rejected);

                const parts: string[] = [];
                if (accepted.length) parts.push(accepted.length === 1 ? `Added ${accepted[0].name}.` : `Added ${accepted.length} files.`);
                if (rejected.length) parts.push(rejected.map((entry) => `${entry.file.name} rejected: ${entry.reasons.map((reason) => REASON_TEXT[reason]).join(", ")}.`).join(" "));
                const message = parts.join(" ");

                if (accepted.length) commit([...base, ...accepted], message);
                else setAnnouncement(message);
            },
            [files, multiple, maxFiles, maxSize, accept, onReject, commit]
        );

        const removeFile = React.useCallback(
            (file: File) => {
                setRejections([]);
                commit(
                    files.filter((entry) => entry !== file),
                    `Removed ${file.name}.`
                );
            },
            [files, commit]
        );

        // Keep the native input's FileList in sync so a native form submits the selection (where supported).
        React.useEffect(() => {
            const input = inputRef.current;
            if (!input || typeof DataTransfer === "undefined") return;
            try {
                const transfer = new DataTransfer();
                files.forEach((file) => transfer.items.add(file));
                input.files = transfer.files;
            } catch {
                // Browsers without a writable FileList: the selection is still available through onValueChange.
            }
        }, [files]);

        // Clear errors when the form is reset.
        React.useEffect(() => {
            const formElement = inputRef.current?.form;
            if (!formElement) return;
            const onReset = () => {
                setRejections([]);
                setMissingRequired(false);
                if (!isControlled) setUncontrolled(defaultValue ?? []);
            };
            formElement.addEventListener("reset", onReset);
            return () => formElement.removeEventListener("reset", onReset);
        }, [isControlled, defaultValue]);

        const context: FileUploadContextValue = {
            files,
            rejections,
            inputId: resolvedInputId,
            hintId: `${baseId}-hint`,
            errorsId: `${baseId}-errors`,
            accept,
            multiple,
            maxSize,
            disabled: Boolean(field.disabled),
            invalid: Boolean(field["aria-invalid"]) || rejections.length > 0,
            required: Boolean(field.required),
            name,
            form,
            inputRef,
            addFiles,
            removeFile,
        };

        return (
            <FileUploadContext.Provider value={context}>
                <div ref={ref} data-disabled={context.disabled || undefined} className={cn("relative flex w-full flex-col gap-3", className)} {...props}>
                    {children}
                    <p role="status" className="sr-only">
                        {announcement}
                    </p>
                    {context.required && (
                        <input
                            tabIndex={-1}
                            aria-hidden="true"
                            form={form}
                            value={files.length ? String(files.length) : ""}
                            required
                            disabled={context.disabled}
                            onChange={() => {}}
                            onInvalid={(event) => {
                                event.preventDefault();
                                setMissingRequired(true);
                                inputRef.current?.focus();
                            }}
                            className="pointer-events-none absolute left-0 top-0 size-px opacity-0"
                        />
                    )}
                </div>
            </FileUploadContext.Provider>
        );
    }
);
Root.displayName = "FileUpload.Root";

export interface FileUploadDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Instructions shown in the zone and used as the input's description. */
    children?: React.ReactNode;
}

const Dropzone = React.forwardRef<HTMLDivElement, FileUploadDropzoneProps>(({ className, children, onClick, ...props }, ref) => {
    const context = useFileUpload("Dropzone");
    const [dragging, setDragging] = React.useState(false);
    const controlProps = useFieldControlProps({ id: context.inputId, "aria-describedby": context.hintId + (context.rejections.length ? ` ${context.errorsId}` : "") });

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        if (context.disabled) return;
        context.addFiles(Array.from(event.dataTransfer.files ?? []));
    };

    return (
        <div
            ref={ref}
            data-dragging={dragging || undefined}
            data-invalid={context.invalid || undefined}
            data-disabled={context.disabled || undefined}
            onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented || context.disabled) return;
                if (event.target !== context.inputRef.current) context.inputRef.current?.click();
            }}
            onDragEnter={(event) => {
                event.preventDefault();
                if (!context.disabled) setDragging(true);
            }}
            onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) event.dataTransfer.dropEffect = context.disabled ? "none" : "copy";
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
            }}
            onDrop={onDrop}
            className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-transparent px-6 py-8 text-center transition-colors duration-base",
                "hover:bg-muted data-[dragging]:border-primary data-[dragging]:bg-primary-subtle",
                // Field focus: strong border plus a soft halo outside it (keyboard focus on the hidden file input).
                "outline outline-0 outline-offset-2 outline-accent has-[input:focus-visible]:border-foreground has-[input:focus-visible]:outline-2",
                "data-[invalid]:border-destructive",
                "data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:opacity-60 data-[disabled]:hover:bg-muted",
                className
            )}
            {...props}
        >
            <RiUploadCloud2Line aria-hidden="true" className="size-8 text-muted-foreground" />
            <div id={context.hintId} className="flex flex-col gap-1 size-p-sm text-muted-foreground">
                {children ?? (
                    <>
                        <span>
                            <span className="font-medium text-foreground">Choose {context.multiple ? "files" : "a file"}</span> or drag {context.multiple ? "them" : "it"} here.
                        </span>{" "}
                        {(context.accept || context.maxSize !== undefined) && (
                            <span className="size-p-xs">
                                {[context.accept && `Accepted: ${context.accept}`, context.maxSize !== undefined && `Up to ${formatBytes(context.maxSize)}`].filter(Boolean).join(" · ")}
                            </span>
                        )}
                    </>
                )}
            </div>
            <input
                ref={context.inputRef}
                type="file"
                id={controlProps.id}
                name={context.name}
                form={context.form}
                accept={context.accept}
                multiple={context.multiple}
                disabled={context.disabled}
                aria-describedby={controlProps["aria-describedby"]}
                aria-invalid={context.invalid || undefined}
                aria-required={context.required || undefined}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                    const selection = Array.from(event.target.files ?? []);
                    // Clear so choosing the same file again fires change; the synced FileList is restored by Root.
                    if (typeof DataTransfer === "undefined") event.target.value = "";
                    context.addFiles(selection);
                }}
                className="sr-only"
            />
        </div>
    );
});
Dropzone.displayName = "FileUpload.Dropzone";

export interface FileUploadListProps extends React.HTMLAttributes<HTMLUListElement> {
    /** Accessible name prefix for remove buttons ("Remove <file name>"). */
    removeLabel?: string;
}

const List = React.forwardRef<HTMLUListElement, FileUploadListProps>(({ className, removeLabel = "Remove", ...props }, ref) => {
    const context = useFileUpload("List");
    const listRef = React.useRef<HTMLUListElement | null>(null);
    if (context.files.length === 0) return null;

    const remove = (file: File, index: number) => {
        // Keep focus on a remove button (next, else previous), or return it to the file input.
        const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-remove]") ?? []);
        const next = buttons[index + 1] ?? buttons[index - 1];
        context.removeFile(file);
        requestAnimationFrame(() => {
            if (next?.isConnected) next.focus();
            else context.inputRef.current?.focus();
        });
    };

    return (
        <ul
            ref={(node) => {
                listRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            }}
            aria-label="Selected files"
            className={cn("flex flex-col gap-2", className)}
            {...props}
        >
            {context.files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                    <RiFileLine aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate size-label-sm text-foreground">{file.name}</span>
                        <span className="size-p-xs text-muted-foreground">{formatBytes(file.size)}</span>
                    </span>
                    <button
                        type="button"
                        data-remove=""
                        aria-label={`${removeLabel} ${file.name}`}
                        disabled={context.disabled}
                        onClick={() => remove(file, index)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        <RiCloseLine aria-hidden="true" className="size-4" />
                    </button>
                </li>
            ))}
        </ul>
    );
});
List.displayName = "FileUpload.List";

/** Lists the files rejected by the latest selection. Visual only: the rejection is announced by Root. */
const Errors = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => {
    const context = useFileUpload("Errors");
    if (context.rejections.length === 0) return null;

    return (
        <ul ref={ref} id={context.errorsId} className={cn("flex flex-col gap-1 size-p-xs text-destructive-strong", className)} {...props}>
            {context.rejections.map(({ file, reasons }) => (
                <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                    {file.name}: {reasons.map((reason) => REASON_TEXT[reason]).join(", ")}
                </li>
            ))}
        </ul>
    );
});
Errors.displayName = "FileUpload.Errors";

export { Root, Dropzone, List, Errors };
