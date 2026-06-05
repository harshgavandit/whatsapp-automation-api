"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNowStrict, isValid } from "date-fns";
import {
  AlertCircle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Send,
  Smartphone
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Appointment, MessageStatus } from "@/types/appointment";
import styles from "./appointment-console.module.css";

type ApiResponse = {
  appointments?: Appointment[];
  appointment?: Appointment;
  error?: string;
};

const statusLabels: Record<MessageStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  simulated: "Simulated",
  failed: "Failed",
  skipped: "Skipped"
};

function toLocalDatetimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatAppointmentTime(value: string) {
  const date = new Date(value);
  return isValid(date) ? format(date, "PPp") : value;
}

function StatusPill({ status }: { status: MessageStatus }) {
  return <span className={`${styles.status} ${styles[status]}`}>{statusLabels[status]}</span>;
}

export function AppointmentConsole() {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentMinTime, setAppointmentMinTime] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", { cache: "no-store" });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to load appointments");
      }

      setAppointments(data.appointments || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load appointments");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const now = new Date();
    setAppointmentMinTime(toLocalDatetimeValue(now));
    setAppointmentTime(toLocalDatetimeValue(new Date(now.getTime() + 2 * 60 * 60 * 1000)));
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel("appointments-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          void loadAppointments();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAppointments]);

  const dashboardStats = useMemo(() => {
    return {
      total: appointments.length,
      confirmations: appointments.filter((appointment) =>
        ["sent", "simulated"].includes(appointment.confirmation_status)
      ).length,
      reminders: appointments.filter((appointment) =>
        ["sent", "simulated"].includes(appointment.reminder_status)
      ).length
    };
  }, [appointments]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);
    setError(null);

    try {
      const localDate = new Date(appointmentTime);
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName,
          phoneNumber,
          appointmentTime: localDate.toISOString()
        })
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to create appointment");
      }

      setCustomerName("");
      setPhoneNumber("");
      const nextAppointment = new Date(Date.now() + 2 * 60 * 60 * 1000);
      setAppointmentTime(toLocalDatetimeValue(nextAppointment));
      setAppointmentMinTime(toLocalDatetimeValue(new Date()));
      setNotice(
        data.appointment?.confirmation_status === "sent"
          ? "Appointment saved and WhatsApp confirmation sent."
          : "Appointment saved and confirmation simulated."
      );
      await loadAppointments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create appointment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p className={styles.kicker}>Better Call Centers / El Paso Water Quality LLC</p>
          <h1>WhatsApp Appointment Reminder System</h1>
          <p className={styles.subtitle}>
            Enter appointments, save them to the database, and send or simulate confirmation and
            reminder messages.
          </p>
        </div>
        <div className={styles.modeBadge}>
          <Smartphone aria-hidden="true" size={18} />
          <span>WhatsApp ready</span>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Appointment summary">
        <div>
          <span>Total appointments</span>
          <strong>{dashboardStats.total}</strong>
        </div>
        <div>
          <span>Confirmations handled</span>
          <strong>{dashboardStats.confirmations}</strong>
        </div>
        <div>
          <span>Reminders handled</span>
          <strong>{dashboardStats.reminders}</strong>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="create-appointment">
          <div className={styles.panelHeader}>
            <CalendarClock aria-hidden="true" size={22} />
            <div>
              <h2 id="create-appointment">New Appointment</h2>
              <p>Confirmation sends automatically after saving.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <span>Customer name</span>
              <input
                autoComplete="name"
                maxLength={120}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Maria Lopez"
                required
                value={customerName}
              />
            </label>

            <label>
              <span>Phone number</span>
              <input
                autoComplete="tel"
                inputMode="tel"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+19155550123"
                required
                value={phoneNumber}
              />
            </label>

            <label>
              <span>Appointment time</span>
              <input
                min={toLocalDatetimeValue(new Date())}
                onChange={(event) => setAppointmentTime(event.target.value)}
                required
                type="datetime-local"
                value={appointmentTime}
              />
            </label>

            <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className={styles.spin} size={18} />
              ) : (
                <Send aria-hidden="true" size={18} />
              )}
              Save and Send
            </button>
          </form>

          {notice ? (
            <div className={styles.notice}>
              <CheckCircle2 aria-hidden="true" size={18} />
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className={styles.error}>
              <AlertCircle aria-hidden="true" size={18} />
              {error}
            </div>
          ) : null}
        </section>

        <section className={styles.panel} aria-labelledby="message-flow">
          <div className={styles.panelHeader}>
            <MessageSquareText aria-hidden="true" size={22} />
            <div>
              <h2 id="message-flow">Message Flow</h2>
              <p>Real WhatsApp sends activate when environment keys are added.</p>
            </div>
          </div>
          <ol className={styles.flow}>
            <li>
              <span>1</span>
              Form validates customer, phone, and time.
            </li>
            <li>
              <span>2</span>
              Appointment is stored in Supabase, or local fallback while keys are absent.
            </li>
            <li>
              <span>3</span>
              Server sends WhatsApp template or records simulated payload.
            </li>
            <li>
              <span>4</span>
              Dashboard shows live statuses for reviewer verification.
            </li>
          </ol>
        </section>
      </div>

      <section className={styles.dashboard} aria-labelledby="appointments-dashboard">
        <div className={styles.dashboardHeader}>
          <div>
            <h2 id="appointments-dashboard">Appointments Dashboard</h2>
            <p>All appointments are loaded from the persistence layer.</p>
          </div>
          <button className={styles.secondaryButton} onClick={loadAppointments} type="button">
            <RefreshCcw
              aria-hidden="true"
              className={isRefreshing ? styles.spin : undefined}
              size={17}
            />
            Refresh
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className={styles.empty}>
            <BellRing aria-hidden="true" size={28} />
            <strong>No appointments yet</strong>
            <span>Create one to see the confirmation status appear here.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Appointment</th>
                  <th>Confirmation</th>
                  <th>Reminder</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <strong>{appointment.customer_name}</strong>
                      {appointment.confirmation_error ? (
                        <small>{appointment.confirmation_error}</small>
                      ) : null}
                    </td>
                    <td>{appointment.phone_number}</td>
                    <td>
                      {formatAppointmentTime(appointment.appointment_time)}
                      <small>
                        {formatDistanceToNowStrict(new Date(appointment.appointment_time), {
                          addSuffix: true
                        })}
                      </small>
                    </td>
                    <td>
                      <StatusPill status={appointment.confirmation_status} />
                      {appointment.confirmation_sent_at ? (
                        <small>{formatAppointmentTime(appointment.confirmation_sent_at)}</small>
                      ) : null}
                    </td>
                    <td>
                      <StatusPill status={appointment.reminder_status} />
                      {appointment.reminder_sent_at ? (
                        <small>{formatAppointmentTime(appointment.reminder_sent_at)}</small>
                      ) : null}
                    </td>
                    <td>{formatAppointmentTime(appointment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
