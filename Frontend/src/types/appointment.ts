export type MessageStatus = "pending" | "sent" | "simulated" | "failed" | "skipped";

export type Appointment = {
  id: string;
  customer_name: string;
  phone_number: string;
  appointment_time: string;
  confirmation_status: MessageStatus;
  confirmation_sent_at: string | null;
  confirmation_payload: Record<string, unknown> | null;
  confirmation_error: string | null;
  reminder_status: MessageStatus;
  reminder_sent_at: string | null;
  reminder_payload: Record<string, unknown> | null;
  reminder_error: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentInput = {
  customerName: string;
  phoneNumber: string;
  appointmentTime: string;
};
