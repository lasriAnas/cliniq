import { getCurrentPatient } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalPrescriptionsPage() {
  const patient = (await getCurrentPatient())!;

  const prescriptions = await withRetry(() =>
    prisma.prescription.findMany({
      where: { appointment: { patientId: patient.id } },
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          include: { doctor: { select: { name: true } } },
        },
        items: { orderBy: { createdAt: "asc" } },
      },
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">All medications prescribed to you.</p>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No prescriptions on record yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  Prescription from Dr. {rx.appointment.doctor.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(rx.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Medication</th>
                      <th className="pb-2 font-medium">Dosage</th>
                      <th className="pb-2 font-medium">Duration</th>
                      <th className="pb-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{item.medicationName}</td>
                        <td className="py-2 text-muted-foreground">{item.dosage}</td>
                        <td className="py-2 text-muted-foreground">{item.duration || "—"}</td>
                        <td className="py-2 text-muted-foreground">{item.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
