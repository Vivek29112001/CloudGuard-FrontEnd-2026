"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};
export function DataTable<T>({
  rows,
  columns,
  searchText,
  searchable = true,
  pageSize = 10,
  emptyMessage = "No matching records",
  filter,
}: {
  rows: T[];
  columns: Column<T>[];
  searchText?: (row: T) => string;
  searchable?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  filter?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (searchText?.(r) ?? JSON.stringify(r))
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [rows, search, searchText],
  );
  const total = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, total);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  return (
    <>
      <div className="table-toolbar">
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-[340px]">
            <Search
              size={14}
              className="absolute top-3 left-3 text-slate-400"
            />
            <Input
              aria-label="Search records"
              className="pl-9"
              placeholder="Search records…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}
        {filter}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No records" description={emptyMessage} />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => (
                <tr
                  key={
                    (
                      row as {
                        id?: string | number;
                        resource_id?: string;
                        service?: string;
                        region_name?: string;
                      }
                    ).id ??
                    `${(row as { resource_id?: string; service?: string; region_name?: string }).resource_id ?? (row as { service?: string }).service ?? (row as { region_name?: string }).region_name ?? "row"}-${index}`
                  }
                >
                  {columns.map((c) => (
                    <td key={c.key}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span>
          {filtered.length === 0
            ? "No results"
            : `Showing ${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span>
            {current} / {total}
          </span>
          <Button
            size="sm"
            aria-label="Next page"
            disabled={current >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </>
  );
}
