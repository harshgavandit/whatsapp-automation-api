import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  insertLocalAppointment,
  listLocalAppointments,
  listLocalPendingReminders,
  updateLocalAppointment
} from "@/lib/local-store";
import type { Appointment } from "@/types/appointment";

export async function listAppointments() {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return listLocalAppointments();
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createAppointment(
  appointment: Omit<Appointment, "id" | "created_at" | "updated_at">
) {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return insertLocalAppointment(appointment);
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert(appointment)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAppointment(id: string, update: Partial<Appointment>) {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return updateLocalAppointment(id, update);
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listPendingReminders() {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return listLocalPendingReminders();
  }

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("appointment_time", now.toISOString())
    .lte("appointment_time", oneHourFromNow.toISOString())
    .eq("reminder_status", "pending")
    .order("appointment_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
