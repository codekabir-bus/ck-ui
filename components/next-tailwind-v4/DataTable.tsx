"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import * as Checkbox from "./Checkbox";
import * as Pagination from "./Pagination";
import * as Skeleton from "./Skeleton";
import * as Table from "./Table";

/*
 * A data table built on Table: column definitions, sorting (Table's aria-sort header buttons), optional row
 * selection (Checkbox), loading (Skeleton), an empty state and pagination (Pagination).
 * Every piece of state can be controlled, and `manualSorting` / `manualPagination` let you sort and page on the
 * server: DataTable then only renders what you give it. It never fetches data.
 * sortRows / paginateRows / compareValues are exported for use outside the component.
 */

export type DataTableSortDirection = "asc" | "desc";
export type DataTableSorting = { columnId: string; direction: DataTableSortDirection } | null;
export type DataTableCellValue = string | number | boolean | Date | null | undefined;

export interface DataTableColumn<TRow> {
    id: string;
    header: React.ReactNode;
    /** Value for sorting and the default cell text. */
    accessor?: (row: TRow) => DataTableCellValue;
    /** Cell content. Defaults to the accessor's value as text. */
    cell?: (row: TRow) => React.ReactNode;
    sortable?: boolean;
    /** Custom comparator for this column (ascending order). */
    sortFn?: (a: TRow, b: TRow) => number;
    align?: "start" | "center" | "end";
    headerClassName?: string;
    /** Cells do not wrap by default (the table scrolls); add "whitespace-normal" for long text. */
    cellClassName?: string;
}

const collator = typeof Intl !== "undefined" ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }) : null;

/** Ascending comparison: numbers and dates numerically, text with a numeric-aware collator, empty values last. */
export function compareValues(a: DataTableCellValue, b: DataTableCellValue): number {
    const aEmpty = a === null || a === undefined || a === "";
    const bEmpty = b === null || b === undefined || b === "";
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
    const textA = String(a);
    const textB = String(b);
    return collator ? collator.compare(textA, textB) : textA.localeCompare(textB);
}

/** Stable sort by one column. Returns a new array; the input is not modified. */
export function sortRows<TRow>(rows: readonly TRow[], columns: readonly DataTableColumn<TRow>[], sorting: DataTableSorting): TRow[] {
    if (!sorting) return [...rows];
    const column = columns.find((entry) => entry.id === sorting.columnId);
    if (!column || (!column.sortFn && !column.accessor)) return [...rows];
    const factor = sorting.direction === "asc" ? 1 : -1;
    const compare = column.sortFn ?? ((a: TRow, b: TRow) => compareValues(column.accessor!(a), column.accessor!(b)));
    return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            // Empty values stay last in both directions.
            if (!column.sortFn && column.accessor) {
                const aValue = column.accessor(a.row);
                const bValue = column.accessor(b.row);
                const aEmpty = aValue === null || aValue === undefined || aValue === "";
                const bEmpty = bValue === null || bValue === undefined || bValue === "";
                if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
            }
            return compare(a.row, b.row) * factor || a.index - b.index;
        })
        .map((entry) => entry.row);
}

/** The rows of one page (1-based). */
export function paginateRows<TRow>(rows: readonly TRow[], page: number, pageSize: number): TRow[] {
    const size = Math.max(1, Math.floor(pageSize));
    const start = (Math.max(1, Math.floor(page)) - 1) * size;
    return rows.slice(start, start + size);
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange: ((value: T) => void) | undefined) {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const isControlled = value !== undefined;
    const setValue = React.useCallback(
        (next: T) => {
            if (!isControlled) setUncontrolled(next);
            onChange?.(next);
        },
        [isControlled, onChange]
    );
    return [isControlled ? (value as T) : uncontrolled, setValue] as const;
}

const alignClasses = { start: "text-left", center: "text-center", end: "text-right" } as const;

const formatCell = (value: DataTableCellValue) => (value instanceof Date ? value.toLocaleDateString() : value === null || value === undefined ? "" : String(value));

export interface DataTableRootProps<TRow> {
    data: readonly TRow[];
    columns: readonly DataTableColumn<TRow>[];
    getRowId: (row: TRow, index: number) => string;
    /** Names the table (rendered as <caption>). Visually hidden unless `captionVisible`. */
    caption: React.ReactNode;
    captionVisible?: boolean;

    sorting?: DataTableSorting;
    defaultSorting?: DataTableSorting;
    onSortingChange?: (sorting: DataTableSorting) => void;
    /** `data` is already sorted (e.g. by the server): only report sorting changes. */
    manualSorting?: boolean;

    /** Adds a checkbox column. */
    selectable?: boolean;
    selectedRowIds?: string[];
    defaultSelectedRowIds?: string[];
    onSelectedRowIdsChange?: (ids: string[]) => void;
    /** Text used in each row checkbox's label ("Select <label>"). Defaults to the row id. */
    getRowLabel?: (row: TRow) => string;

    /** Rows per page. Pagination is shown when set. */
    pageSize?: number;
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** `data` is already the current page: `rowCount` gives the total. */
    manualPagination?: boolean;
    rowCount?: number;
    paginationLabel?: string;

    loading?: boolean;
    /** Skeleton rows shown while loading. */
    loadingRows?: number;
    emptyMessage?: React.ReactNode;
    className?: string;
}

function Root<TRow>({
    data,
    columns,
    getRowId,
    caption,
    captionVisible = false,
    sorting: sortingProp,
    defaultSorting = null,
    onSortingChange,
    manualSorting = false,
    selectable = false,
    selectedRowIds,
    defaultSelectedRowIds = [],
    onSelectedRowIdsChange,
    getRowLabel,
    pageSize,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    manualPagination = false,
    rowCount,
    paginationLabel = "Table pagination",
    loading = false,
    loadingRows = 5,
    emptyMessage = "No results.",
    className,
}: DataTableRootProps<TRow>) {
    const captionId = `${React.useId()}-caption`;
    const [sorting, setSorting] = useControllable<DataTableSorting>(sortingProp, defaultSorting, onSortingChange);
    const [selected, setSelected] = useControllable<string[]>(selectedRowIds, defaultSelectedRowIds, onSelectedRowIdsChange);
    const [page, setPage] = useControllable<number>(pageProp, defaultPage, onPageChange);
    const [announcement, setAnnouncement] = React.useState("");

    const sortedRows = React.useMemo(() => (manualSorting ? [...data] : sortRows(data, columns, sorting)), [data, columns, sorting, manualSorting]);
    const total = manualPagination ? (rowCount ?? data.length) : sortedRows.length;
    const paginated = pageSize !== undefined;
    const pageCount = paginated ? Math.max(1, Math.ceil(total / Math.max(1, pageSize))) : 1;
    const currentPage = Math.min(Math.max(1, page), pageCount);
    const pageRows = paginated && !manualPagination ? paginateRows(sortedRows, currentPage, pageSize) : sortedRows;
    const indexByRow = React.useMemo(() => new Map(data.map((row, index) => [row, index] as const)), [data]);
    const rowIds = pageRows.map((row) => getRowId(row, indexByRow.get(row) ?? 0));
    const selectedSet = new Set(selected);
    const selectedOnPage = rowIds.filter((id) => selectedSet.has(id)).length;
    const columnCount = columns.length + (selectable ? 1 : 0);

    const headerLabel = (columnId: string) => {
        const header = columns.find((column) => column.id === columnId)?.header;
        return typeof header === "string" ? header : columnId;
    };

    const onSort = (columnId: string) => {
        // none → ascending → descending → none
        const next: DataTableSorting =
            sorting?.columnId !== columnId ? { columnId, direction: "asc" } : sorting.direction === "asc" ? { columnId, direction: "desc" } : null;
        setSorting(next);
        setAnnouncement(next ? `Sorted by ${headerLabel(next.columnId)}, ${next.direction === "asc" ? "ascending" : "descending"}` : "Sorting removed");
        if (paginated && currentPage !== 1) setPage(1);
    };

    const toggleRow = (id: string, checked: boolean) => setSelected(checked ? [...selected.filter((entry) => entry !== id), id] : selected.filter((entry) => entry !== id));

    const togglePage = (checked: boolean) => {
        const others = selected.filter((id) => !rowIds.includes(id));
        setSelected(checked ? [...others, ...rowIds] : others);
    };

    const paginationRef = React.useRef<HTMLElement>(null);
    // Set when a pagination control changes the page, so focus can be kept in the pagination afterwards.
    const restorePaginationFocus = React.useRef(false);
    const [paginationFocusRequest, setPaginationFocusRequest] = React.useState(0);

    const goTo = (next: number) => {
        if (paginationRef.current?.contains(document.activeElement)) {
            restorePaginationFocus.current = true;
            setPaginationFocusRequest((count) => count + 1);
        }
        setPage(Math.min(Math.max(1, next), pageCount));
    };

    // The control that changed the page can become disabled (Previous on page 1, Next on the last page, every
    // control while loading) or move within the page list, and the browser then drops focus to <body>.
    // Once the page has settled, keep focus in the pagination on the current page instead.
    React.useEffect(() => {
        if (!restorePaginationFocus.current || loading) return;
        restorePaginationFocus.current = false;
        const nav = paginationRef.current;
        const active = document.activeElement;
        const focusKept = active instanceof HTMLElement && nav?.contains(active) && !active.matches(":disabled, [aria-disabled='true']");
        if (!focusKept) nav?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    }, [paginationFocusRequest, currentPage, loading]);

    const firstRow = total === 0 ? 0 : (currentPage - 1) * (pageSize ?? total) + 1;
    const lastRow = Math.min(total, currentPage * (pageSize ?? total));
    const footerStatus = [
        selectable && selected.length > 0 ? `${selected.length} selected` : null,
        paginated ? (total === 0 ? "0 rows" : `${firstRow}–${lastRow} of ${total}`) : null,
    ].filter((part): part is string => part !== null);

    return (
        <div className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
            {/* Scroll container: focusable so keyboard users can scroll wide tables horizontally. `relative` keeps
                visually hidden (sr-only, absolutely positioned) cell content inside it instead of widening the page. */}
            <div role="region" aria-labelledby={captionId} tabIndex={0} className="relative w-full overflow-x-auto rounded-xl focus-ring">
                <Table.Root
                    aria-busy={loading || undefined}
                    contextValue={{
                        sorted: sorting ? { column: sorting.columnId, direction: sorting.direction } : undefined,
                        onSort,
                    }}
                    className="min-w-full"
                >
                    <Table.Caption id={captionId} position="top" className={cn(!captionVisible && "sr-only")}>
                        {caption}
                    </Table.Caption>
                    <Table.Header>
                        <Table.Row isHeader>
                            {selectable && (
                                <Table.HeaderCell className="w-10">
                                    <Checkbox.Root
                                        aria-label="Select all rows on this page"
                                        checked={rowIds.length > 0 && selectedOnPage === rowIds.length ? true : selectedOnPage > 0 ? "indeterminate" : false}
                                        onCheckedChange={(checked) => togglePage(checked === true)}
                                        disabled={loading || rowIds.length === 0}
                                    />
                                </Table.HeaderCell>
                            )}
                            {columns.map((column) => (
                                <Table.HeaderCell
                                    key={column.id}
                                    sortable={Boolean(column.sortable && (column.accessor || column.sortFn))}
                                    sortKey={column.id}
                                    className={cn("whitespace-nowrap", alignClasses[column.align ?? "start"], column.headerClassName)}
                                >
                                    {column.header}
                                </Table.HeaderCell>
                            ))}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {loading ? (
                            Array.from({ length: Math.max(1, loadingRows) }, (_, rowIndex) => (
                                <Table.Row key={`loading-${rowIndex}`} hover={false}>
                                    {Array.from({ length: columnCount }, (_, cellIndex) => (
                                        <Table.Cell key={cellIndex}>
                                            <Skeleton.Root className={cn("h-4", cellIndex === 0 && selectable ? "size-5 rounded-md" : "w-3/4")} />
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            ))
                        ) : pageRows.length === 0 ? (
                            <Table.EmptyRow colSpan={columnCount}>{emptyMessage}</Table.EmptyRow>
                        ) : (
                            pageRows.map((row, index) => {
                                const id = rowIds[index];
                                const isSelected = selectedSet.has(id);
                                return (
                                    <Table.Row key={id} selected={isSelected} data-row-id={id}>
                                        {selectable && (
                                            <Table.Cell className="w-10">
                                                <Checkbox.Root
                                                    aria-label={`Select ${getRowLabel ? getRowLabel(row) : id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => toggleRow(id, checked === true)}
                                                />
                                            </Table.Cell>
                                        )}
                                        {/* No wrapping by default: the table scrolls horizontally instead of crushing columns. */}
                                        {columns.map((column) => (
                                            <Table.Cell key={column.id} className={cn("whitespace-nowrap", alignClasses[column.align ?? "start"], column.cellClassName)}>
                                                {column.cell ? column.cell(row) : formatCell(column.accessor?.(row))}
                                            </Table.Cell>
                                        ))}
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table.Root>
            </div>

            {/* Announces loading and sort changes without moving focus. */}
            <p role="status" className="sr-only">
                {loading ? "Loading rows" : announcement}
            </p>

            {footerStatus.length > 0 && (
                // In a narrow container the pagination wraps under the status and stays aligned to the end.
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <p className="size-p-sm text-muted-foreground">
                        {footerStatus.map((part, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && " · "}
                                <span className="whitespace-nowrap">{part}</span>
                            </React.Fragment>
                        ))}
                    </p>
                    {paginated && pageCount > 1 && (
                        <Pagination.Root ref={paginationRef} aria-label={paginationLabel} className="ml-auto w-auto">
                            <Pagination.Content>
                                <Pagination.Item>
                                    <Pagination.Previous size="sm" disabled={currentPage === 1 || loading} onClick={() => goTo(currentPage - 1)} />
                                </Pagination.Item>
                                {Pagination.getPaginationRange({ page: currentPage, pageCount, siblingCount: 0 }).map((item, index) => (
                                    <Pagination.Item key={item === "ellipsis" ? `ellipsis-${index}` : item}>
                                        {item === "ellipsis" ? (
                                            <Pagination.Ellipsis size="sm" />
                                        ) : (
                                            <Pagination.Link size="sm" isActive={item === currentPage} disabled={loading} onClick={() => goTo(item)}>
                                                {item}
                                            </Pagination.Link>
                                        )}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Item>
                                    <Pagination.Next size="sm" disabled={currentPage === pageCount || loading} onClick={() => goTo(currentPage + 1)} />
                                </Pagination.Item>
                            </Pagination.Content>
                        </Pagination.Root>
                    )}
                </div>
            )}
        </div>
    );
}
Root.displayName = "DataTable.Root";

export { Root };
