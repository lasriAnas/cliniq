import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { getCurrentProfile } from "@/lib/auth";
import { AuditLogFilters } from "@/components/audit-log/audit-log-filters";
import { AuditLogPaginator } from "@/components/audit-log/audit-log-paginator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@/generated/prisma/client";

const ACTION_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: "Account created",
  ROLE_CHANGED: "Role changed",
  ACCOUNT_DEACTIVATED: "Account deactivated",
  ACCOUNT_REACTIVATED: "Account reactivated",
  PATIENT_DELETED: "Patient deleted",
  INVOICE_STATUS_CHANGED: "Invoice status changed",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "ADMIN") {
    redirect("/dashboard/patients");
  }

  const { action, actor, page } = await searchParams;

  const where: Prisma.AuditLogWhereInput = {};
  if (action) where.action = action;
  if (actor) where.actorName = { contains: actor, mode: "insensitive" };

  const PAGE_SIZE = 50;
  const pageNum = Math.max(0, Number(page ?? 0));

  const [logs, total] = await withRetry(() =>
    Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pageNum * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
    ]),
  );

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>

      <AuditLogFilters />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit events found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {log.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell>{log.actorName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ACTION_LABELS[log.action] ?? log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.targetType}</TableCell>
                  <TableCell className="text-muted-foreground">{log.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AuditLogPaginator page={pageNum} pageCount={pageCount} total={total} />
    </div>
  );
}
