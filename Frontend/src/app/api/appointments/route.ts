import { NextResponse } from "next/server";
import { createAppointment, listAppointments, updateAppointment } from "@/lib/appointments";
import { sendAppointmentMessage } from "@/lib/messaging";
import { appointmentInputSchema, normalizePhoneNumber } from "@/lib/validation";

export async function GET() {
  try {
    const appointments = await listAppointments();
    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = appointmentInputSchema.parse(body);

    const appointment = await createAppointment({
      customer_name: parsed.customerName.trim(),
      phone_number: normalizePhoneNumber(parsed.phoneNumber),
      appointment_time: parsed.appointmentTime,
      confirmation_status: "pending",
      confirmation_sent_at: null,
      confirmation_payload: null,
      confirmation_error: null,
      reminder_status: "pending",
      reminder_sent_at: null,
      reminder_payload: null,
      reminder_error: null
    });

    const result = await sendAppointmentMessage(appointment, "confirmation");
    const updated = await updateAppointment(appointment.id, {
      confirmation_status: result.status,
      confirmation_sent_at: result.sentAt,
      confirmation_payload: result.payload,
      confirmation_error: result.error
    });

    return NextResponse.json({ appointment: updated }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create appointment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
