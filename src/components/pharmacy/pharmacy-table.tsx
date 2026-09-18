"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { deleteMedication } from "@/app/dashboard/pharmacy/actions";
import { RestockDialog } from "@/components/pharmacy/restock-dialog";
import { UseStockDialog } from "@/components/pharmacy/use-stock-dialog";

type Item = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  reorderThreshold: number;
  category: "MEDICATION" | "SUPPLY";
};

type Filter = "ALL" | "MEDICATION" | "SUPPLY";

export function PharmacyTable({
  data,
  canRestock,
  canDelete,
}: {
  data: Item[];
  canRestock: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = data.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || m.category === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    ALL: data.length,
    MEDICATION: data.filter((m) => m.category === "MEDICATION").length,
    SUPPLY: data.filter((m) => m.category === "SUPPLY").length,
  };

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMedication(id);
      setConfirmingDelete(null);
      router.refresh();
    });
  }

  const TABS: { key: Filter; label: string }[] = [
    { key: "ALL",        label: `All (${counts.ALL})`               },
    { key: "MEDICATION", label: `Medications (${counts.MEDICATION})` },
    { key: "SUPPLY",     label: `Supplies (${counts.SUPPLY})`        },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1 ml-auto">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Reorder at</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {data.length === 0 ? "No items added yet." : "No items match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.category === "SUPPLY" ? "Supply" : "Medication"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <span className={item.stock <= item.reorderThreshold ? "text-destructive font-semibold" : ""}>
                      {item.stock}
                    </span>
                    {item.stock <= item.reorderThreshold && (
                      <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.reorderThreshold}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {canRestock && (
                        <>
                          <UseStockDialog item={item} />
                          <RestockDialog medication={item} />
                        </>
                      )}
                      {canDelete && (
                        confirmingDelete === item.id ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmingDelete(null)}
                              disabled={isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                            >
                              {isPending ? "Deleting..." : "Confirm"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingDelete(item.id)}
                          >
                            Delete
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
