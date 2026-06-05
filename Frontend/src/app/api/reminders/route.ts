import { NextResponse } from "next/server";
import { listPendingReminders, updateAppointment } from "@/lib/appointments";
import { sendAppointmentMessage } from "@/lib/messaging";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appointments = await listPendingReminders();
    const results = [];

    for (const appointment of appointments) {
      const result = await sendAppointmentMessage(appointment, "reminder");
      const updated = await updateAppointment(appointment.id, {
        reminder_status: result.status,
        reminder_sent_at: result.sentAt,
        reminder_payload: result.payload,
        reminder_error: result.error
      });

      results.push({
        id: updated.id,
        customerName: updated.customer_name,
        reminderStatus: updated.reminder_status
      });
    }

    return NextResponse.json({
      processed: results.length,
      reminders: results
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process reminders" },
      { status: 500 }
    );
  }
}
