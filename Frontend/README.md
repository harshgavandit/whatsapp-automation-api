# WhatsApp Appointment Reminder System

This project implements the practical test brief: a simple appointment form, database persistence, automatic WhatsApp confirmation with a simulated fallback, a live appointment dashboard, and the bonus one-hour reminder flow.

## Stack

- Next.js App Router
- Supabase PostgreSQL
- WhatsApp Cloud API
- Vercel hosting and cron
- Simulated messaging mode for demos without WhatsApp credentials

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

3. Start in simulated mode:

```bash
npm run dev
```

Without Supabase keys, the app uses `local-data.json` so the full flow can be tested locally. With Supabase keys, data is saved to the database and the dashboard can receive realtime updates.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable realtime for the `appointments` table if live push updates are desired.
4. Add the Supabase values to Vercel and `.env.local`.

## Messaging Modes

`MESSAGING_MODE=simulate` records the intended WhatsApp payload and marks the message as `simulated`.

`MESSAGING_MODE=whatsapp` sends through WhatsApp Cloud API when these values are present:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TEMPLATE_NAME`
- `WHATSAPP_TEMPLATE_LANGUAGE`

If WhatsApp credentials or template approval are unavailable, use simulated mode. The PDF allows simulation when real messaging access is not available.

## Reminder Flow

`/api/reminders` finds appointments within the next hour whose reminder status is still `pending`. It sends or simulates one reminder and stores the result in the database. Vercel runs this every 10 minutes through `vercel.json`.

If `CRON_SECRET` is set, call the route with:

```bash
Authorization: Bearer YOUR_SECRET
```

## Submission Notes

Submit:

- The live Vercel app link
- The full source code
- A short 5-10 sentence explanation
- The actual time spent

Suggested explanation:

> I built a Next.js appointment reminder app using Supabase for appointment storage and WhatsApp Cloud API for outbound messages. The user enters a customer name, phone number, and appointment time, then the server validates the input, saves the record, and sends a confirmation message. The dashboard reads appointments from the persistence layer and shows confirmation and reminder statuses. When WhatsApp credentials or approved templates are unavailable, the app uses simulated mode and records the exact intended message payload. A scheduled reminder endpoint checks for appointments within the next hour and sends or simulates one reminder. The hardest part was designing the messaging layer so the app remains fully demonstrable without real WhatsApp access while still keeping the production API path clear.
