"use client";

import { useState, useCallback } from "react";
import { ArrowUpDown } from "lucide-react";
import { PatientDetailDialog } from "@/components/patients/patient-detail-dialog";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toCsv, downloadCsv } from "@/lib/csv";

export type PatientRow = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
};

function sortableHeader(label: string) {
  function SortableHeader({
    column,
  }: {
    column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" };
  }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="size-3.5" />
      </Button>
    );
  }
  return SortableHeader;
}

const columns: ColumnDef<PatientRow>[] = [
  {
    accessorKey: "name",
    header: sortableHeader("Name"),
    cell: ({ row }) => (
      <PatientDetailDialog patientId={row.original.id} className="font-medium underline">
        {row.original.name}
      </PatientDetailDialog>
    ),
  },
  { accessorKey: "dob", header: sortableHeader("Date of birth") },
  { accessorKey: "gender", header: "Gender" },
  { accessorKey: "phone", header: "Phone" },
];

const PAGE_SIZE = 20;

export function PatientsTable({ data }: { data: PatientRow[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE, pageIndex: 0 } },
  });

  // Reset to page 0 when filter changes
  const handleFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
    table.setPageIndex(0);
  }, [table]);

  function handleExport() {
    const rows = table.getFilteredRowModel().rows.map((row) => ({
      Name: row.original.name,
      "Date of birth": row.original.dob,
      Gender: row.original.gender,
      Phone: row.original.phone,
    }));
    downloadCsv("patients.csv", toCsv(rows, ["Name", "Date of birth", "Gender", "Phone"]));
  }

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search patients..."
          value={globalFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="max-w-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No patients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
