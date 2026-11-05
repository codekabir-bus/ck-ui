"use client";

// Client component: sorting and row selection are shared through React context (Table.Root `contextValue`).

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./lib/utils";
import { RiArrowDownSFill, RiArrowUpSFill, RiExpandUpDownFill } from "react-icons/ri";

export type TableSortDirection = "asc" | "desc";

export interface TableContextValue {
    sorted?: { column: string; direction: TableSortDirection };
    onSort?: (column: string) => void;
    selected?: Set<string>;
    onSelect?: (id: string) => void;
}

const TableContext = React.createContext<TableContextValue>({});

export const useTable = () => React.useContext(TableContext);

const tableVariants = {
    root: {
        base: "w-full text-left",
    },
    wrapper: {
        base: "w-full overflow-auto",
    },
    header: {
        base: "w-full",
    },
    body: {
        base: "divide-y divide-border",
    },
    footer: {
        base: "bg-neutral-50 ck-dark:bg-neutral-900",
    },
    row: {
        base: "py-2 group/row w-full",
        hover: "hover:bg-neutral-100 ck-dark:hover:bg-neutral-800",
        selected: "bg-neutral-50/50 ck-dark:bg-neutral-900/50",
    },
    headerCell: {
        base: "px-3 py-2 min-h-5 text-neutral-600 ck-dark:text-neutral-400 bg-muted size-p-sm font-medium",
        first: "first:rounded-l-lg",
        last: "last:rounded-r-lg",
        sortable: "relative cursor-pointer select-none hover:bg-neutral-200 ck-dark:hover:bg-neutral-800",
        sorted: "text-neutral-900 ck-dark:text-neutral-100",
    },
    // The button fills the whole header cell (via ::after) so the click target matches the old clickable <th>.
    sortButton: "flex items-center gap-2 rounded-xs text-left focus-ring after:absolute after:inset-0",
    cell: {
        base: "h-12 px-3 transition duration-base ease-standard text-neutral-600 ck-dark:text-neutral-400 size-p-sm",
        first: "first:rounded-l-xl",
        last: "last:rounded-r-xl",
        hover: "group-hover/row:bg-neutral-100 ck-dark:group-hover/row:bg-neutral-800",
    },
    caption: {
        base: "mt-4 size-p-sm text-muted-foreground",
        top: "mt-0 mb-4",
    },
};

export interface TableRootProps extends React.HTMLAttributes<HTMLTableElement> {
    asChild?: boolean;
    /** Sorting and selection state shared with HeaderCell (`sortable`) and Row (`rowId`). */
    contextValue?: TableContextValue;
    /** Wrap the table in a horizontally scrollable container. */
    responsive?: boolean;
}

const Root = React.forwardRef<HTMLTableElement, TableRootProps>(({ className, asChild = false, contextValue, responsive = false, ...props }, ref) => {
    const Component = asChild ? Slot : "table";

    const table = <Component ref={ref} className={cn(tableVariants.root.base, className)} {...props} />;

    const wrappedTable = responsive ? <div className={tableVariants.wrapper.base}>{table}</div> : table;

    return contextValue ? <TableContext.Provider value={contextValue}>{wrappedTable}</TableContext.Provider> : wrappedTable;
});
Root.displayName = "Table.Root";

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
    asChild?: boolean;
    position?: "top" | "bottom";
}

const Caption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(({ className, asChild = false, position = "bottom", ...props }, ref) => {
    const Component = asChild ? Slot : "caption";

    return <Component ref={ref} className={cn(tableVariants.caption.base, position === "top" && tableVariants.caption.top, className)} {...props} />;
});
Caption.displayName = "Table.Caption";

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    asChild?: boolean;
}

const Header = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "thead";

    return <Component ref={ref} className={cn(tableVariants.header.base, className)} {...props} />;
});
Header.displayName = "Table.Header";

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    asChild?: boolean;
}

const Body = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "tbody";

    return <Component ref={ref} className={cn(tableVariants.body.base, className)} {...props} />;
});
Body.displayName = "Table.Body";

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    asChild?: boolean;
}

const Footer = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "tfoot";

    return <Component ref={ref} className={cn(tableVariants.footer.base, className)} {...props} />;
});
Footer.displayName = "Table.Footer";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    asChild?: boolean;
    /** Header rows get no hover background. */
    isHeader?: boolean;
    /** Hover background on body rows. */
    hover?: boolean;
    /** Selected styling when the row is not driven by the table context. */
    selected?: boolean;
    /** With a `contextValue.selected` set, the row's selection is read from it and clicking the row calls `contextValue.onSelect(rowId)`. */
    rowId?: string;
}

const Row = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, asChild = false, isHeader = false, hover = true, selected = false, rowId, onClick, ...props }, ref) => {
    const Component = asChild ? Slot : "tr";
    const { selected: selectedSet, onSelect } = useTable();

    const isSelected = rowId && selectedSet ? selectedSet.has(rowId) : selected;

    // Compose: the consumer's onClick runs first and can call event.preventDefault() to skip selection.
    const handleClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && rowId && onSelect) {
            onSelect(rowId);
        }
    };

    return (
        <Component
            ref={ref}
            className={cn(tableVariants.row.base, hover && !isHeader && tableVariants.row.hover, isSelected && tableVariants.row.selected, className)}
            data-state={isSelected ? "selected" : undefined}
            onClick={onClick || (rowId && onSelect) ? handleClick : undefined}
            {...props}
        />
    );
});
Row.displayName = "Table.Row";

export interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    asChild?: boolean;
    /** Render the header content as a sort button that calls `contextValue.onSort(sortKey)`. Requires `sortKey`. */
    sortable?: boolean;
    sortKey?: string;
}

function SortIcon({ direction }: { direction?: TableSortDirection }) {
    if (direction === "asc") return <RiArrowUpSFill className="size-4 shrink-0 ml-1 text-primary-strong" aria-hidden="true" />;
    if (direction === "desc") return <RiArrowDownSFill className="size-4 shrink-0 ml-1 text-primary-strong" aria-hidden="true" />;
    return <RiExpandUpDownFill className="size-4 shrink-0 ml-1 text-neutral-400" aria-hidden="true" />;
}

const HeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(({ className, asChild = false, sortable = false, sortKey, scope = "col", children, ...props }, ref) => {
    const { sorted, onSort } = useTable();

    const isSortable = sortable && sortKey !== undefined;
    const sortDirection = isSortable && sorted?.column === sortKey ? sorted.direction : undefined;
    // Only the column the data is currently sorted by carries aria-sort (WAI-ARIA APG sortable table).
    const ariaSort = sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : undefined;

    const classes = cn(
        tableVariants.headerCell.base,
        tableVariants.headerCell.first,
        tableVariants.headerCell.last,
        isSortable && tableVariants.headerCell.sortable,
        sortDirection && tableVariants.headerCell.sorted,
        className
    );

    if (asChild) {
        // Slot is typed with generic HTML attributes, so the <th>-only attributes travel in the spread.
        const cellProps = { scope, ...props };
        return (
            <Slot ref={ref} aria-sort={ariaSort} className={classes} {...cellProps}>
                {children}
            </Slot>
        );
    }

    return (
        <th ref={ref} scope={scope} aria-sort={ariaSort} className={classes} {...props}>
            {isSortable ? (
                <button type="button" className={tableVariants.sortButton} onClick={() => onSort?.(sortKey)}>
                    {children}
                    <SortIcon direction={sortDirection} />
                </button>
            ) : (
                <div className="flex items-center gap-2">{children}</div>
            )}
        </th>
    );
});
HeaderCell.displayName = "Table.HeaderCell";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    asChild?: boolean;
}

const Cell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "td";

    return <Component ref={ref} className={cn(tableVariants.cell.base, tableVariants.cell.first, tableVariants.cell.last, tableVariants.cell.hover, className)} {...props} />;
});
Cell.displayName = "Table.Cell";

export interface TableEmptyRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    colSpan: number;
    children: React.ReactNode;
}

const EmptyRow = React.forwardRef<HTMLTableRowElement, TableEmptyRowProps>(({ colSpan, children, className, ...props }, ref) => {
    return (
        <tr ref={ref} className={className} {...props}>
            <td colSpan={colSpan}>
                <div className="flex flex-col items-center justify-center w-full p-4 text-center">
                    <svg
                        className="size-10 text-muted-foreground"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="22" x2="2" y1="12" y2="12" />
                        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        <line x1="6" x2="6.01" y1="16" y2="16" />
                        <line x1="10" x2="10.01" y1="16" y2="16" />
                    </svg>
                    <p className="mt-5 size-p-sm text-muted-foreground ck-dark:text-neutral-300">{children}</p>
                </div>
            </td>
        </tr>
    );
});
EmptyRow.displayName = "Table.EmptyRow";

const Table = {
    Root,
    Caption,
    Header,
    Body,
    Footer,
    Row,
    HeaderCell,
    /** @deprecated Use `HeaderCell`. */
    Head: HeaderCell,
    Cell,
    EmptyRow,
};

export { Table, Root, Caption, Header, Body, Footer, Row, HeaderCell, HeaderCell as Head, Cell, EmptyRow, TableContext };
export default Table;
