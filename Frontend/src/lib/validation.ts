import { z } from "zod";

export const appointmentInputSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required").max(120),
  // Accept common human-entered phone formats (spaces, dashes, parens) and
  // normalize to E.164 on the server.
  phoneNumber: z
    .string()
    .trim()
    .min(4, "Phone number is required"),
  appointmentTime: z.string().datetime("Appointment time must be a valid ISO date")
});

export function normalizePhoneNumber(phoneNumber: string) {
  // Remove all characters except digits and plus sign
  const cleaned = String(phoneNumber).replace(/[^(+\d)]/g, "");

  // If the user entered leading zeros or omitted the plus, ensure we prefix +
  const onlyDigits = cleaned.replace(/[^\d]/g, "");
  if (!onlyDigits) {
    return cleaned;
  }

  // If cleaned already starts with + followed by digits, keep it.
  if (/^\+\d+$/.test(cleaned)) {
    return cleaned;
  }

  // Otherwise, prefix with + and the numeric digits
  return `+${onlyDigits}`;
}
