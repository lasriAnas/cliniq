import { describe, it, expect } from "vitest";
import { portalBookingSchema } from "@/lib/schemas/portal-booking";

const FUTURE = "2099-06-15T14:00:00";

const valid = {
  doctorId: "doctor-uuid",
  scheduledAt: FUTURE,
};

describe("portalBookingSchema", () => {
  it("accepts a valid booking", () => {
    expect(portalBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty doctorId", () => {
    const result = portalBookingSchema.safeParse({ ...valid, doctorId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Doctor is required");
    }
  });

  it("rejects an empty scheduledAt", () => {
    const result = portalBookingSchema.safeParse({ ...valid, scheduledAt: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a past scheduledAt", () => {
    const result = portalBookingSchema.safeParse({ ...valid, scheduledAt: "2000-01-01T00:00:00" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Appointment must be in the future");
    }
  });

  it("rejects a non-date string", () => {
    const result = portalBookingSchema.safeParse({ ...valid, scheduledAt: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects scheduledAt that is exactly now (not strictly future)", () => {
    const now = new Date().toISOString();
    const result = portalBookingSchema.safeParse({ ...valid, scheduledAt: now });
    expect(result.success).toBe(false);
  });
});
