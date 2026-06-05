import { format } from "date-fns";
import { getMessagingMode, hasWhatsAppConfig } from "@/lib/env";
import type { Appointment } from "@/types/appointment";

type MessageKind = "confirmation" | "reminder";

type SendResult = {
  status: "sent" | "simulated" | "failed";
  sentAt: string | null;
  payload: Record<string, unknown>;
  error: string | null;
};

function buildHumanMessage(appointment: Appointment, kind: MessageKind) {
  const time = format(new Date(appointment.appointment_time), "PPpp");

  if (kind === "reminder") {
    return `Reminder: Hi ${appointment.customer_name}, your appointment is coming up at ${time}.`;
  }

  return `Hi ${appointment.customer_name}, your appointment is confirmed for ${time}.`;
}

function buildTemplatePayload(appointment: Appointment, kind: MessageKind) {
  const templateName =
    kind === "reminder" && process.env.WHATSAPP_REMINDER_TEMPLATE_NAME
      ? process.env.WHATSAPP_REMINDER_TEMPLATE_NAME
      : process.env.WHATSAPP_TEMPLATE_NAME;

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: appointment.phone_number.replace(/^\+/, ""),
    type: "template",
    template: {
      name: templateName,
      language: {
        code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US"
      }
    }
  };

  if (templateName === "hello_world") {
    return payload;
  }

  return {
    ...payload,
    template: {
      ...(payload.template as Record<string, unknown>),
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: appointment.customer_name
            },
            {
              type: "text",
              text: format(new Date(appointment.appointment_time), "PP")
            },
            {
              type: "text",
              text: format(new Date(appointment.appointment_time), "p")
            }
          ]
        }
      ]
    }
  };
}

export async function sendAppointmentMessage(
  appointment: Appointment,
  kind: MessageKind
): Promise<SendResult> {
  const message = buildHumanMessage(appointment, kind);
  const payload = {
    mode: getMessagingMode(),
    kind,
    message,
    whatsappPayload: buildTemplatePayload(appointment, kind)
  };

  if (getMessagingMode() !== "whatsapp" || !hasWhatsAppConfig()) {
    return {
      status: "simulated",
      sentAt: new Date().toISOString(),
      payload,
      error: null
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload.whatsappPayload)
      }
    );

    const providerResponse = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        status: "failed",
        sentAt: null,
        payload: { ...payload, providerResponse },
        error: `WhatsApp API returned ${response.status}`
      };
    }

    return {
      status: "sent",
      sentAt: new Date().toISOString(),
      payload: { ...payload, providerResponse },
      error: null
    };
  } catch (error) {
    return {
      status: "failed",
      sentAt: null,
      payload,
      error: error instanceof Error ? error.message : "Unknown WhatsApp send error"
    };
  }
}
