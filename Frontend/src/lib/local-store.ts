import { promises as fs } from "fs";
import path from "path";
import type { Appointment } from "@/types/appointment";

const dataPath = path.join(process.cwd(), "local-data.json");

type LocalData = {
  appointments: Appointment[];
};

async function readData(): Promise<LocalData> {
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    return JSON.parse(raw) as LocalData;
  } catch {
    return { appointments: [] };
  }
}

async function writeData(data: LocalData) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

export async function listLocalAppointments() {
  const data = await readData();
  return data.appointments.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function insertLocalAppointment(
  appointment: Omit<Appointment, "id" | "created_at" | "updated_at">
) {
  const data = await readData();
  const now = new Date().toISOString();
  const row: Appointment = {
    ...appointment,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now
  };

  data.appointments.unshift(row);
  await writeData(data);
  return row;
}

export async function updateLocalAppointment(id: string, update: Partial<Appointment>) {
  const data = await readData();
  const index = data.appointments.findIndex((appointment) => appointment.id === id);

  if (index === -1) {
    throw new Error("Appointment not found");
  }

  const row = {
    ...data.appointments[index],
    ...update,
    updated_at: new Date().toISOString()
  };

  data.appointments[index] = row;
  await writeData(data);
  return row;
}

export async function listLocalPendingReminders(now = new Date()) {
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const data = await readData();

  return data.appointments.filter((appointment) => {
    const appointmentTime = new Date(appointment.appointment_time);
    return (
      appointmentTime >= now &&
      appointmentTime <= oneHourFromNow &&
      appointment.reminder_status === "pending"
    );
  });
}
